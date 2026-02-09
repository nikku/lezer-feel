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


  it('should create value via utility', function() {

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


    it('atomic value (number)', function() {

      // then
      const shape = computedValue(`
        1
      `);

      // then
      expect(shape).to.eql(1);
    });


    it('atomic value (string)', function() {

      // then
      const shape = computedValue(`
        "foo"
      `);

      // then
      expect(shape).to.eql('foo');
    });


    it('atomic value (boolean)', function() {

      // then
      const shapeTrue = computedValue(`
        true
      `);
      const shapeFalse = computedValue(`
        false
      `);

      // then
      expect(shapeTrue).to.eql(true);
      expect(shapeFalse).to.eql(false);
    });


    it('boolean values in context', function() {

      // when
      const shape = computedValue(`
        { booleanFalse: false, booleanTrue: true }
      `);

      // then
      expect(shape).to.eql({
        value: {
          atomicValue: undefined,
          entries: {
            booleanFalse: {
              value: {
                atomicValue: false,
                entries: {}
              }
            },
            booleanTrue: {
              value: {
                atomicValue: true,
                entries: {}
              }
            }
          }
        }
      });
    });


    it('falsy values in context', function() {

      // when
      const shape = computedValue(`
        { zero: 0, emptyString: "" }
      `);

      // then
      expect(shape).to.eql({
        value: {
          atomicValue: undefined,
          entries: {
            zero: {
              value: {
                atomicValue: 0,
                entries: {}
              }
            },
            emptyString: {
              value: {
                atomicValue: '',
                entries: {}
              }
            }
          }
        }
      });
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