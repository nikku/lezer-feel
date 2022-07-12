import { parser } from 'lezer-feel';
import { fileTests } from '@lezer/generator/dist/test';
import { buildParser } from '@lezer/generator';

import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const caseDir = path.dirname(fileURLToPath(import.meta.url));

function parseTest(name) {

  let test = it;

  if (name.startsWith('-')) {
    test = it.skip;
  }

  if (name.startsWith('*')) {
    test = it.only;
  }

  const testName = name.replace(/^[-*]\s+/, '');

  return {
    test,
    testName
  };
}


for (const file of fs.readdirSync(caseDir)) {
  if (!/\.txt$/.test(file)) {
    continue;
  }

  const name = /^[^.]*/.exec(file)[0];

  describe(name, () => {

    const fileName = path.join(caseDir, file);
    const fileContents = fs.readFileSync(fileName, 'utf8');

    const grammarMatch = /^([^#][^]*?)($|\n# )/.exec(fileContents);
    const grammar = grammarMatch && grammarMatch[1];

    const specs = grammar ? fileContents.substring(grammar.length) : fileContents;

    const createParser = grammar ? () => buildParser(grammar, {
      fileName,
      warn(msg) { throw new Error(msg); }
    }) : () => parser;

    const tests = fileTests(specs, fileName);

    for (const { name, run } of tests) {

      const {
        test,
        testName
      } = parseTest(name);

      test(testName, () => run(createParser()));
    }
  });

}