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

The easiest way to get started is using OpenAI's Solar System example server:

1. Clone the OpenAI Apps SDK examples repository:
```bash
git clone https://github.com/openai/openai-apps-sdk-examples.git
cd openai-apps-sdk-examples/solar-system_server_python
```

2. Create a virtual environment and install dependencies:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

3. Modify the server to run on port 8002 (the example defaults to port 8000):
   - Edit `main.py` and change the port in the uvicorn.run() call from 8000 to 8002
   - Or use uvicorn directly: `uvicorn main:app --port 8002`

4. Start the server:
```bash
# Option A: Modify main.py first, then run
python main.py

# Option B: Run with uvicorn directly on port 8002
uvicorn main:app --port 8002
```

The Solar System server provides example tools that demonstrate:
- Tool discovery via the MCP protocol
- Tool execution with structured responses
- Widget rendering with interactive HTML templates
- Proper metadata formatting for OpenAI Apps SDK compatibility

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