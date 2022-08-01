# lezer-feel

[![CI](https://github.com/nikku/lezer-feel/actions/workflows/CI.yml/badge.svg)](https://github.com/nikku/lezer-feel/actions/workflows/CI.yml)

This is a [DMN](https://www.omg.org/spec/DMN/) FEEL grammar for the
[Lezer](https://lezer.codemirror.net/) parser system.


## Usage

Parse FEEL to a [`Tree`](https://lezer.codemirror.net/docs/ref/#common.Tree):

```javascript
import {
  parser
} from 'lezer-feel';

// parse <Expressions>
parser.parse('foo > 1');
```


#### Choose Dialect

Use `Expressions` or `UnaryTests` as a [top node](https://lezer.codemirror.net/docs/ref/#lr.LRParser.topNode) depending on which FEEL dialect you intend to parse:

```javascript
import {
  parser
} from 'lezer-feel';

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
} from 'lezer-feel';

const contextTracker = trackVariables({
  'if foo then bar': 1
});

const contextualParser = parser.configure({
  contextTracker
});

// recognizes <if foo then bar> as a <VariableName>
contextualParser.parse('if foo then bar');
```


## Related

* [feelin](https://github.com/nikku/feelin) - Interpreter for the FEEL language
* [feel-playground](https://github.com/nikku/feel-playground) - Playground to tryout and learn the FEEL language


## License

The code is licensed under an MIT license.
