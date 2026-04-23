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


  it('should create union from contexts', function() {

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
    expect(context).to.eql({
      value: {},
      variants: [
        {
          value: {
            entries: {
              a: {
                value: {
                  entries: {
                    ab: { value: { atomicValue: 10, entries: {} } }
                  }
                }
              }
            }
          }
        },
        {
          value: {
            entries: {
              a: {
                value: {
                  entries: {
                    ac: { value: { atomicValue: 20, entries: {} } }
                  }
                }
              }
            }
          }
        }
      ]
    });
  });


  it('should create union, unwrapping nested contexts', function() {

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
    expect(context).to.eql({
      value: {},
      variants: [
        {
          value: {
            entries: {
              a: {
                value: {
                  entries: {
                    ab: { value: { atomicValue: 10, entries: {} } }
                  }
                }
              }
            }
          }
        },
        {
          value: {
            entries: {
              a: {
                value: {
                  entries: {
                    ac: { value: { atomicValue: 20, entries: {} } }
                  }
                }
              }
            }
          }
        }
      ]
    });
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
      value: {},
      variants: [
        { value: { entries: {} } },
        { value: { entries: {} } }
      ]
    });
  });


  describe('should allow retrieval of context value', function() {

    function computedValue(expression, context = {}, dialect = 'feel') {

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
        dialect,
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


    it('atomic value (null)', function() {

      // then
      const shape = computedValue(`
        null
      `);

      // then
      expect(shape).to.eql(null);
    });


    it('atomic value (string)', function() {

      // then
      const shape = computedValue(`
        "foo"
      `);

      // then
      expect(shape).to.eql('foo');
    });


    it('atomic value (string with escaped quotes)', function() {

      // when
      const shape = computedValue(`
        "\\"YES\\"\\"\\""
      `);

      // then
      expect(shape).to.eql('"YES"""');
    });


    it('atomic value (string with escaped backslash)', function() {

      // when
      const shape = computedValue(`
        "hello\\\\world"
      `);

      // then
      expect(shape).to.eql('hello\\world');
    });


    it('atomic value (string with mixed escapes)', function() {

      // when
      const shape = computedValue(`
        "hello\\"\\\\world\\"\\\\"
      `);

      // then
      expect(shape).to.eql('hello"\\world"\\');
    });


    it('atomic value (string with escaped newline)', function() {

      // when
      const shape = computedValue(`
        "hello\\nworld"
      `);

      // then
      expect(shape).to.eql('hello\\nworld');
    });


    it('atomic value (multi-line string, camunda)', function() {

      // when
      const shape = computedValue(`
        "hello\nworld"
      `, {}, 'camunda');

      // then
      expect(shape).to.eql('hello\nworld');
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
        { zero: 0, emptyString: "", n: null }
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
            },
            n: {
              value: {
                atomicValue: null,
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
        value: {},
        variants: [
          {
            value: { atomicValue: 1, entries: {} }
          },
          {
            value: { atomicValue: null, entries: {} }
          },
          {
            value: {
              atomicValue: undefined,
              entries: {
                'a +': {
                  value: { atomicValue: 1, entries: {} }
                }
              }
            }
          },
          {
            value: {
              atomicValue: undefined,
              entries: {
                'b +': {
                  value: { atomicValue: 2, entries: {} }
                }
              }
            }
          }
        ]
      });
    });


    it('list (preserves distinct atomic shapes)', function() {

      // when
      const shape = computedValue(`
        [ 1, true ]
      `);

      // then
      // distinct shapes are preserved as variants, not merged
      expect(shape).to.eql({
        value: {},
        variants: [
          {
            value: { atomicValue: 1, entries: {} }
          },
          {
            value: { atomicValue: true, entries: {} }
          }
        ]
      });
    });


    it('if expression (preserves branch shapes)', function() {

      // when
      const shape = computedValue(`
        if true then { a: 1 } else { b: 2 }
      `);

      // then
      // then/else branches are kept as distinct variants
      expect(shape).to.eql({
        value: {},
        variants: [
          {
            value: {
              atomicValue: undefined,
              entries: {
                a: { value: { atomicValue: 1, entries: {} } }
              }
            }
          },
          {
            value: {
              atomicValue: undefined,
              entries: {
                b: { value: { atomicValue: 2, entries: {} } }
              }
            }
          }
        ]
      });
    });


    it('path expression (single branch)', function() {

      // when
      const shape = computedValue(`
        [ { a: { c: 1 } }, { b: 2 } ].a
      `);

      // then
      expect(shape).to.eql({
        value: {
          atomicValue: undefined,
          entries: {
            c: {
              value: {
                atomicValue: 1,
                entries: {}
              }
            }
          }
        }
      });
    });


    it('path expression (single branch yields <null>)', function() {

      // when
      const shape = computedValue(`
        [ { a: null }, { b: 1 } ].a
      `);

      // then
      expect(shape).to.eql({
        value: {
          atomicValue: null,
          entries: {}
        }
      });
    });


    it('path expression (multiple branches)', function() {

      // when
      const shape = computedValue(`
        [ { a: { c: 1 } }, { a: { b: 2 } } ].a
      `);

      // then
      expect(shape).to.eql({
        value: {},
        variants: [
          {
            value: {
              atomicValue: undefined,
              entries: {
                c: { value: { atomicValue: 1, entries: {} } }
              }
            }
          },
          {
            value: {
              atomicValue: undefined,
              entries: {
                b: { value: { atomicValue: 2, entries: {} } }
              }
            }
          }
        ]
      });
    });


    it('list (keys accessible across all variants)', function() {

      // when
      const shape = computedValue(`
        [ { a: 1 }, { b: 2 } ]
      `);

      // then
      expect(shape.getKeys()).to.include.members([ 'a', 'b' ]);
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


    it('function invocation (single argument)', function() {

      // when
      const shape = computedValue(`
        abs(-22)
      `);

      // then
      expect(shape).to.eql({
        value: {
          atomicValue: undefined,
          entries: {}
        }
      });
    });


    it('function invocation (multiple arguments)', function() {

      // when
      const shape = computedValue(`
        substring("foobar", 3)
      `);

      // then
      expect(shape).to.eql({
        value: {
          atomicValue: undefined,
          entries: {}
        }
      });
    });


    it('function invocation (no arguments)', function() {

      // when
      const shape = computedValue(`
        now()
      `);

      // then
      expect(shape).to.eql({
        value: {
          atomicValue: undefined,
          entries: {}
        }
      });
    });


    it('function invocation (nested)', function() {

      // when
      const shape = computedValue(`
        abs(round(-22.5))
      `);

      // then
      expect(shape).to.eql({
        value: {
          atomicValue: undefined,
          entries: {}
        }
      });
    });


    it('function invocation (context-defined, preserves return shape)', function() {

      // when
      const shape = computedValue(`
        {
          a: function() { a+: { b-: 1 } },
          b: a()
        }.b
      `);

      // then
      expect(shape).to.eql({
        value: {
          atomicValue: undefined,
          entries: {
            'a +': {
              value: {
                atomicValue: undefined,
                entries: {
                  'b -': {
                    value: {
                      atomicValue: 1,
                      entries: {}
                    }
                  }
                }
              }
            }
          }
        }
      });
    });


    it('function invocation (context-defined, nested unknown)', function() {

      // when
      const shape = computedValue(`
        {
          a: function() { a+: { b-: abs(x) } },
          b: a()
        }.b
      `);

      // then
      expect(shape).to.eql({
        value: {
          atomicValue: undefined,
          entries: {
            'a +': {
              value: {
                atomicValue: undefined,
                entries: {
                  'b -': {
                    value: {
                      atomicValue: undefined,
                      entries: {}
                    }
                  }
                }
              }
            }
          }
        }
      });
    });


    it('function invocation (context-defined, nested unknown with provided context)', function() {

      // when
      const shape = computedValue(`
        {
          a: function() { a+: { b-: abs(x) } },
          b: a()
        }.b
      `, { x: -5 });

      // then
      expect(shape).to.eql({
        value: {
          atomicValue: undefined,
          entries: {
            'a +': {
              value: {
                atomicValue: undefined,
                entries: {
                  'b -': {
                    value: {
                      atomicValue: undefined,
                      entries: {}
                    }
                  }
                }
              }
            }
          }
        }
      });
    });


    it('function definition', function() {

      // when
      const shape = computedValue(`
        {
          add: function(a, b) { result: a + b },
          n: add(1, 2)
        }.n
      `);

      // then
      expect(shape).to.eql({
        value: {
          atomicValue: undefined,
          entries: {
            result: {
              value: {
                atomicValue: 1,
                entries: {}
              }
            }
          }
        }
      });
    });

  });

});