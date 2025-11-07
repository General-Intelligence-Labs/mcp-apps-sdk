/**
 * @xalia/mcp-apps - Complete SDK for building MCP-powered applications
 * 
 * This package provides a unified entry point to all MCP SDK components:
 * - MCP Client for connecting to MCP servers
 * - Adapters for integrating with AI frameworks (OpenAI, Vercel AI SDK)
 * - Widget components for rendering MCP apps
 * 
 * @example Basic Usage
 * ```typescript
 * import { createMCPClient } from '@xalia/mcp-apps';
 * 
 * const client = createMCPClient({
 *   serverPath: './server.js'
 * });
 * ```
 * 
 * @example Modular Imports
 * ```typescript
 * import { createMCPClient } from '@xalia/mcp-apps/client';
 * import { createOpenAIFunctions } from '@xalia/mcp-apps/adapters/openai';
 * import { AssistantAppEmbed } from '@xalia/mcp-apps/widget';
 * ```
 */

// Re-export everything from the client package
export * from '@xalia/mcp-client';

// Re-export adapters (users can also import from '@xalia/mcp-apps/adapters')
export { 
  createOpenAIFunctions,
  executeOpenAIFunction,
  type OpenAIFunction,
  type OpenAIFunctionCall
} from '@xalia/mcp-apps-adapters/openai';

export {
  createVercelAITools
} from '@xalia/mcp-apps-adapters/vercel';

// Re-export widget components (users can also import from '@xalia/mcp-apps/widget')
export {
  AssistantAppEmbed,
  type AssistantAppEmbedProps
} from '@xalia/mcp-apps-widget';

// NOTE: Widget server utilities (createWidgetStoreHandler, createWidgetRenderHandler, etc.)
// are NOT exported from the main entry point because they use Node.js APIs (fs, os, path)
// that cannot be used in browser/client code. Import them from '@xalia/mcp-apps-sdk/widget/server' instead.

