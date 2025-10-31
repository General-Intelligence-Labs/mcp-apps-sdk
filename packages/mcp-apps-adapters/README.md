# @xalia/mcp-apps-adapters

Adapters for integrating MCP tools with popular AI frameworks.

## Installation

```bash
npm install @xalia/mcp-apps-adapters
# or
pnpm add @xalia/mcp-apps-adapters
```

## Usage

### Vercel AI SDK

```typescript
import { createVercelAITools } from '@xalia/mcp-apps-adapters/vercel';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Convert all MCP tools to Vercel AI format
const tools = await createVercelAITools(mcpClient);

// Use with Vercel AI SDK
const result = await streamText({
  model: openai('gpt-4'),
  messages,
  tools,
});
```

### OpenAI SDK (Coming Soon)

```typescript
import { createOpenAIFunctions } from '@xalia/mcp-apps-adapters/openai';

// Convert MCP tools to OpenAI function format
const functions = await createOpenAIFunctions(mcpClient);
```

## Features

- Automatic tool format conversion
- Widget metadata handling
- Streaming support
- Multiple framework adapters

## Supported Frameworks

- ✅ Vercel AI SDK
- 🚧 OpenAI SDK (planned)

## License

MIT