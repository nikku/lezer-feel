import {
  normalizeContextKey
} from '../src/tokens.js';

import {
  expect
} from 'chai';


describe('tokens', () => {

  describe('normalizeContextKey', () => {

    it('should normalize string', () => {

      expect(normalizeContextKey('A+B  C')).to.eql('A + B C');

      expect(normalizeContextKey('A\'111+B  C')).to.eql('A \' 111 + B C');

    });

  });

});