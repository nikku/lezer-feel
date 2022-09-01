import {
  parser,
  trackVariables
} from '..';

import {
  expect
} from 'chai';


describe('types', () => {

  it('should parse', () => {

    // then
    parser.parse('foo');
  });


  it('should configure with context', () => {

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

});