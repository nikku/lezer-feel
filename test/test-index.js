/* global global */

import {
  parser,
  trackVariables,
  normalizeContextKey
} from 'lezer-feel';

import {
  expect
} from 'chai';

import {
  EntriesContext,
  toEntriesContextValue
} from './custom-context.js';


describe('lezer-feel', function() {

  before(function() {
    global.NORMALIZE_COUNTER = 0;
  });


  after(function() {
    console.log('stats', {
      NORMALIZE_COUNTER: global.NORMALIZE_COUNTER
    });

    expect(global.NORMALIZE_COUNTER, 'NORMALIZE_COUNTER').to.be.lessThan(7500);

    delete global.NORMALIZE_COUNTER;
  });


  describe('should parse', function() {

    it('expression', function() {

      // when
      const tree = parser.parse('foo');

      // then
      expect(tree).to.exist;
    });


    it('expression (empty)', function() {

      // then
      const tree = parser.parse('');

      // then
      expect(tree).to.exist;
    });


    it('unaryTests', function() {

      // when
      const tree = parser.configure({ top: 'UnaryTests' }).parse('> 10');

      // then
      expect(tree).to.exist;
    });


    it('unaryTests (empty)', function() {

      // then
      const tree = parser.configure({ top: 'UnaryTests' }).parse('');

      // then
      expect(tree).to.exist;
    });

  });


  it('should configure with context', function() {

    // given
    const tracker = trackVariables({
      '+': 1
    });

    // when
    const configuredParser = parser.configure({
      contextTracker: tracker
    });

    // then
    configuredParser.parse('+');
  });


  it('should allow re-use of context tracker', function() {

    // given
    const tracker = trackVariables({
      a: 100,
      b: 300,
      c: {
        'd + 1': {
          'e**': 31
        }
      }
    });

    // when
    const configuredParser = parser.configure({
      contextTracker: tracker
    });

    // then
    // parse basic variable access
    configuredParser.parse('a + b');

    // parse nested context access
    configuredParser.parse('c.d+ 1.e**');
  });


  it('should parse with small context', function() {

    // given
    const tracker = trackVariables({
      a: 10,
      b: 30,
      'c + d': 10
    });

    // when
    const configuredParser = parser.configure({
      contextTracker: tracker
    });

    // then
    configuredParser.parse('a + b + c+d');
  });


  describe('should parse with large context', function() {

    /**
     * @param {number} numberOfKeys
     *
     * @return {Record<string, number>}
     */
    function createContext(numberOfKeys) {

      const context = {};

      for (var i = 0; i < numberOfKeys / 3; i++) {
        context[`key_${i}`] = i;
        context[`key_${i} key_${i - 1}`] = i;
        context[`key_${i}+key_${i - 1}-key_${i - 2}`] = i;
      }

      return Object.freeze(context);
    }


    function verifyParse({ context: contextOrBuilder, expression }) {

      return function() {

        // given
        const tracker = trackVariables(
          typeof contextOrBuilder === 'function'
            ? contextOrBuilder()
            : contextOrBuilder
        );

        // when
        const configuredParser = parser.configure({
          contextTracker: tracker
        });

        // then
        configuredParser.parse(expression);
      };
    }

    testParse({
      name: 'default',
      context: () => createContext(1000)
    });


    testParse({
      name: 'custom entries context',
      context: () => toEntriesContextValue(
        createContext(1000)
      )
    });


    function testParse({ name, context }) {

      describe(name, function() {

        // log all test timings
        this.slow(1);

        it('basic', verifyParse({
          context,
          expression: 'key_191 + key_999'
        }));


        it('many keys', verifyParse({
          context,
          expression: `
            key_191 +
            key_999 +
            key_311 +
            key_111 +
            key_134 +
            key_718 +
            key_7 +
            key_876 +
            key_132 +
            key_718 +
            key_717 +
            non_existing_key
          `
        }));


        it('many keys (special)', verifyParse({
          context,
          expression: `
            key_191 key_190 +
            key_999 key_998 +
            key_311 key_310 +
            key_111 key_110 +
            key_134 + key_133 - key_132 +
            key_718 + key_717 - key_716 +
            key_7 key_6 +
            key_876 key_875 +
            key_132 key_131 +
            key_718 key_717 +
            key_717 key_716 +
            non_existing_key
          `
        }));


        it('FEEL context', verifyParse({
          context,
          expression: `
            {
              a: key_191,
              b: key_999,
              c: key_311,
              d: key_111,
              e: key_134,
              f: key_718,
              g: key_7,
              h: key_876,
              i: key_132,
              j: key_718,
              k: key_717,
              l: non_existing_key
            }
          `
        }));


        it('FEEL context (special)', verifyParse({
          context,
          expression: `
            {
              a: key_191 key_190,
              b: key_999 key_998,
              c: key_311 key_310,
              d: key_111 key_110,
              e: key_134 + key_133 - key_132,
              f: key_718 + key_717 - key_716,
              g: key_7 key_6,
              h: key_876 key_875,
              i: key_132 key_131,
              j: key_718 key_717,
              k: key_717 key_716,
              l: non_existing_key
            }
          `
        }));


        it('nested FEEL contexts', verifyParse({
          context,
          expression: `
            {
              a: {
                bb: key_11,
                b: {
                  cc: key_999,
                  c: {
                    dd: key_51,
                    d: {
                      ee: key_113,
                      e: {
                        f: key_191
                      }
                    }
                  }
                }
              }
            }
          `
        }));
      });

    }

  });


  describe('custom entries context', function() {

    it('should ignore external meta-data', function() {

      // given
      const context = toEntriesContextValue({
        'foo +  100': {
          'baa---': 'BAR'
        },
        woop: 'WAAP',
        yup: 'YUP',
        other: {
          nested: {
            thing: 0
          }
        }
      });

      // we don't care about meta-data
      context.meta = {};
      context.meta.meta = context.meta;

      const tracker = trackVariables(context, EntriesContext);

      // when
      const configuredParser = parser.configure({
        contextTracker: tracker
      });

      // then
      configuredParser.parse('foo +  100.baa--- + woop + yup + other.nested.thing');
    });

  });


  describe('normalizeContextKey', function() {

    it('should normalize string', function() {

      expect(normalizeContextKey('A+B  C')).to.eql('A + B C');

      expect(normalizeContextKey('A\'111+B  C')).to.eql('A \' 111 + B C');

      expect(normalizeContextKey('a**\'s')).to.eql('a ** \' s');

      expect(normalizeContextKey('a***')).to.eql('a ** *');

    });

  });

});