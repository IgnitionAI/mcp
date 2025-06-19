import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import shebang from 'rollup-plugin-preserve-shebang';

export default {
  input: 'server.ts', // <- entry point
  output: { 
    file: 'dist/server.js', // <- output file
    format: 'esm' // <- output format
  },
  plugins: [
    shebang(),            // <- add shebang to the output file
    resolve(),           // <- resolve node modules
    commonjs(),         // <- convert commonjs to esm
    json(),            // <- convert json to esm
    typescript({ tsconfig: './tsconfig.json' }) // <- convert typescript to javascript
  ],
  external: [ // add external dependencies
    "@modelcontextprotocol/sdk",
    "zod",
    "dotenv"
  ]
};