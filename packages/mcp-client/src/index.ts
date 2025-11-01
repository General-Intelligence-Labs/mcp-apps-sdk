export {
  createMCPClient,
  connectMCPClient,
  getMCPClient,
  clearMCPClient,
  clearAllMCPClients,
} from './client';

export { listTools, callTool } from './tools';
export { readResource, listResources } from './resources';

export type {
  MCPClientConfig,
  MCPCapabilities,
} from './client';

export type {
  WidgetMetaData,
  ResourceContent,
  MCPToolResult,
  MCPTool,
} from './types';

// Re-export transports for convenience
export { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export { Client } from '@modelcontextprotocol/sdk/client/index.js';