import { expect } from 'chai';

import { parser, trackVariables, VariableContext } from 'lezer-feel';
import { testTree } from '@lezer/generator/dist/test';
import { buildParser } from '@lezer/generator';

import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'node:url';
import { ContextTracker } from '@lezer/lr';

const caseDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * @typedef { import('@lezer/common').NodeType } NodeType
 * @typedef { import('@lezer/lr').LRParser } Parser
 */

/**
 * Returns a line context for the given file.
 *
 * @param { string } file
 * @param { number } index
 *
 * @return { string }
 */
function toLineContext(file, index) {
  const endEol = file.indexOf('\n', index + 80);

  const endIndex = endEol === -1 ? file.length : endEol;

  return file.substring(index, endIndex).split(/\n/).map(str => '  | ' + str).join('\n');
}

/**
 * @param { NodeType } type
 * @return { boolean }
 */
function defaultIgnore(type) { return /\W/.test(type.name); }

/**
 * @typedef { {
 *   name: string,
 *   run: (parser: Parser, contextTracker: typeof trackVariables | null) => void
 * } } Test
 *
 * @param { string } file
 * @param { string } fileName
 * @param { (node: NodeType ) => boolean } mayIgnore
 * @return { Test[] }
 */
export function fileTests(file, fileName, mayIgnore = defaultIgnore) {
  let caseExpr = /\s*#\s*(.*)(?:\r\n|\r|\n)([^]*?)==+>([^]*?)(?:$|(?:\r\n|\r|\n)+(?=#))/gy;

  /**
   * @type { Test[] }
   */
  let tests = [];
  let lastIndex = 0;
  for (;;) {
    let m = caseExpr.exec(file);
    if (!m) {
      throw new Error(
        `Unexpected file format in ${fileName} around\n\n${toLineContext(file, lastIndex)}`
      );
    }


    const titleMatch = /(.*?)(\{.*?\})?$/.exec(m[1]);

    if (!titleMatch) {
      throw new Error('unexpected title format: ' + m[1] + ', expected NAME (CONFIG)?');
    }

    const [ _, name, configStr ] = titleMatch;
    let config = configStr ? JSON.parse(configStr) : {};

    let text = m[2].trim(), expected = m[3];
    tests.push({
      name,
      run(parser, contextTracker = trackVariables) {
        let strict = !/⚠|\.\.\./.test(expected);
        let context = config.context || {};

        if (contextTracker) {
          config.contextTracker = contextTracker(context);
        }

        parser = parser.configure({ strict, ...config });

        testTree(parser.parse(text), expected, mayIgnore);
      }
    });

    lastIndex = m.index + m[0].length;

    if (lastIndex == file.length) break;
  }

  return tests;
}

/**
 * @typedef { import('mocha').ExclusiveTestFunction | import('mocha').PendingTestFunction | import('mocha').TestFunction } AnyTestFunction
 */

/**
 * @param {string} name
 * @return { {
 *   it: AnyTestFunction,
 *   name: string
 * } }
 */
function parseTest(name) {

  /**
   * @type { AnyTestFunction }
   */
  let iit = it;

  const match = /([*-]?)\s*([^{]+)?/.exec(name);

  if (!match) {
    throw new Error(
      'illegal test spec, expected {*,-} TEST NAME'
    );
  }

  const [
    _match,
    qualifier
  ] = match;

  if (qualifier === '-') {
    iit = it.skip;
  }

  if (qualifier === '*') {
    iit = it.only;
  }

  return {
    it: iit,
    name
  };
}


for (const file of fs.readdirSync(caseDir)) {
  if (!/\.txt$/.test(file)) {
    continue;
  }

  const name = path.basename(file);

  describe(name, () => {

    const fileName = path.join(caseDir, file);
    const fileContents = fs.readFileSync(fileName, 'utf8');

    const grammarMatch = /^([^#][^]*?)($|\n# )/.exec(fileContents);
    const grammar = grammarMatch && grammarMatch[1];

    const specs = grammar ? fileContents.substring(grammar.length) : fileContents;

    const createParser = () => {
      return grammar ? buildParser(grammar, {
        fileName,
        warn(msg) { throw new Error(msg); }
      }) : parser;
    };

    const contextTracker = /expressions|unary-test|camunda/.test(fileName)
      ? trackVariables
      : null;

    const tests = fileTests(specs, fileName);

    for (const { name: testName, run } of tests) {

      const {
        it,
        name
      } = parseTest(testName);

      it(name, () => run(createParser(), contextTracker));
    }


    contextTracker && describe('with custom variable context', function() {

      const EntriesTracker = (context) => {
        return trackVariables(toEntriesContextValue(context), EntriesContext);
      };

      let latestVariables;

      const contextTracker = context => {

        /**
         * @type {any}
         */
        const entriesTracker = EntriesTracker(context);
        return new ContextTracker({
          start: entriesTracker.start,
          reduce(...args) {
            const result = entriesTracker.reduce(...args);
            latestVariables = result;
            return result;
          }
        });
      };

      for (const { name: testName, run } of tests) {

        const {
          it,
          name
        } = parseTest(testName);

        it(name, () => {
          run(createParser(), contextTracker);

          // Should always be an instance of the custom context
          if (!(latestVariables.context instanceof EntriesContext)) {
            throw new Error('expected latestVariables to be an instance of EntriesContext, but was ' + latestVariables.constructor.name);
          }
        });
      }
    });

  });

}


describe('Custom Context', function() {

  it('should create context from literals', function() {

    const context = EntriesContext.of(15);

    // then
    expect(context.value.atomicValue).to.exist;
    expect(context.value.atomicValue).to.equal(15);

  });

});

/**
 * An alternative context that holds additional meta-data
 */
class EntriesContext extends VariableContext {

  constructor(value = { entries: {} }) {
    super(value);

    this.value.entries = this.value.entries || {};
    for (const key in this.value.entries) {
      const entry = this.value.entries[key];

      const constructor = /** @type { typeof EntriesContext } */ (this.constructor);

      if (!constructor.isAtomic(entry)) {
        this.value.entries[key] = constructor.of(this.value.entries[key]);
      }
    }
  }

  getKeys() {
    return Object.keys(this.value.entries);
  }

  get(key) {
    return this.value.entries[key];
  }

  /**
   * @param {string} key
   * @param {any} value
   *
   * @return {this}
   */
  set(key, value) {

    const constructor = /** @type { typeof EntriesContext } */ (this.constructor);

    return /** @type {this} */ (constructor.of(
      {
        ...this.value,
        entries: {
          ...this.value.entries,
          [key]: value
        }
      }
    ));
  }

  static of(...contexts) {
    const unwrap = (context) => {
      if (this.isAtomic(context)) {
        return context instanceof this ?
          context.value :
          { atomicValue: context };
      }

      return { ...context };
    };

    const merged = contexts.reduce((merged, context) => {

      const {
        entries = {},
        ...rest
      } = unwrap(context);

      return {
        ...merged,
        ...rest,
        entries: {
          ...merged.entries,
          ...entries
        }
      };
    }, {});

    return new this(merged);
  }
}


function toEntriesContextValue(context) {

  return context && Object.keys(context).reduce((result, key) => {
    const value = context[key];

    result.entries[key] = typeof value === 'object' ? toEntriesContextValue(value)
      : value;

    return result;
  }, { entries: {} });
}