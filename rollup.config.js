import { nodeResolve } from '@rollup/plugin-node-resolve';

import pkg from './package.json';


export default {
  input: pkg.source,
  output: [
    {
      format: 'cjs',
      file: pkg.main,
      sourcemap: true
    }, {
      format: 'es',
      file: pkg.module,
      sourcemap: true
    }
  ],
  external(id) {
    return Object.keys(pkg.dependencies)
      .includes(id.split('/')[0]);
  },
  plugins: [
    nodeResolve()
  ]
};