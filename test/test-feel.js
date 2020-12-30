import { parser } from '../dist/index.es.js';
import { fileTests } from 'lezer-generator/dist/test';

import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const caseDir = path.dirname(fileURLToPath(import.meta.url));

function tester(name) {

  if (/^\s*-/.test(name)) {
    return it.skip;
  }

  if (/\s*\*/.test(name)) {
    return it.only;
  }

  return it;
}


for (const file of fs.readdirSync(caseDir)) {
  if (!/\.txt$/.test(file)) {
    continue;
  }

  const name = /^[^\.]*/.exec(file)[0];

  describe(name, () => {

    const tests = fileTests(fs.readFileSync(path.join(caseDir, file), 'utf8'), file);

    for (const {name, run} of tests) {
      tester(name)(name, () => run(parser));
    }
  });

}