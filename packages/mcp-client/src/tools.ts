import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { MCPTool, MCPToolResult } from './types.js';

export async function listTools(client: Client): Promise<MCPTool[]> {
  const result = await client.listTools();
  return result.tools as MCPTool[];
}

export async function callTool(
  client: Client,
  toolName: string,
  args: Record<string, unknown> | undefined
): Promise<MCPToolResult> {
  const result = await client.callTool({
    name: toolName,
    arguments: args,
  });

  return result as MCPToolResult;
}