# MCP Apps SDK

[![CI](https://github.com/general-intelligence-labs/mcp-apps-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/general-intelligence-labs/mcp-apps-sdk/actions/workflows/ci.yml)
[![Discord](https://img.shields.io/badge/Discord-Join%20Chat-7289da?logo=discord&logoColor=white)](https://discord.gg/KMTMkCJ3tq)

<img width="718" height="542" alt="Screenshot 2025-11-04 at 10 41 53 PM" src="https://github.com/user-attachments/assets/dc67d630-530e-4d15-9460-24f59a7cfb60" />

Open-source SDK for building applications with the Model Context Protocol (MCP) that is compatible with [OpenAI Apps SDK](https://developers.openai.com/apps-sdk).

This SDK is useful for two types of developers:
- **Agent developers** who want to integrate MCP-based App UI into their own agents
- **MCP App developers** who are developing MCP-based Apps that can be integrated with ChatGPT and other agents

## Demo Video

https://github.com/user-attachments/assets/7d13d4f8-2da7-40b1-a102-7745a1d5cc95

## Packages

This monorepo contains three core packages:

### [@xalia/mcp-apps-widget](./packages/mcp-apps-widget)
React components and utilities for rendering MCP app widgets in secure iframes with PostMessage communication.

### [@xalia/mcp-client](./packages/mcp-client)
TypeScript client for connecting to and interacting with MCP servers, including tool discovery and execution.

### [@xalia/mcp-apps-adapters](./packages/mcp-apps-adapters)
Adapters for integrating MCP tools with popular AI frameworks like Vercel AI SDK and OpenAI.

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 10+
- An MCP server running (default: `http://localhost:8002/mcp`)

### Installation

```bash
# Clone the repository with submodules
git clone --recurse-submodules https://github.com/general-intelligence-labs/mcp-apps-sdk.git
cd mcp-apps-sdk

# Or if you already cloned without submodules
git submodule update --init --recursive

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Run the Example

The chatbot example requires an MCP server and a static file server for widgets. See [examples/chatbot/README.md](examples/chatbot/README.md) for detailed setup instructions.

Quick start:
```bash
# Terminal 1: Start static file server
cd examples/openai-apps-sdk-examples
pnpm install && pnpm build
pnpm run serve  # Serves on port 4444

# Terminal 2: Start MCP server
cd examples/openai-apps-sdk-examples/solar-system_server_python
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8002

# Terminal 3: Start the chatbot
cd examples/chatbot
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the chatbot with MCP tool integration.

## Development

### Project Structure

```
mcp-apps-sdk/
├── packages/
│   ├── mcp-apps-widget/          # Widget rendering components
│   ├── mcp-client/               # MCP protocol client
│   └── mcp-apps-adapters/        # AI framework adapters
├── examples/
│   ├── chatbot/                  # Example Next.js chatbot app
│   └── openai-apps-sdk-examples/ # OpenAI SDK examples (git submodule)
└── package.json                  # Root package.json
```

### Available Scripts

```bash
# Build all packages
pnpm build

# Run all packages in development mode
pnpm dev

# Run tests
pnpm test

# Lint code
pnpm lint

# Clean all build artifacts
pnpm clean
```

## 📚 Using the Packages

### For Agent Developers

Install the widget package to render MCP app widgets:

```bash
npm install @xalia/mcp-apps-widget
```

```tsx
import { AssistantAppEmbed } from '@xalia/mcp-apps-widget';

function MyApp() {
  return (
    <AssistantAppEmbed
      widgetHtml={widgetHtml}
      toolOutput={result}
      metadata={metadata}
    />
  );
}
```

### For MCP App Developers

Use the complete SDK to build MCP-powered applications:

```bash
npm install @xalia/mcp-client @xalia/mcp-apps-adapters
```

```typescript
import { createMCPClient, connectMCPClient } from '@xalia/mcp-client';
import { createVercelAITools } from '@xalia/mcp-apps-adapters/vercel';

// Connect to MCP server
const client = await createMCPClient({ name: 'my-app', version: '1.0.0' });
await connectMCPClient(client, transport);

// Convert MCP tools for use with AI SDKs
const tools = await createVercelAITools(client);
```

## Community

Join our Discord community for discussions, support, and updates:

[![Discord](https://img.shields.io/badge/Discord-Join%20our%20community-7289da?logo=discord&logoColor=white&style=for-the-badge)](https://discord.gg/KMTMkCJ3tq)

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## External Resources

- [OpenAI Apps SDK Documentation](https://developers.openai.com/apps-sdk/)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
