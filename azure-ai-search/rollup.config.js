import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import shebang from 'rollup-plugin-preserve-shebang';

export default {
  input: 'server.ts',
  output: {
    dir: 'dist',
    format: 'esm',
    entryFileNames: 'server.js'
  },
  plugins: [
    shebang(),          // <- pour le #!/usr/bin/env node
    resolve(),
    commonjs(),
    json(),
    typescript({ tsconfig: './tsconfig.json' })
  ],
  external: [
    "@modelcontextprotocol/sdk",
    "@azure/search-documents",
    "@azure/identity",
    "zod",
    "dotenv",
  ]
};
