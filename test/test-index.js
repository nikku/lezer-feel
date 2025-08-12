import {
  parser,
  trackVariables,
  normalizeContextKey,
  normalizeContextKeys
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


  it('should parse with small context', function() {

    // given
    const tracker = trackVariables({
      a: 10,
      b: 30,
      'c + d': 10
    });

    // when
    const configuredParser = parser.configure({
      contextTracker: tracker
    });

    // then
    configuredParser.parse('a + b + c+d');
  });


  it('should parse with large context', function() {

    // given
    const context = {};

    for (let i = 0; i < 1000; i++) {
      context[`key_${i}`] = i;
    }

    const tracker = trackVariables(context);

    // when
    const configuredParser = parser.configure({
      contextTracker: tracker
    });

    // then
    configuredParser.parse('key_191 + key_999');
  });


  it('should allow re-use of context tracker', function() {

    // given
    const context = {};

    for (let i = 0; i < 1000; i++) {
      context[`key_${i}`] = i;
    }

    const tracker = trackVariables(context);

    // when
    const configuredParser = parser.configure({
      contextTracker: tracker
    });

    // then
    configuredParser.parse('key_191 + key_999');

    // and also
    configuredParser.parse('key_2 + key_1');
  });


  describe('normalizeContextKey', function() {

    it('should normalize string', function() {

      expect(normalizeContextKey('A+B  C')).to.eql('A + B C');

      expect(normalizeContextKey('A\'111+B  C')).to.eql('A \' 111 + B C');

      expect(normalizeContextKey('a**\'s')).to.eql('a ** \' s');

      expect(normalizeContextKey('a***')).to.eql('a ** *');

    });

  });


  describe('normalizeContextKeys', function() {

    it('should normalize context', function() {

      // given
      const date = new Date();

      expect(normalizeContextKeys({
        'A+B  C': {
          'A\'111+B  C': {
            'a**\'s': 10,
            bar: 100,
            woop: true,
            wap: false,
            arr: [ 1, 'two', {
              'a***': 10
            }, [ [ [ {
              'c++': 10
            } ] ] ] ]
          },
          'foo': undefined,
          'bar': null,
          'd': date
        }
      })).to.eql({
        'A + B C': {
          'A \' 111 + B C': {
            'a ** \' s': 10,
            'bar': 100,
            'woop': true,
            wap: false,
            arr: [ 1, 'two', {
              'a ** *': 10
            }, [ [ [ {
              'c + +': 10
            } ] ] ] ]
          },
          'foo': undefined,
          'bar': null,
          'd': date
        }
      });

    });

  });

});