import {
  expect
} from 'chai';

import {
  EntriesContext,
  toEntriesContextValue
} from './custom-context.js';

import { ContextTracker } from '@lezer/lr';

import { trackVariables, parser } from 'lezer-feel';


describe('custom context', function() {

  it('should create from literal', function() {

    // when
    const context = EntriesContext.of(15);

    // then
    expect(context.value.atomicValue).to.exist;
    expect(context.value.atomicValue).to.equal(15);
  });


  it('should create from context value', function() {

    // given
    const context = EntriesContext.of({
      entries: {
        a: {
          entries: {
            ab: 10
          }
        }
      }
    });

    // then
    expect(context.value).to.have.key('entries');

    // expose nested entry
    expect(context.value.entries.a.value.entries.ab).to.eql({
      value: { atomicValue: 10, entries: {} }
    });
  });


  describe('should create value via utility', function() {

    it('context', function() {

      // given
      const contextValue = toEntriesContextValue({
        a: {
          ab: 10
        }
      });

      // assume
      expect(contextValue).to.eql({
        entries: {
          a: {
            entries: {
              ab: 10
            }
          }
        }
      });

      // when
      const context = EntriesContext.of(contextValue);

      // then
      expect(context.value).to.eql({
        entries: {
          a: {
            value: {
              entries: {
                ab: {
                  value: {
                    atomicValue: 10,
                    entries: {}
                  }
                }
              }
            }
          }
        }
      });
    });


    it('list', function() {

      // given
      const contextValue = toEntriesContextValue({
        a: [
          { b: 1 },
          { b: 2 }
        ]
      });

      // assume
      expect(contextValue).to.eql({
        entries: {
          a: [
            { entries: { b: 1 } },
            { entries: { b: 2 } }
          ]
        }
      });

      // when
      const context = EntriesContext.of(contextValue);

      // then
      expect(context.value).to.eql({
        entries: {
          a: {
            value: {
              entries: {
                b: {
                  value: {
                    atomicValue: 2,
                    entries: {}
                  }
                }
              }
            }
          }
        }
      });
    });

  });


  it('should merge contexts', function() {

    // when
    const context = EntriesContext.of(
      EntriesContext.of(
        toEntriesContextValue({
          a: {
            ab: 10
          }
        })
      ),
      EntriesContext.of(
        toEntriesContextValue({
          a: {
            ac: 20
          }
        })
      )
    );

    // then
    expect(
      context.value.entries.a.value.entries
    ).to.have.keys([
      'ab', 'ac'
    ]);
  });


  it('should merge, unwraping nested contexts', function() {

    const context = EntriesContext.of(
      EntriesContext.of({
        entries: {
          a: EntriesContext.of(
            {
              entries: {
                ab: 10
              }
            }
          )
        }
      }),
      EntriesContext.of({
        entries: {
          a: {
            entries: {
              ac: 20
            }
          }
        }
      })
    );

    // then
    expect(
      context.value.entries.a.value.entries
    ).to.have.keys([
      'ab', 'ac'
    ]);
  });


  it('should create empty', function() {

    // when
    const context = EntriesContext.of({});

    // then
    expect(context).to.eql({
      value: {
        entries: { }
      }
    });
  });


  it('should merge empty', function() {

    // when
    const context = EntriesContext.of({}, {});

    // then
    expect(context).to.eql({
      value: {
        entries: { }
      }
    });
  });


  describe('should allow retrival of context value', function() {

    function computedValue(expression, context = {}) {

      const contextTracker = trackVariables(toEntriesContextValue(context), EntriesContext);

      // @ts-ignore
      let latestVariables = contextTracker.start;

      const customContextTracker = new ContextTracker({
        start: latestVariables,
        reduce(...args) {

          // @ts-ignore
          const result = contextTracker.reduce(...args);
          latestVariables = result;
          return result;
        }
      });

      const contextualParser = parser.configure({
        contextTracker: customContextTracker,
        strict: true
      });

      contextualParser.parse(expression);

      return latestVariables.computedValue();
    }


    it('atomic value', function() {

      // then
      const shape = computedValue(`
        1
      `);

      // then
      expect(shape).to.eql(1);
    });


    it('list', function() {

      // when
      const shape = computedValue(`
        [ 1, null, { a+: 1 }, { b+: 2 } ]
      `);

      // then
      expect(shape).to.eql({
        value: {
          atomicValue: undefined,
          entries: {
            'a +': {
              value: {
                atomicValue: 1,
                entries: {}
              }
            },
            'b +': {
              value: {
                atomicValue: 2,
                entries: {}
              }
            }
          }
        }
      });
    });


    it('list (from context, path)', function() {

      // given
      const context = {
        list: [ 1, null, { 'a+': 1 }, { 'b+': 2 } ]
      };

      // when
      const shape = computedValue(`
        list.a+
      `, context);

      // then
      expect(shape).to.eql({
        value: {
          atomicValue: 1,
          entries: {}
        }
      });
    });


    it('list (from context, filter, path)', function() {

      // given
      const context = {
        list: [
          { a: { b: 1 } },
          { a: { b: 2 } },
          { a: { b: 3 } }
        ]
      };

      // when
      const shape = computedValue(`
        list[1].a
      `, context);

      // then
      expect(shape).to.eql({
        value: {
          entries: {
            b: {
              value: {
                atomicValue: 3,
                entries: {}
              }
            }
          }
        }
      });
    });


    it('context', function() {

      // when
      const shape = computedValue(`
        {
          a: 1,
          b: {
            n: 10
          },
          d: {
            result: a + b.n
          }
        }.d
      `);

      // then
      expect(shape).to.eql({
        value: {
          atomicValue: undefined,
          entries: {
            result: {
              value: {
                atomicValue: 10,
                entries: {}
              }
            }
          }
        }
      });
    });


    it('context (from context)', function() {

      // given
      const context = {
        'd+': {
          result: 100
        }
      };

      // when
      const shape = computedValue(`
        d+.result
      `, context);

      // then
      expect(shape).to.eql({
        value: {
          atomicValue: 100,
          entries: {}
        }
      });
    });


    it('context (from context, path, filter)', function() {

      // given
      const context = {
        a: {
          'b+': {
            c: {
              d: [
                { e: 1 },
                { e: 2 }
              ]
            }
          }
        }
      };

      // when
      const shape = computedValue(`
        a.b+.c.d[1]
      `, context);

      // then
      expect(shape).to.eql({
        value: {
          entries: { e: { value: { atomicValue: 2, entries: {} } } }
        }
      });
    });


    it.skip('function', function() {

      // when
      const shape = computedValue(`
        {
          add: function(a, b) { result: a + b },
          n: add(1, 2)
        }
      `);

      // then
      // TODO(nikku): support this
      expect(shape).to.eql();
    });

  });

});