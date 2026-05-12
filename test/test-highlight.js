import { highlightTree, tagHighlighter, tags as t } from '@lezer/highlight';
import { parser } from 'lezer-feel';
import { expect } from 'chai';

const highlighter = tagHighlighter([
  { tag: t.standard(t.function(t.variableName)), class: 'standard-function' },
  { tag: t.function(t.variableName), class: 'function' },
  { tag: t.variableName, class: 'variable' },
  { tag: t.propertyName, class: 'property' },
  { tag: t.special(t.variableName), class: 'special-variable' },
  { tag: t.modifier, class: 'modifier' },
  { tag: t.special(t.string), class: 'special-string' },
  { tag: t.arithmeticOperator, class: 'arithmetic-operator' },
  { tag: t.compareOperator, class: 'compare-operator' },
  { tag: t.function(t.definition(t.variableName)), class: 'function-argument' },
  { tag: t.definition(t.propertyName), class: 'property-definition' },
  { tag: t.definition(t.variableName), class: 'variable-definition' },
  { tag: t.blockComment, class: 'block-comment' },
  { tag: t.lineComment, class: 'line-comment' }
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
      expect(spans).to.deep.include({ text: 'foo', cls: 'variable' });
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

    it('should highlight operator', function() {

      // given
      const expression = 'a + b';

      // when
      const spans = getHighlights(expression);

      // then
      expect(spans).to.deep.include({ text: '+', cls: 'arithmetic-operator' });
    });

  });


  describe('comparison', function() {

    it('should highlight operator', function() {

      // given
      const expression = 'a >= b';

      // when
      const spans = getHighlights(expression);

      // then
      expect(spans).to.deep.include({ text: '>=', cls: 'compare-operator' });
    });


    it('should highlight unary test operator', function() {

      // given
      const expression = '<= b';

      // when
      const spans = getHighlights(expression, { top: 'UnaryTests' });

      // then
      expect(spans).to.deep.include({ text: '<=', cls: 'compare-operator' });
    });

  });


  describe('variables', function() {

    it('should highlight function argument', function() {

      // given
      const expression = 'myFunc(a)';

      // when
      const spans = getHighlights(expression);

      // then
      expect(spans).to.deep.include({ text: 'a', cls: 'variable' });
    });


    it('should highlight operants of arithmetic operations', function() {

      // given
      const expression = 'a + b';

      // when
      const spans = getHighlights(expression);

      // then
      expect(spans).to.deep.include({ text: 'a', cls: 'variable' });
      expect(spans).to.deep.include({ text: 'b', cls: 'variable' });
    });


    it('should highlight inside of quantified expression', function() {

      // given
      const expression = 'every c in b satisfies a';

      // when
      const spans = getHighlights(expression);

      // then
      expect(spans).to.deep.include({ text: 'a', cls: 'variable' });
      expect(spans).to.deep.include({ text: 'b', cls: 'variable' });
    });


    it('should highlight inside of comparison', function() {

      // given
      const expression = 'a < b';

      // when
      const spans = getHighlights(expression);

      // then
      expect(spans).to.deep.include({ text: 'a', cls: 'variable' });
      expect(spans).to.deep.include({ text: 'b', cls: 'variable' });
    });


    it('should highlight inside of context', function() {

      // given
      const expression = '{ b: a }';

      // when
      const spans = getHighlights(expression);

      // then
      expect(spans).to.deep.include({ text: 'a', cls: 'variable' });
    });


    it('should highlight inside of filter', function() {

      // given
      const expression = 'c[a]';

      // when
      const spans = getHighlights(expression);

      // then
      expect(spans).to.deep.include({ text: 'a', cls: 'variable' });
    });

  });


  describe('variable definitions', function() {

    it('should highlight in quantified expression', function() {

      // given
      const expression = 'every a in b satisfies c';

      // when
      const spans = getHighlights(expression, { top: 'UnaryTests' });

      // then
      expect(spans).to.deep.include({ text: 'a', cls: 'variable-definition' });
    });


    it('should highlight in for expression', function() {

      // given
      const expression = 'for a in b return c';

      // when
      const spans = getHighlights(expression, { top: 'UnaryTests' });

      // then
      expect(spans).to.deep.include({ text: 'a', cls: 'variable-definition' });
    });

  });


  describe('comments', function() {

    it('should highlight block comment', function() {

      // given
      const expression = '/* special iteration */ for a in b return c';

      // when
      const spans = getHighlights(expression, { top: 'UnaryTests' });

      // then
      expect(spans).to.deep.include({ text: '/* special iteration */', cls: 'block-comment' });
    });


    it('should highlight line comment', function() {

      // given
      const expression = `// special iteration
for a in b return c`;

      // when
      const spans = getHighlights(expression, { top: 'UnaryTests' });

      // then
      expect(spans).to.deep.include({ text: '// special iteration', cls: 'line-comment' });
    });

  });


  it('should highlight at literal', function() {

    // given
    const expression = '@"2026-01-09"';

    // when
    const spans = getHighlights(expression);

    // then
    expect(spans).to.deep.include({ text: '@"2026-01-09"', cls: 'special-string' });
  });


  describe('path expression', function() {

    it('should highlight accessed property', function() {

      // given
      const expression = 'foo.bar';

      // when
      const spans = getHighlights(expression);

      // then
      expect(spans).to.deep.include({ text: 'foo', cls: 'variable' });
      expect(spans).to.deep.include({ text: 'bar', cls: 'property' });
    });

  });


  describe('context', function() {

    it('should highlight key', function() {

      // given
      const expression = '{ a + 1: b }';

      // when
      const spans = getHighlights(expression);

      // then
      expect(spans).to.deep.include({ text: 'a + 1', cls: 'property-definition' });
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


  describe('function definition', function() {

    it('should highlight function parameters', function() {

      // given
      const expression = 'function(a, b) return c';

      // when
      const spans = getHighlights(expression);

      // then
      expect(spans).to.deep.include({ text: 'a', cls: 'function-argument' });
      expect(spans).to.deep.include({ text: 'b', cls: 'function-argument' });
    });


    it('should highlight typed function parameters', function() {

      // given
      const expression = 'function(a: string, b: number) return c';

      // when
      const spans = getHighlights(expression);

      // then
      expect(spans).to.deep.include({ text: 'a', cls: 'function-argument' });
      expect(spans).to.deep.include({ text: 'b', cls: 'function-argument' });
    });

  });

});
