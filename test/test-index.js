import {
  normalizeContext,
  parser,
  trackVariables
} from 'lezer-feel';

import {
  expect
} from 'chai';


describe('lezer-feel', () => {

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


  describe('normalizeContext', () => {

    it('should normalize spaces', () => {

      // given
      const context = {
        'A+B  C': {
          'e -- f': 1
        }
      };

      // when
      const normalizedContext = normalizeContext(context);

      // then
      expect(normalizedContext).to.eql({
        'A + B C': {
          'e - - f': 1
        }
      });
    });


    it('should normalize null', () => {

      // given
      const context = null;

      // when
      const normalizedContext = normalizeContext(context);

      // then
      expect(normalizedContext).to.eql(null);
    });


    it('should normalize array', () => {

      // given
      const context = {
        foo: [ { a: [ 1, 2, 3 ] } ]
      };

      // when
      const normalizedContext = normalizeContext(context);

      // then
      expect(normalizedContext).to.eql(context);
    });

  });

});