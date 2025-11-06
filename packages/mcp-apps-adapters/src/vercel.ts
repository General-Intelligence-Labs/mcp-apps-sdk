import { z } from 'zod';
import type { Client } from '@xalia/mcp-client';
import { listTools, callTool, readResource } from '@xalia/mcp-client';
import type { WidgetMetaData } from '@xalia/mcp-client';

// CoreTool type for Vercel AI SDK
type CoreTool = {
  description?: string;
  inputSchema: z.ZodTypeAny;
  execute: (args: any) => Promise<any>;
};

function normalizeToolArguments(
  args: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!args) return {};

  const normalizedArgs: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    normalizedArgs[key] = value === undefined ? null : value;
  }
  return normalizedArgs;
}

export async function createVercelAITools(
  mcpClient: Client,
  options?: {
    onWidgetFetch?: (uri: string, html: string) => Promise<void>;
  }
): Promise<Record<string, CoreTool>> {
  const mcpTools = await listTools(mcpClient);
  const tools: Record<string, CoreTool> = {};

  for (const mcpTool of mcpTools) {
    const executeFunc = async (args: any) => {
      console.log(`[MCP] Calling tool: ${mcpTool.name}`);
      const normalizedArgs = normalizeToolArguments(args);
      const result = await callTool(mcpClient, mcpTool.name, normalizedArgs);

      let metadata: WidgetMetaData = result._meta || {};
      let widgetHtml: string | undefined;

      if (metadata['openai/outputTemplate']) {
        const resourceUri = metadata['openai/outputTemplate'];
        console.log(`[MCP] Fetching widget from resource: ${resourceUri}`);

        const resource = await readResource(mcpClient, resourceUri);
        if (resource?.text) {
          widgetHtml = resource.text;
          metadata = {
            ...metadata,
            'openai/widgetAccessible': true,
          };

          if (options?.onWidgetFetch) {
            await options.onWidgetFetch(resourceUri, widgetHtml);
          }
        }
      }

      const text = result.content
        .filter((item) => item.type === 'text')
        .map((item) => item.text)
        .join('\n');

      return {
        text,
        metadata,
        structuredContent: result.structuredContent,
        widgetHtml,
      };
    };

    const inputSchema = mcpTool.inputSchema || {
      type: 'object',
      properties: {},
      required: [],
    };

    const zodSchema = z.object(
      Object.entries(inputSchema.properties || {}).reduce(
        (acc, [key, value]) => {
          acc[key] = z.any();
          return acc;
        },
        {} as Record<string, z.ZodTypeAny>
      )
    );

    tools[mcpTool.name] = {
      description: mcpTool.description || `MCP Tool: ${mcpTool.name}`,
      inputSchema: zodSchema,
      execute: executeFunc,
    };
  }

  return tools;
}