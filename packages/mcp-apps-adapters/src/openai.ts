import type { Client } from '@xalia/mcp-client';
import type { MCPTool } from '@xalia/mcp-client';

/**
 * OpenAI function calling format
 * @see https://platform.openai.com/docs/guides/function-calling
 */
export type OpenAIFunction = {
  name: string;
  description?: string;
  parameters: Record<string, unknown>;
};

export type OpenAIFunctionCall = {
  name: string;
  arguments: string;
};

/**
 * Creates OpenAI-compatible function definitions from MCP tools
 *
 * @param mcpClient - The connected MCP client
 * @param options - Configuration options
 * @returns Array of OpenAI function definitions
 *
 * @example
 * ```typescript
 * import OpenAI from 'openai';
 * import { createOpenAIFunctions } from '@xalia/mcp-apps-ai-sdk/openai';
 *
 * const openai = new OpenAI();
 * const functions = await createOpenAIFunctions(mcpClient);
 *
 * const completion = await openai.chat.completions.create({
 *   model: "gpt-4",
 *   messages: [...],
 *   functions: functions,
 *   function_call: "auto"
 * });
 * ```
 */
export async function createOpenAIFunctions(
  mcpClient: Client,
  options?: {
    onWidgetFetch?: (uri: string, html: string) => Promise<void>;
  }
): Promise<OpenAIFunction[]> {
  throw new Error(
    'OpenAI adapter not implemented yet. Please use the Vercel AI SDK adapter (@xalia/mcp-apps-ai-sdk/vercel) for now.'
  );
}

/**
 * Executes an OpenAI function call using MCP
 *
 * @param mcpClient - The connected MCP client
 * @param functionCall - The function call from OpenAI
 * @returns The result to send back to OpenAI
 */
export async function executeOpenAIFunction(
  mcpClient: Client,
  functionCall: OpenAIFunctionCall
): Promise<string> {
  throw new Error(
    'OpenAI adapter not implemented yet. Please use the Vercel AI SDK adapter (@xalia/mcp-apps-ai-sdk/vercel) for now.'
  );
}