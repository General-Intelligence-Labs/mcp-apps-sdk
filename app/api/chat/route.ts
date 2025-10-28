import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';
import type { Tool, ToolSet } from 'ai';
import { z } from 'zod';
import { listMCPTools, callMCPTool, getMCPResource } from '@/lib/mcpClient';

type JsonSchema = {
  type?: string | string[] | null;
  description?: string;
  properties?: Record<string, JsonSchema | undefined>;
  required?: string[];
  items?: JsonSchema;
  enum?: Array<string | number | boolean>;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
  default?: unknown;
};

const toTypeArray = (type?: string | string[] | null): string[] => {
  if (!type) {
    return [];
  }

  return Array.isArray(type) ? type : [type];
};

const applyDescription = <T extends z.ZodTypeAny>(schema: T, description?: string) =>
  description ? schema.describe(description) : schema;

const buildZodFromJsonSchema = (schema?: JsonSchema): z.ZodTypeAny => {
  if (!schema) {
    return z.unknown();
  }

  if (schema.enum && schema.enum.length > 0) {
    const enumValues = schema.enum;
    const stringValues = enumValues.filter((value): value is string => typeof value === 'string');

    if (stringValues.length === enumValues.length && stringValues.length > 0) {
      return applyDescription(
        z.enum([stringValues[0], ...stringValues.slice(1)] as [string, ...string[]]),
        schema.description
      );
    }
  }

  const types = toTypeArray(schema.type);

  if (types.includes('string')) {
    return applyDescription(z.string(), schema.description);
  }

  if (types.includes('number') || types.includes('integer')) {
    const base = z.number();
    return applyDescription(types.includes('integer') ? base.int() : base, schema.description);
  }

  if (types.includes('boolean')) {
    return applyDescription(z.boolean(), schema.description);
  }

  if (types.includes('array')) {
    const itemSchema = buildZodFromJsonSchema(schema.items);
    return applyDescription(z.array(itemSchema), schema.description);
  }

  if (types.includes('object') || schema.properties) {
    return buildZodObjectSchema(schema);
  }

  if (schema.anyOf?.length) {
    return applyDescription(z.union(schema.anyOf.map(buildZodFromJsonSchema)), schema.description);
  }

  if (schema.oneOf?.length) {
    return applyDescription(z.union(schema.oneOf.map(buildZodFromJsonSchema)), schema.description);
  }

  if (schema.allOf?.length) {
    const [first, ...rest] = schema.allOf;
    const initial = buildZodFromJsonSchema(first);
    return applyDescription(
      rest.reduce(
        (acc, current) => z.intersection(acc, buildZodFromJsonSchema(current)),
        initial
      ),
      schema.description
    );
  }

  return applyDescription(z.unknown(), schema.description);
};

const buildZodObjectSchema = (schema?: JsonSchema) => {
  const requiredKeys = new Set(schema?.required ?? []);

  const properties = Object.entries(schema?.properties ?? {}).reduce<
    Record<string, z.ZodTypeAny>
  >((acc, [key, value]) => {
    const propertySchema = buildZodFromJsonSchema(value);
    acc[key] = requiredKeys.has(key) ? propertySchema : propertySchema.optional();
    return acc;
  }, {});

  return applyDescription(z.object(properties).strip(), schema?.description);
};

const buildToolParameterSchema = (schema?: JsonSchema) => {
  const types = toTypeArray(schema?.type);

  if (!schema || types.includes('object') || schema.properties) {
    return buildZodObjectSchema(schema);
  }

  if (types.length === 0 || types.includes('null') || types.includes('None')) {
    return z.object({});
  }

  const valueSchema = buildZodFromJsonSchema(schema);

  return z
    .object({
      value: valueSchema,
    })
    .strict()
    .describe(schema.description ?? 'Auto-generated wrapper for non-object schema');
};

const normalizeToolArguments = (args: unknown, schema?: JsonSchema): unknown => {
  const types = toTypeArray(schema?.type);

  if (!schema || types.includes('object') || schema?.properties) {
    return (args as Record<string, unknown>) ?? {};
  }

  if (types.length === 0 || types.includes('null') || types.includes('None')) {
    return {};
  }

  if (args && typeof args === 'object' && 'value' in args) {
    return (args as { value: unknown }).value;
  }

  return args;
};

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages = [] }: { messages?: Array<Record<string, unknown>> } = await req.json();

  const mcpTools = await listMCPTools();
  console.log('[Chat] Available MCP tools:', mcpTools.map((t) => t.name));

  const tools: ToolSet = {};

  for (const mcpTool of mcpTools) {
    const toolName = mcpTool.name;
    const schema = (mcpTool.inputSchema ?? undefined) as JsonSchema | undefined;
    console.log('[Chat] Tool schema', toolName, JSON.stringify(schema));
    const parameters = buildToolParameterSchema(schema);

    const executeFunc = async (args: unknown) => {
      const parsedArgs = parameters.parse(args ?? {});
      const normalizedArgs = normalizeToolArguments(parsedArgs, schema);
      console.log(`[Chat] Calling MCP tool ${toolName} with args:`, normalizedArgs);
      const result = await callMCPTool(toolName, normalizedArgs);
      console.log('[Chat] MCP tool result', toolName, JSON.stringify(result, null, 2));

      const metadata = { ...(result._meta ?? {}) };
      const structuredContent = result.structuredContent;

      let widgetHtml: string | null = null;
      if (metadata?.['openai/outputTemplate']) {
        const resourceUri = metadata['openai/outputTemplate'];
        console.log('[Chat] Fetching widget resource:', resourceUri);
        const resource = await getMCPResource(resourceUri);

        if (resource?.text) {
          widgetHtml = resource.text;
          if (!metadata['openai/widgetAccessible']) {
            metadata['openai/widgetAccessible'] = true;
          }
        }
      }

      return {
        text: result.content.map((c) => c.text).join('\n'),
        metadata,
        structuredContent,
        widgetHtml,
      };
    };

    const toolDefinition: Tool<z.infer<typeof parameters>, unknown> = {
      description: mcpTool.description || `Call ${toolName}`,
      inputSchema: parameters,
      execute: executeFunc,
    };

    tools[toolName] = toolDefinition;
    console.log('[Chat] Registered tool', toolName, toolDefinition);
  }

  const coreMessages = convertToCoreMessages(
    messages.map((message) => {
      const { id: _ignore, ...rest } = message;
      void _ignore;
      return rest;
    }),
    { tools }
  );

  const result = streamText({
    model: openai('gpt-4o'),
    messages: coreMessages,
    tools,
  });

  return result.toUIMessageStreamResponse();
}
