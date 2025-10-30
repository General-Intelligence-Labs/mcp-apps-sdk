import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { ResourceContent } from './types.js';

export async function readResource(
  client: Client,
  uri: string
): Promise<ResourceContent | null> {
  try {
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

export async function listResources(client: Client) {
  const result = await client.listResources();
  return result.resources;
}