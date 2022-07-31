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

    it('should handle objects', () => {

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


    it('should handle null', () => {

      // given
      const context = null;

      // when
      const normalizedContext = normalizeContext(context);

      // then
      expect(normalizedContext).to.eql(null);
    });


    it('should handle arrays', () => {

      // given
      const context = {
        foo: [ { a: [ 1, 2, 3 ] } ]
      };

      // when
      const normalizedContext = normalizeContext(context);

      // then
      expect(normalizedContext).to.eql(context);
    });


    it('should handle literals', () => {

      // given
      const context = {
        foo: true,
        bar: 1,
        other: 1.10,
        str: 'foo boo',
        woop: null
      };

      // when
      const normalizedContext = normalizeContext(context);

      // then
      expect(normalizedContext).to.eql(context);
    });


    it('should handle functions', () => {

      // given
      const context = {
        foo: function() { },
        bar: () => { }
      };

      // when
      const normalizedContext = normalizeContext(context);

      // then
      expect(normalizedContext).to.eql(context);
    });


    it('should handle classes', () => {

      // given
      class Foo { }

      const context = {
        Foo
      };

      // when
      const normalizedContext = normalizeContext(context);

      // then
      expect(normalizedContext).to.eql(context);
    });


    it('should handle instances', () => {

      // given
      class Foo { }

      const context = {
        foo: new Foo()
      };

      // when
      const normalizedContext = normalizeContext(context);

      // then
      expect(normalizedContext).to.eql(context);
    });

  });

});