import {
  expect
} from 'chai';

import {
  EntriesContext
} from './custom-context.js';


describe('custom context', function() {

  it('should create context from literals', function() {

    const context = EntriesContext.of(15);

    // then
    expect(context.value.atomicValue).to.exist;
    expect(context.value.atomicValue).to.equal(15);

  });

});
