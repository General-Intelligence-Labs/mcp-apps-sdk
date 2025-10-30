import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages } from 'ai';
import { createVercelAITools } from '@xalia/mcp-apps-ai-sdk/vercel';
import { getMCPClient } from '@/lib/mcpSetup';

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get MCP client
  const mcpClient = await getMCPClient();

  // Convert all MCP tools to Vercel AI SDK format
  const tools = await createVercelAITools(mcpClient, {
    onWidgetFetch: async (uri, html) => {
      console.log(`[Chat] Widget fetched from ${uri}`);
    },
  });

  // Prepare messages for the model
  const sanitizedMessages = messages.map(({ id: _unused, ...rest }) => {
    void _unused;
    return rest;
  }) as Parameters<typeof convertToModelMessages>[0];

  const coreMessages = convertToModelMessages(sanitizedMessages, { tools });

  // Stream the response with tool support
  const result = streamText({
    model: openai('gpt-4o'),
    messages: coreMessages,
    tools,
  });

  return result.toUIMessageStreamResponse();
}