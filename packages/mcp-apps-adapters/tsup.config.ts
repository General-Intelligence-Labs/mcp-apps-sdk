import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    openai: 'src/openai.ts',
    vercel: 'src/vercel.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    '@xalia/mcp-client',
    '@ai-sdk/openai',
    '@ai-sdk/react',
    'ai',
    'zod',
  ],
});