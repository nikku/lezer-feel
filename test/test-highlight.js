import { highlightTree, tagHighlighter, tags as t } from '@lezer/highlight';
import { parser } from 'lezer-feel';
import { expect } from 'chai';

const highlighter = tagHighlighter([
  { tag: t.standard(t.function(t.variableName)), class: 'standard-function' },
  { tag: t.function(t.variableName), class: 'function' },
  { tag: t.variableName, class: 'variable' },
  { tag: t.propertyName, class: 'property' },
  { tag: t.special(t.variableName), class: 'special-variable' },
  { tag: t.modifier, class: 'modifier' }
]);

/**
 * Returns highlight spans for the given expression.
 *
 * @param { string } expression
 * @param { { top?: 'Expression'| 'UnaryTests' } } [options]
 *
 * @return {{ text: string, cls: string }[]}
 */
function getHighlights(expression, options = { top: 'Expression' }) {
  const spans = [];

  const {
    top = 'Expression'
  } = options;

  highlightTree(parser.configure({ top }).parse(expression), highlighter, (from, to, cls) => {
    spans.push({ text: expression.slice(from, to), cls });
  });
  return spans;
}


describe('feel highlighting', function() {

  describe('function calls', function() {

    it('should highlight function call', function() {

      // given
      const expression = 'myFunc(a)';

      // when
      const spans = getHighlights(expression);

      // then
      expect(spans).to.deep.include({ text: 'myFunc', cls: 'function' });
      expect(spans).to.deep.include({ text: 'a', cls: 'variable' });
    });


    it('should highlight builtin function call', function() {

      // given
      const expression = 'date("2026-09-05")';

      // when
      const spans = getHighlights(expression);

      // then
      expect(spans).to.deep.include({ text: 'date', cls: 'standard-function' });
    });


    it('should not highlight path expression call components as function', function() {

      // given
      const expression = 'foo.bar(a)';

      // when
      const spans = getHighlights(expression);

      // then
      expect(spans).to.deep.include({ text: 'foo', cls: 'property' });
      expect(spans).to.deep.include({ text: 'bar', cls: 'property' });
      expect(spans).to.deep.include({ text: 'a', cls: 'variable' });
    });


    it('should not highlight wrapped call components as function', function() {

      // given
      // the callable (foo) is not a direct VariableName - not a function
      const expression = '(foo)(a)';

      // when
      const spans = getHighlights(expression);

      // then
      expect(spans).to.deep.include({ text: 'foo', cls: 'variable' });
      expect(spans).to.deep.include({ text: 'a', cls: 'variable' });
    });

  });


  describe('arithmetic operations', function() {

    it('should highlight variables referenced', function() {

      // given
      const expression = 'a + b';

      // when
      const spans = getHighlights(expression);

      // then
      expect(spans).to.deep.include({ text: 'a', cls: 'variable' });
      expect(spans).to.deep.include({ text: 'b', cls: 'variable' });
    });

  });


  describe('path expression', function() {

    it('should highlight accessed property', function() {

      // given
      const expression = 'foo.bar';

      // when
      const spans = getHighlights(expression);

      // then
      expect(spans).to.deep.include({ text: 'foo', cls: 'property' });
      expect(spans).to.deep.include({ text: 'bar', cls: 'property' });
    });

  });


  describe('unary test', function() {

    it('should highlight ?', function() {

      // given
      const expression = '?';

      // when
      const spans = getHighlights(expression, { top: 'UnaryTests' });

      // then
      expect(spans).to.deep.include({ text: '?', cls: 'special-variable' });
    });


    it('should highlight ? in comparison', function() {

      // given
      const expression = '? > 10';

      // when
      const spans = getHighlights(expression, { top: 'UnaryTests' });

      // then
      expect(spans).to.deep.include({ text: '?', cls: 'special-variable' });
    });


    it('should highlight -', function() {

      // given
      const expression = '-';

      // when
      const spans = getHighlights(expression, { top: 'UnaryTests' });

      // then
      expect(spans).to.deep.include({ text: '-', cls: 'modifier' });
    });

  });

});
