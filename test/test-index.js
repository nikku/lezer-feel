import {
  parser,
  trackVariables,
  normalizeContextKey
} from 'lezer-feel';

import {
  expect
} from 'chai';


describe('lezer-feel', () => {

  describe('should parse', function() {

    it('expression', () => {

      // when
      const tree = parser.parse('foo');

      // then
      expect(tree).to.exist;
    });


    it('expression (empty)', () => {

      // then
      const tree = parser.parse('');

      // then
      expect(tree).to.exist;
    });


    it('unaryTests', () => {

      // when
      const tree = parser.configure({ top: 'UnaryTests' }).parse('> 10');

      // then
      expect(tree).to.exist;
    });


    it('unaryTests (empty)', () => {

      // then
      const tree = parser.configure({ top: 'UnaryTests' }).parse('');

      // then
      expect(tree).to.exist;
    });

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


  describe('normalizeContextKey', () => {

    it('should normalize string', () => {

      expect(normalizeContextKey('A+B  C')).to.eql('A + B C');

      expect(normalizeContextKey('A\'111+B  C')).to.eql('A \' 111 + B C');

      expect(normalizeContextKey('a**\'s')).to.eql('a ** \' s');

      expect(normalizeContextKey('a***')).to.eql('a ** *');

    });

  });

});