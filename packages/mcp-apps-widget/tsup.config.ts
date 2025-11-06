import { defineConfig } from 'tsup';

export default defineConfig([
  // Client-side bundle
  {
    entry: {
      index: 'src/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ['react', 'react-dom', 'next', 'next/server'],
    banner: {
      js: '"use client";',
    },
  },
  // Server-side bundle
  {
    entry: {
      'server/index': 'src/server/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    external: ['react', 'react-dom', 'next', 'next/server'],
  },
]);