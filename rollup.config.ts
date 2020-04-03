import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import sourcemaps from 'rollup-plugin-sourcemaps';

const plugins = [
  typescript(),
  resolve(),
  commonjs(),
  sourcemaps(),
];

export default [
  {
    input: './background.ts',
    output: {
      file: 'background.bundle.js',
      format: 'iife',
      name: 'blockrz',
      sourcemap: true,
    },
    plugins,
  },
  {
    input: './content-script.ts',
    output: {
      file: 'content-script.bundle.js',
      format: 'iife',
      name: 'blockrz',
      sourcemap: true,
    },
    plugins,
  },
];
