import { nodeResolve } from '@rollup/plugin-node-resolve';

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const pkg = require('./package.json');


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
      .find(dep => id.startsWith(dep));
  },
  plugins: [
    nodeResolve()
  ]
};