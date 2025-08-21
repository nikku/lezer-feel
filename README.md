# @bpmn-io/lezer-feel

[![CI](https://github.com/bpmn-io/lezer-feel/actions/workflows/CI.yml/badge.svg)](https://github.com/bpmn-io/lezer-feel/actions/workflows/CI.yml)

> [!INFO] This is a fork of [lezer-feel](https://github.com/nikku/lezer-feel)

This is a [DMN](https://www.omg.org/spec/DMN/) FEEL grammar for the
[Lezer](https://lezer.codemirror.net/) parser system.


## Usage

Parse FEEL to a [`Tree`](https://lezer.codemirror.net/docs/ref/#common.Tree):

```javascript
import {
  parser
} from '@bpmn-io/lezer-feel';

// parse <Expression>
parser.parse('foo > 1');
```


#### Choose Dialect

Use `Expression` or `UnaryTests` as a [top node](https://lezer.codemirror.net/docs/ref/#lr.LRParser.topNode) depending on which FEEL dialect you intend to parse:

```javascript
import {
  parser
} from '@bpmn-io/lezer-feel';

const unaryParser = parser.configure({
  top: 'UnaryTests'
})

// parse <UnaryTests>
unaryParser.parse('> 100');
```


#### Provide Context

Override the default [context tracker](https://lezer.codemirror.net/docs/ref/#lr.ParserConfig.contextTracker) to enable context sensitive parsing based on inputs:

```javascript
import {
  parser,
  trackVariables
} from '@bpmn-io/lezer-feel';

const contextTracker = trackVariables({
  'if foo then bar': 1
});

const contextualParser = parser.configure({
  contextTracker
});

// recognizes <if foo then bar> as a <VariableName>
contextualParser.parse('if foo then bar');
```


## Development

```shell
# build and test
npm run all

# test
npm test

# test (debug)
LOG=fparse:dbg,fparse,context,parse npm test
```

Prefix [individual](./test/expressions.txt) [tests](./test/unary-tests.txt) with a `*` to test them in focus mode:

```markdown
# *ArithmeticExpression (error)

...
```


## Related

* [feelin](https://github.com/bpmn-io/feelin) - Interpreter for the FEEL language
* [feel-playground](https://github.com/nikku/feel-playground) - A visual playground to learn the FEEL language


## License

The code is licensed under an MIT license.
