import {
  expect
} from 'chai';

import {
  EntriesContext,
  toEntriesContextValue
} from './custom-context.js';


describe('custom context', function() {

  it('should create from literal', function() {

    const context = EntriesContext.of(15);

    // then
    expect(context.value.atomicValue).to.exist;
    expect(context.value.atomicValue).to.equal(15);
  });


  it('should create from context value', function() {

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

    const context = EntriesContext.of(toEntriesContextValue({
      a: { ab: 10 }
    }));

    // then
    expect(context.value).to.have.key('entries');

    // expose nested entry
    expect(context.value.entries.a.value.entries.ab).to.eql({
      value: { atomicValue: 10, entries: {} }
    });
  });


  it('should merge contexts', function() {

    // when
    const context = EntriesContext.of(
      EntriesContext.of(
        toEntriesContextValue({
          a: { ab: 10 }
        })
      ),
      EntriesContext.of(
        toEntriesContextValue({
          a: { ac: 20 }
        })
      )
    );

    // then
    expect(context.value.entries.a.value.entries).to.have.keys([ 'ab', 'ac' ]);
  });


  it('should merge, unwraping nested contexts', function() {

    const context = EntriesContext.of(
      EntriesContext.of({
        entries: {
          a: EntriesContext.of(
            {
              entries: { ab: 10 }
            }
          )
        }
      }),
      EntriesContext.of({
        entries: {
          a: { ac: 20 }
        }
      })
    );

    // then
    expect(context).to.exist;
  });

});