import { Client } from '@modelcontextprotocol/sdk/client/index.js';

export type MCPClientConfig = {
  name: string;
  version: string;
};

export type MCPCapabilities = {
  tools?: Record<string, never>;
  resources?: Record<string, never>;
  prompts?: Record<string, never>;
};

let clients = new Map<string, Client>();

export async function createMCPClient(
  config: MCPClientConfig,
  capabilities: MCPCapabilities = {
    tools: {},
    resources: {},
  }
): Promise<Client> {
  const client = new Client(config, { capabilities });
  return client;
}

export async function connectMCPClient(
  client: Client,
  transport: any,
  clientId?: string
): Promise<Client> {
  await client.connect(transport);

  if (clientId) {
    clients.set(clientId, client);
  }

  return client;
}

export function getMCPClient(clientId: string): Client | undefined {
  return clients.get(clientId);
}

export function clearMCPClient(clientId: string): boolean {
  return clients.delete(clientId);
}

export function clearAllMCPClients(): void {
  clients.clear();
}