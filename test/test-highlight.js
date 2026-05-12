import { highlightTree, tagHighlighter, tags as t } from '@lezer/highlight';
import { parser } from 'lezer-feel';
import { expect } from 'chai';

const highlighter = tagHighlighter([
  { tag: t.standard(t.function(t.variableName)), class: 'standard-function' },
  { tag: t.function(t.variableName), class: 'function' },
  { tag: t.variableName, class: 'variable' },
  { tag: t.propertyName, class: 'property' }
]);

/**
 * Returns highlight spans for the given expression.
 *
 * @param {string} expression
 * @return {{ text: string, cls: string }[]}
 */
function getHighlights(expression) {
  const spans = [];
  highlightTree(parser.parse(expression), highlighter, (from, to, cls) => {
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

});
