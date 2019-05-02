import resolve from 'rollup-plugin-node-resolve';

const plugins = [resolve()];

export default [
  {
    input: './build/background.js',
    output: {
      file: 'background.bundle.js',
      format: 'iife',
    },
    plugins,
  },
  {
    input: './build/content-script.js',
    output: {
      file: 'content-script.bundle.js',
      format: 'iife',
    },
    plugins,
  },
];
