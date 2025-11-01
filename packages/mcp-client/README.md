# @xalia/mcp-client

TypeScript client for Model Context Protocol (MCP) servers.

## Installation

```bash
npm install @xalia/mcp-client
# or
pnpm add @xalia/mcp-client
```

## Usage

### Basic Connection

```typescript
import {
  createMCPClient,
  connectMCPClient,
  StreamableHTTPClientTransport
} from '@xalia/mcp-client';
import { listTools, callTool, readResource } from '@xalia/mcp-client';

// Create and connect client
const client = await createMCPClient({
  name: 'my-app',
  version: '1.0.0'
});

const transport = new StreamableHTTPClientTransport(
  new URL('http://localhost:8002/mcp')
);

await connectMCPClient(client, transport);

// Use the client
const tools = await listTools(client);
const result = await callTool(client, 'tool-name', { arg: 'value' });
const resource = await readResource(client, 'resource-uri');
```

### Transport Options

```typescript
// HTTP/SSE Transport
import { StreamableHTTPClientTransport } from '@xalia/mcp-client/transports';

// WebSocket Transport
import { WebSocketClientTransport } from '@xalia/mcp-client/transports';

// Stdio Transport (for local processes)
import { StdioClientTransport } from '@xalia/mcp-client/transports';
```

## Features

- Multiple transport protocols (HTTP, WebSocket, stdio)
- Tool discovery and execution
- Resource fetching
- Connection pooling
- Error handling

## License

MIT