import { nodeResolve } from '@rollup/plugin-node-resolve';

import fs from 'node:fs';
import { URL } from 'node:url';

const pkg = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url))
);

const pkgExport = pkg.exports['.'];

export default {
  input: './src/index.js',
  output: [
    {
      format: 'cjs',
      file: pkgExport.require,
      sourcemap: true
    }, {
      format: 'es',
      file: pkgExport.import,
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