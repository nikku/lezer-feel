import { nodeResolve } from '@rollup/plugin-node-resolve';

import pkg from './package.json';


export default {
  input: pkg.source,
  output: [
    {
      format: 'cjs',
      file: pkg.main
    }, {
      format: 'es',
      file: pkg.module
    }
  ],
  external(id) { return !/^[./]/.test(id); },
  plugins: [
    nodeResolve()
  ]
};