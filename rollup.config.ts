import compiler from '@ampproject/rollup-plugin-closure-compiler';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const plugins = [
  typescript(),
  resolve(),
  commonjs(),
  compiler(),
];

export default [
  {
    input: './background.ts',
    output: {
      file: 'background.bundle.js',
      format: 'iife',
      name: 'blockrz',
    },
    plugins,
  },
  {
    input: './content-script.ts',
    output: {
      file: 'content-script.bundle.js',
      format: 'iife',
      name: 'blockrz',
    },
    plugins,
  },
];
