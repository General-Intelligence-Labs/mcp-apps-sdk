# @xalia/mcp-apps-sdk

Complete SDK for building MCP-powered applications. This package provides a unified entry point to all MCP SDK components.

## Installation

```bash
npm install @xalia/mcp-apps-sdk
```

This single command installs everything you need to build MCP-powered applications!

## What's Included

- **MCP Client** - Connect to and communicate with MCP servers
- **Adapters** - Integrate MCP tools with popular AI frameworks (OpenAI, Vercel AI SDK)
- **Widget Components** - React components for rendering MCP app interfaces

## Quick Start

```typescript
import { 
  createMCPClient,
  createOpenAIFunctions,
  AssistantAppEmbed 
} from '@xalia/mcp-apps-sdk';

// Create an MCP client
const client = createMCPClient({
  serverPath: './my-mcp-server.js'
});

// Convert MCP tools to OpenAI format
const openaiTools = await createOpenAIFunctions(client);

// Use in your OpenAI API calls
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }],
  tools: openaiTools
});
```

## Usage Patterns

### 1. Simple Import (Recommended for Most Use Cases)

Import everything from the main entry point:

```typescript
import { 
  createMCPClient,
  createOpenAIFunctions,
  createVercelAITools,
  AssistantAppEmbed 
} from '@xalia/mcp-apps-sdk';
```

### 2. Modular Imports (For Optimized Bundle Size)

Import specific modules:

```typescript
// Client only
import { createMCPClient } from '@xalia/mcp-apps-sdk/client';

// Adapters
import { createOpenAIFunctions } from '@xalia/mcp-apps-sdk/adapters/openai';
import { createVercelAITools } from '@xalia/mcp-apps-sdk/adapters/vercel';

// Widget components
import { AssistantAppEmbed } from '@xalia/mcp-apps-sdk/widget';
import { createWidgetHandler } from '@xalia/mcp-apps-sdk/widget/server';
```

### 3. Individual Packages (For Advanced Use Cases)

If you only need specific functionality, you can install individual packages:

```bash
npm install @xalia/mcp-client
npm install @xalia/mcp-apps-adapters
npm install @xalia/mcp-apps-widget
```

## Examples

### With OpenAI SDK

```typescript
import { createMCPClient, createOpenAIFunctions } from '@xalia/mcp-apps-sdk';
import OpenAI from 'openai';

const openai = new OpenAI();
const mcpClient = createMCPClient({ serverPath: './server.js' });

const openaiTools = await createOpenAIFunctions(mcpClient);

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'What can you do?' }],
  tools: openaiTools
});
```

### With Vercel AI SDK

```typescript
import { createMCPClient, createVercelAITools } from '@xalia/mcp-apps-sdk';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const mcpClient = createMCPClient({ serverPath: './server.js' });

const vercelTools = await createVercelAITools(mcpClient);

const { text } = await generateText({
  model: openai('gpt-4'),
  prompt: 'What tools do you have access to?',
  tools: vercelTools
});
```

### With React Components

```typescript
import { AssistantAppEmbed } from '@xalia/mcp-apps-sdk';

function MyApp() {
  return (
    <AssistantAppEmbed
      src="/widget/my-app"
      title="My MCP App"
      width="100%"
      height="600px"
    />
  );
}
```

## Documentation

For detailed documentation, visit the [MCP Apps SDK repository](https://github.com/General-Intelligence-Labs/mcp-apps-sdk).

## Individual Packages

This is an umbrella package that bundles:

- [`@xalia/mcp-client`](../mcp-client) - MCP client library
- [`@xalia/mcp-apps-adapters`](../mcp-apps-adapters) - Framework adapters
- [`@xalia/mcp-apps-widget`](../mcp-apps-widget) - React widget components

## License

MIT

