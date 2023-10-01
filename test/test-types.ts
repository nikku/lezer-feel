import {
  parser,
  trackVariables,
  normalizeContextKey,
  VariableContext
} from '..';

import {
  expect
} from 'chai';

import { Variables } from '../src/tokens';


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


  describe('normalizeContextKey', () => {

    it('should normalize string', () => {

      expect(normalizeContextKey('A+B  C')).to.eql('A + B C');

    });

  });


  describe('trackVariables', () => {

    class CustomVariableContext extends VariableContext { }


    it('should allow custom VariableContext', () => {

      const tracker = trackVariables();

      const someTracker = trackVariables({});

      const otherTracker = trackVariables({}, CustomVariableContext);
    });

  });


  describe('VariableContext', () => {

    it('should work', () => {

      // when
      const context = VariableContext.of(null);

      const otherContext = VariableContext.of({
        foo: 10
      });

      const wrappedContext = VariableContext.of(otherContext);

      const mergedContext = VariableContext.of(context, otherContext, wrappedContext);

      const foo = mergedContext.get('foo');

      const keys = mergedContext.getKeys();

      expect(keys.length).to.eql(0);

      const newContext = mergedContext.set('foo', 109);

      expect(newContext).not.to.equal(mergedContext);
    });

  });

});