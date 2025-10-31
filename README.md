# MCP Apps SDK

Open-source SDK for building applications with the Model Context Protocol (MCP) and OpenAI Apps framework.

This SDK is designed for two types of developers:
- **Agent developers** who want to integrate MCP-based App UI into their own agents
- **MCP app developers** who are developing MCP-based Apps that can be inlined in ChatGPT and other platforms

## 📦 Packages

This monorepo contains three core packages:

### [@xalia/mcp-apps-widget](./packages/mcp-apps-widget)
React components and utilities for rendering MCP app widgets in secure iframes with PostMessage communication.

### [@xalia/mcp-client](./packages/mcp-client)
TypeScript client for connecting to and interacting with MCP servers, including tool discovery and execution.

### [@xalia/mcp-apps-adapters](./packages/mcp-apps-adapters)
Adapters for integrating MCP tools with popular AI frameworks like Vercel AI SDK and OpenAI.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 10+
- An MCP server running (default: `http://localhost:8002/mcp`)

### Installation

```bash
# Clone the repository
git clone https://github.com/general-intelligence-labs/mcp-apps-sdk.git
cd mcp-apps-sdk

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Run the Example

```bash
# Navigate to the chatbot example
cd examples/chatbot

# Set up your OpenAI API key
cp .env.local.example .env.local
# Edit .env.local and add your OPENAI_API_KEY

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the chatbot with MCP tool integration.

## 💻 Development

### Project Structure

```
mcp-apps-sdk/
├── packages/
│   ├── mcp-apps-widget/     # Widget rendering components
│   ├── mcp-client/           # MCP protocol client
│   └── mcp-apps-adapters/    # AI framework adapters
├── examples/
│   └── chatbot/              # Example Next.js chatbot app
└── package.json              # Root package.json
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

## 📖 Documentation

- [OpenAI Apps SDK Documentation](https://developers.openai.com/apps-sdk/)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [Package-specific READMEs](./packages/)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🔗 Links

- [GitHub Repository](https://github.com/general-intelligence-labs/mcp-apps-sdk)
- [npm Packages](https://www.npmjs.com/org/xalia)
- [Issue Tracker](https://github.com/general-intelligence-labs/mcp-apps-sdk/issues)