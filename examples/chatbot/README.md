# MCP Chatbot Example

This example demonstrates how to build a chatbot application that integrates MCP (Model Context Protocol) tools with OpenAI's GPT-4o model using the Vercel AI SDK.

## Prerequisites

1. **Node.js 18+** and **pnpm 10+** installed
2. **OpenAI API Key** - Set in your environment or `.env.local` file
3. **MCP Server** - You need an MCP server running at `http://localhost:8002/mcp`

## Setup

### 1. Install Dependencies

From the root of the monorepo:

```bash
pnpm install
pnpm build
```

### 2. Configure OpenAI API Key

Create a `.env.local` file in the `examples/chatbot` directory:

```bash
OPENAI_API_KEY=your-openai-api-key-here
```

### 3. Start an MCP Server

**IMPORTANT**: This example requires an MCP server that implements the OpenAI Apps SDK protocol running at `http://localhost:8002/mcp`.

The MCP server must be compatible with the OpenAI Apps SDK protocol, which provides tool definitions and handles tool execution with optional widget rendering capabilities.

#### Quick Start with the Solar System Example

The OpenAI SDK examples are included as a git submodule in this repository. You need to run two servers: the MCP server and a static file server.

**Initial Setup (one-time)**:

1. Initialize and update the submodule:
```bash
# From the monorepo root
git submodule update --init --recursive
```

2. Build the widget assets:
```bash
cd examples/openai-apps-sdk-examples
pnpm install
pnpm run build
```
This creates the `assets/` folder with the Solar System widget HTML, CSS, and JavaScript files.

**Running the Servers**:

You need to run two servers in separate terminals:

**Terminal 1 - Static File Server** (for widget assets):
```bash
# From examples/openai-apps-sdk-examples
pnpm run serve
```
This serves the widget assets on `http://localhost:4444` with CORS enabled.

**Terminal 2 - MCP Server** (for tool execution):
```bash
# From examples/openai-apps-sdk-examples/solar-system_server_python
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run on port 8002 (instead of default 8000)
uvicorn main:app --port 8002
```

The Solar System example consists of:
- **MCP Server** (port 8002): Handles tool discovery and execution via the MCP protocol
- **Static File Server** (port 4444): Serves the widget's CSS, JavaScript, and other assets
- **Widget HTML**: Interactive 3D solar system visualization using Three.js

Both servers must be running for the widgets to work properly. The chatbot example is configured to allow resources from both localhost ports in development mode.

#### Creating Your Own MCP Server

If you want to create your own MCP server, it must:
- Implement the OpenAI Apps SDK protocol at the `/mcp` endpoint
- Support tool discovery (listing available tools)
- Handle tool execution requests
- Optionally provide widget HTML via the `openai/outputTemplate` metadata
- Follow the protocol specification from [OpenAI Apps SDK](https://developers.openai.com/apps-sdk)

### 4. Run the Example

```bash
cd examples/chatbot
pnpm dev
```

The application will be available at `http://localhost:3000`.

## How It Works

1. **MCP Client Connection**: The app connects to your MCP server at startup (`lib/mcpSetup.ts`)
2. **Tool Discovery**: It fetches available tools from the MCP server
3. **Tool Integration**: MCP tools are converted to Vercel AI SDK format using the adapter
4. **Chat Interface**: Users can interact with GPT-4o, which can call MCP tools as needed
5. **Widget Rendering**: If tools return widget HTML, they're rendered in secure iframes

## Architecture

```
User Input → Chat UI → API Route → MCP Client → MCP Server
                ↓                       ↓
            GPT-4o Model ← Tool Definitions
                ↓
        Tool Execution → Widget Rendering
```

## Files

- `app/page.tsx` - Main chat interface using the Vercel AI SDK's `useChat` hook
- `app/api/chat/route.ts` - API endpoint that handles chat requests and MCP tool integration
- `lib/mcpSetup.ts` - MCP client initialization and connection logic
- `lib/widgetCache.ts` - Caching system for widget HTML
- `app/api/widget/[id]/route.ts` - Serves cached widgets with security headers
- `app/api/widget/store/route.ts` - Stores widget HTML from tool responses

## Troubleshooting

### "TypeError: fetch failed" or "ECONNREFUSED"
This error occurs when the MCP server is not running. Make sure you have an MCP server running at `http://localhost:8002/mcp` before starting the example.

### No tools available
If the chat works but no tools are available, check that your MCP server is properly configured and exposing tools via the MCP protocol.

### Widget rendering issues
Ensure that your MCP tools are returning proper widget HTML with the `openai/outputTemplate` metadata field pointing to a valid resource URI.

## Customization

### Change MCP Server URL
Edit `lib/mcpSetup.ts` and update the URL:

```typescript
const transport = new StreamableHTTPClientTransport(
  new URL('http://your-mcp-server-url/mcp')
);
```

### Add Custom Tool Handlers
Modify `app/api/chat/route.ts` to add custom logic for specific tools or widget handling.

## Learn More

- [Model Context Protocol](https://modelcontextprotocol.io) - Learn about MCP
- [Vercel AI SDK](https://sdk.vercel.ai) - Documentation for the AI SDK
- [OpenAI Apps SDK](https://developers.openai.com/apps-sdk) - OpenAI's app framework