import pkg from 'lezer-feel/package.json' with { type: 'json' };

const external = [
  '@lezer/highlight',
  '@lezer/lr',
  'min-dash'
];

export default {
  input: pkg.source,
  output: [
    {
      format: 'es',
      file: pkg.exports['.'],
      sourcemap: true
    }
  ],
  external
};