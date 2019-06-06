import compiler from '@ampproject/rollup-plugin-closure-compiler';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript';

const plugins = [
  typescript(),
  resolve(),
  compiler({
    language_out: 'NO_TRANSPILE',
    warning_level: 'DEFAULT',
  }),
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
