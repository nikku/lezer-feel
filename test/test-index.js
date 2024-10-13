import {
  parser,
  trackVariables,
  normalizeContextKey
} from 'lezer-feel';

import {
  expect
} from 'chai';


describe('lezer-feel', function() {

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


  describe('normalizeContextKey', function() {

    it('should normalize string', function() {

      expect(normalizeContextKey('A+B  C')).to.eql('A + B C');

      expect(normalizeContextKey('A\'111+B  C')).to.eql('A \' 111 + B C');

      expect(normalizeContextKey('a**\'s')).to.eql('a ** \' s');

      expect(normalizeContextKey('a***')).to.eql('a ** *');

    });

  });

});