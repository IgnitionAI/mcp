import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import shebang from 'rollup-plugin-preserve-shebang';

export default {
  input: 'server.ts',
  output: {
    file: 'dist/server.js',
    format: 'esm'
  },
  plugins: [
    shebang(),          // <- pour le #!/usr/bin/env node
    resolve(),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' })
  ],
  external: [
    "@modelcontextprotocol/sdk",
    "zod",
    "dotenv",
    "node-linkedin"
  ]
};
