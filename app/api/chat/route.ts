import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, jsonSchema } from 'ai';
import type { Tool, ToolSet, JSONSchema7 } from 'ai';
import { listMCPTools, callMCPTool, getMCPResource } from '@/lib/mcpClient';
import type { WidgetMetaData, MCPToolResult } from '@/lib/mcpClient';

const isJsonSchema = (schema: unknown): schema is JSONSchema7 =>
  Boolean(schema) && typeof schema === 'object' && !Array.isArray(schema);

// Rough check so we only coerce missing args to `{}` when the schema actually
// expects an object (or unions/intersections that can resolve to one).
const schemaImpliesObject = (schema?: JSONSchema7): boolean => {
  if (!schema) {
    return true;
  }

  const { type, properties, anyOf, oneOf, allOf } = schema;

  if (properties && Object.keys(properties).length > 0) {
    return true;
  }

  if (type) {
    const types = (Array.isArray(type) ? type : [type]).map((value) => String(value));
    if (types.some((value) => value === 'object' || value === 'null' || value === 'None')) {
      return true;
    }
    return false;
  }

  const compositeGroups = [anyOf, oneOf, allOf];
  if (
    compositeGroups.some((group) =>
      group?.some(
        (entry) => typeof entry === 'object' && entry !== null && schemaImpliesObject(entry as JSONSchema7)
      )
    )
  ) {
    return true;
  }

  return true;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

type MCPToolExecuteInput = Record<string, unknown> | undefined;

type MCPToolExecuteResult = {
  text: string;
  metadata: WidgetMetaData;
  structuredContent: MCPToolResult['structuredContent'];
  widgetHtml: string | null;
};

const normalizeToolArguments = (
  args: unknown,
  schema?: JSONSchema7
): MCPToolExecuteInput => {
  if (!schemaImpliesObject(schema)) {
    return isRecord(args) ? args : undefined;
  }

  return isRecord(args) ? args : {};
};

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages = [] }: { messages?: Array<Record<string, unknown>> } = await req.json();

  const mcpTools = await listMCPTools();
  console.log('[Chat] Available MCP tools:', mcpTools.map((t) => t.name));

  const tools: ToolSet = {};

  for (const mcpTool of mcpTools) {
    const toolName = mcpTool.name;
    const schema = isJsonSchema(mcpTool.inputSchema) ? mcpTool.inputSchema : undefined;

    const executeFunc = async (args: MCPToolExecuteInput): Promise<MCPToolExecuteResult> => {
      const normalizedArgs = normalizeToolArguments(args, schema);
      console.log(`[Chat] Calling MCP tool ${toolName} with args:`, normalizedArgs);
      const result = await callMCPTool(toolName, normalizedArgs);

      const metadata: WidgetMetaData = { ...(result._meta ?? {}) };
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

    const defaultInputSchema: JSONSchema7 = { type: 'object' };
    const toolDefinition: Tool<MCPToolExecuteInput, MCPToolExecuteResult> = {
      description: mcpTool.description || `Call ${toolName}`,
      inputSchema: jsonSchema(schema ?? defaultInputSchema),
      execute: executeFunc,
    };

    tools[toolName] = toolDefinition;
    console.log('[Chat] Registered tool', toolName, toolDefinition);
  }

  const sanitizedMessages = messages.map(({ id: _unused, ...rest }) => {
    void _unused;
    return rest;
  }) as Parameters<typeof convertToModelMessages>[0];

  const coreMessages = convertToModelMessages(sanitizedMessages, { tools });

  const result = streamText({
    model: openai('gpt-4o'),
    messages: coreMessages,
    tools,
  });

  return result.toUIMessageStreamResponse();
}
