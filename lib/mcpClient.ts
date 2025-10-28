import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export type WidgetMetaData = {
  'openai/outputTemplate'?: string;
  'openai/toolInvocation/invoking'?: string;
  'openai/toolInvocation/invoked'?: string;
  'openai/widgetAccessible'?: boolean;
  'openai/resultCanProduceWidget'?: boolean;
};

export type ResourceContent = {
  uri: string;
  text?: string;
  mimeType?: string;
};

export type MCPToolResult = {
  content: Array<{ type: string; text: string }>;
  structuredContent?: unknown;
  _meta?: WidgetMetaData;
};

let mcpClient: Client | null = null;

export async function getMCPClient(): Promise<Client> {
  if (mcpClient) {
    return mcpClient;
  }

  const transport = new StreamableHTTPClientTransport(
    new URL('http://localhost:8002/mcp')
  );

  const client = new Client(
    {
      name: 'my-ai-app',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  await client.connect(transport);
  mcpClient = client;

  console.log('[MCP] Connected to server at localhost:8002');
  return client;
}

export async function listMCPTools() {
  const client = await getMCPClient();
  const tools = await client.listTools();
  return tools.tools;
}

export async function callMCPTool(
  toolName: string,
  args: Record<string, unknown> | undefined
): Promise<MCPToolResult> {
  const client = await getMCPClient();
  const result = await client.callTool({
    name: toolName,
    arguments: args,
  });

  return result as MCPToolResult;
}

export async function getMCPResource(uri: string): Promise<ResourceContent | null> {
  try {
    const client = await getMCPClient();
    const result = await client.readResource({ uri });
    
    if (result.contents && result.contents.length > 0) {
      const content = result.contents[0] as any;
      return {
        uri: content.uri as string,
        text: content.text as string | undefined,
        mimeType: content.mimeType as string | undefined,
      };
    }
    
    return null;
  } catch (error) {
    console.error('[MCP] Error fetching resource:', error);
    return null;
  }
}
