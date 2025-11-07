import { defineConfig } from 'tsup';
import { writeFileSync } from 'fs';
import { join } from 'path';

const typeDefinitionContent = `// Re-export everything from the client package
export * from '@xalia/mcp-client';

// Re-export adapters
export { 
  createOpenAIFunctions,
  executeOpenAIFunction,
  type OpenAIFunction,
  type OpenAIFunctionCall
} from '@xalia/mcp-apps-adapters/openai';

export {
  createVercelAITools
} from '@xalia/mcp-apps-adapters/vercel';

// Re-export widget components
export {
  AssistantAppEmbed,
  type AssistantAppEmbedProps
} from '@xalia/mcp-apps-widget';

// NOTE: Widget server utilities are NOT exported from the main entry point
// Import them from '@xalia/mcp-apps-sdk/widget/server' instead
`;

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: false, // We'll create a single manual .d.ts file
  sourcemap: true,
  clean: true,
  external: [
    '@xalia/mcp-client',
    '@xalia/mcp-apps-adapters',
    '@xalia/mcp-apps-widget',
    'react',
    'react-dom',
    'next',
    '@ai-sdk/openai',
    '@ai-sdk/react',
    'ai',
    'zod',
  ],
  esbuildOptions(options) {
    options.packages = 'external';
  },
  async onSuccess() {
    // Generate single type definition file
    const dtsPath = join('dist', 'index.d.ts');
    const dmtsPath = join('dist', 'index.d.mts');
    
    writeFileSync(dtsPath, typeDefinitionContent);
    writeFileSync(dmtsPath, `export * from './index.js';\n`);
  },
});

