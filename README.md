# lezer-feel

[![CI](https://github.com/nikku/lezer-feel/actions/workflows/CI.yml/badge.svg)](https://github.com/nikku/lezer-feel/actions/workflows/CI.yml)

This is a [DMN 1.3](https://www.omg.org/spec/DMN/1.3/) FEEL grammar for the
[Lezer](https://lezer.codemirror.net/) parser system.

Supports context sensitive language parsing.


## Usage

Parse FEEL to a [Lezer Tree](https://lezer.codemirror.net/docs/ref/#common.Tree):

```javascript
import {
  parser
} from 'lezer-feel';

// parse <Expressions>
parser.parse('foo > 1');

// parse <UnaryTests>
parser.configure({
  top: 'UnaryTests'
}).parse('> 100');
```

To enable context sensitive parsing based on inputs, configure the parser accordingly:

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


## License

The code is licensed under an MIT license.
