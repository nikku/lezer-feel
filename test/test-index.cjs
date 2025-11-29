const {
  parser,
  trackVariables,
  normalizeContextKey
} = require('lezer-feel');

const {
  expect
} = require('chai');


describe('lezer-feel', function() {

  describe('cjs', function() {

    describe('should parse', function() {

      it('expression', function() {

        // when
        const tree = parser.parse('foo');

        // then
        expect(tree).to.exist;
      });


      it('unaryTests', function() {

        // when
        const tree = parser.configure({ top: 'UnaryTests' }).parse('> 10');

        // then
        expect(tree).to.exist;
      });

    });


    it('should configure with context', function() {

      // given
      const tracker = trackVariables({
        [ normalizeContextKey('+') ]: 1
      });

      // when
      const configuredParser = parser.configure({
        contextTracker: tracker
      });

      // then
      configuredParser.parse('+');
    });

  });

});