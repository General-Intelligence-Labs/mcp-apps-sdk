export type {
  MCPToolWithWidget,
  MCPToolExecutor,
  ToolAdapter,
} from './types.js';

// Note: Each adapter is imported separately to allow tree-shaking
// Users import only what they need:
// import { createVercelAITools } from '@xalia/mcp-apps-ai-sdk/vercel';
// import { createOpenAIFunctions } from '@xalia/mcp-apps-ai-sdk/openai';