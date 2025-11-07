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
## Installation

Get started quickly with a single command:

```bash
npm install @xalia/mcp-apps-sdk
```

This installs everything you need to build MCP-powered applications! ✨

### What's Included

- **MCP Client** - Connect to and communicate with MCP servers
- **Adapters** - Integrate with popular AI frameworks (OpenAI, Vercel AI SDK)
- **Widget Components** - React components for rendering MCP app interfaces

### Alternative: Modular Installation

For advanced users who want smaller bundle sizes, install only what you need:

```bash
# For agent developers - render MCP app widgets only
npm install @xalia/mcp-apps-widget

# For MCP app developers - client and adapters only
npm install @xalia/mcp-client @xalia/mcp-apps-adapters
```

## Packages

This monorepo contains four packages:

### [@xalia/mcp-apps-sdk](./packages/mcp-apps-sdk) ⭐
**Complete SDK** - Unified package with everything you need. Install this for the simplest setup.

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
│   ├── mcp-apps-sdk/             # ⭐ Complete SDK (umbrella package)
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

## 📚 Usage

### Simple Import (Recommended)

Install the complete SDK and import everything from one place:

```bash
npm install @xalia/mcp-apps-sdk
```

```typescript
import { 
  createMCPClient, 
  connectMCPClient,
  createVercelAITools,
  AssistantAppEmbed 
} from '@xalia/mcp-apps-sdk';

// Connect to MCP server
const client = await createMCPClient({ name: 'my-app', version: '1.0.0' });
await connectMCPClient(client, transport);

// Convert MCP tools for use with AI SDKs
const tools = await createVercelAITools(client);
```

### Modular Imports (For Optimized Bundle Size)

Use specific entry points when you need fine-grained control:

```typescript
// Client only
import { createMCPClient } from '@xalia/mcp-apps-sdk/client';

// Adapters
import { createOpenAIFunctions } from '@xalia/mcp-apps-sdk/adapters/openai';
import { createVercelAITools } from '@xalia/mcp-apps-sdk/adapters/vercel';

// Widget components
import { AssistantAppEmbed } from '@xalia/mcp-apps-sdk/widget';
```

### For Agent Developers

If you only need to render MCP app widgets:

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
