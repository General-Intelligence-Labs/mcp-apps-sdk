import {
  createMCPClient,
  connectMCPClient,
  StreamableHTTPClientTransport,
  type Client,
} from '@xalia/mcp-apps-sdk';

let mcpClient: Client | null = null;

export async function getMCPClient(): Promise<Client> {
  if (mcpClient) {
    return mcpClient;
  }

  const client = await createMCPClient({
    name: 'chatbot-example',
    version: '1.0.0',
  });

  const transport = new StreamableHTTPClientTransport(
    new URL('http://localhost:8002/mcp')
  );

  await connectMCPClient(client, transport, 'default');
  mcpClient = client;

  console.log('[MCP] Connected to server at localhost:8002');
  return client;
}