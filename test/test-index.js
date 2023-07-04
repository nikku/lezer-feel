import {
  parser,
  trackVariables,
  normalizeContextKey
} from 'lezer-feel';

import {
  expect
} from 'chai';


describe('lezer-feel', () => {

  it('should parse', () => {

    // when
    const tree = parser.parse('foo');

    // then
    expect(tree).to.exist;
  });


  it('should parse empty', () => {

    // then
    const tree = parser.parse('');

    // then
    expect(tree).to.exist;
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

    });

  });

});