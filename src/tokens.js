import {
  insertSemi,
  Identifier,
  functionDefinitionStart,
  FunctionDefinition,
  contextStart,
  Context,
  forExpressionStart,
  forExpressionBodyStart,
  ForExpression,
  quantifiedExpressionStart,
  QuantifiedExpression,
  ContextEntry,
  Name,
  ForInExpression,
  identifier,
  VariableName,
  expression0,
  QuantifiedInExpression,
  PositiveUnaryTest,
  nameIdentifier,
  additionalNameSymbol,
  propertyIdentifier,
  PropertyIdentifier,
  PropertyName,
  StringLiteral,
  BooleanLiteral,
  NumericLiteral,
  pathExpressionStart,
  PathExpression,
  ParameterName,
  IfExpression,
  ifExpressionStart,
  filterExpressionStart,
  FilterExpression,
  ArithmeticExpression,
  arithmeticPlusStart,
  arithmeticTimesStart,
  arithmeticExpStart,
  arithmeticUnaryStart,
  nil,
  AdditionalIdentifier
} from './parser.terms.js';

import {
  ContextTracker,
  ExternalTokenizer
} from '@lezer/lr';

const LOG_PARSE = false;
const LOG_VARS = false;

const space = [
  9, 11, 12, 32, 133, 160,
  5760, 8192, 8193, 8194, 8195, 8196, 8197, 8198,
  8199, 8200, 8201, 8202, 8232, 8233, 8239, 8287, 12288
];

const newline = chars('\n\r');

const additionalNameChars = chars("./-'+*");

/**
 * @param { string } str
 * @return { number[] }
 */
function chars(str) {
  return Array.from(str).map(s => s.charCodeAt(0));
}

/**
 * @param { number } ch
 * @return { boolean }
 */
function isAlpha(ch) {
  return (
    ch === 63 // ?
  ) || (
    ch === 95 // _
  ) || (
    ch >= 65 && ch <= 90
  ) || (
    ch >= 97 && ch <= 122
  ) || (
    ch >= 161
  );
}

/**
 * @param { number } ch
 * @return { boolean }
 */
function isAdditional(ch) {
  return additionalNameChars.includes(ch);
}

/**
 * @param { number } ch
 * @return { boolean }
 */
function isDigit(ch) {
  return (
    ch >= 48 &&
    ch <= 57
  );
}

/**
 * @param { number } ch
 * @return { boolean }
 */
function isSpace(ch) {
  return space.includes(ch);
}

// eslint-disable-next-line
function indent(str, spaces) {
  return spaces.concat(
    str.split(/\n/g).join('\n' + spaces)
  );
}

/**
 * @param { import('@lezer/lr').InputStream } input
 * @param  { number } [offset]
 *
 * @return { { token: string, offset: number } | null }
 */
function parseAdditionalSymbol(input, offset = 0) {

  const next = input.peek(offset);

  if (isAdditional(next)) {
    return {
      offset: 1,
      token: String.fromCharCode(next)
    };
  }

  return null;
}

/**
 * @param { import('@lezer/lr').InputStream } input
 * @param  { number } [offset]
 *
 * @return { { token: string, offset: number } | null }
 */
function parseIdentifier(input, offset = 0) {
  for (let inside = false, token = '', i = 0;; i++) {
    const next = input.peek(offset + i);

    if (isAlpha(next) || (inside && isDigit(next))) {
      if (!inside) {
        inside = true;
      }

      token += String.fromCharCode(next);
    } else {

      if (inside) {
        return {
          token,
          offset: i
        };
      }

      return null;
    }
  }
}

/**
 * @param { import('@lezer/lr').InputStream } input
 * @param  { number } offset
 *
 * @return { { token: string, offset: number } | null }
 */
function parseSpaces(input, offset) {

  for (let inside = false, i = 0;; i++) {
    let next = input.peek(offset + i);

    if (isSpace(next)) {
      if (!inside) {
        inside = true;
      }
    } else {
      if (inside) {
        return {
          token: ' ',
          offset: i
        };
      }

      return null;
    }
  }
}

/**
 * Parse a name from the input and return the first match, if any.
 *
 * @param { import('@lezer/lr').InputStream } input
 * @param { Variables } variables
 *
 * @return { { token: string, offset: number } | null }
 */
function parseName(input, variables) {
  const contextKeys = variables.contextKeys();

  const start = variables.tokens;

  for (let i = 0, tokens = [], nextMatch = null;;) {

    let match = (
      parseIdentifier(input, i) ||
      (start.length + tokens.length) && parseAdditionalSymbol(input, i) ||
      tokens.length && parseSpaces(input, i)
    );

    // match is required
    if (!match) {
      return nextMatch;
    }

    const {
      token,
      offset
    } = match;

    i += offset;

    if (token === ' ') {
      continue;
    }

    tokens = [ ...tokens, token ];

    const name = [ ...start, ...tokens ].join(' ');

    if (contextKeys.some(el => el === name)) {
      const token = tokens[0];

      nextMatch = {
        token,
        offset: token.length
      };
    }

    if (!contextKeys.some(el => el.startsWith(name))) {
      return nextMatch;
    }
  }

}

export const additionalNameSymbols = new ExternalTokenizer((input, stack) => {

  LOG_PARSE && console.log('%s: T <additionalNameSymbol>', input.pos);

  const match = parseAdditionalSymbol(input);

  if (match) {
    input.advance(match.offset);
    input.acceptToken(additionalNameSymbol);

    LOG_PARSE && console.log('--> match <additionalNameSymbol> <%s>', match.token);
  }
});

export const identifiers = new ExternalTokenizer((input, stack) => {

  LOG_PARSE && console.log('%s: T <identifier | nameIdentifier>', input.pos);

  const nameMatch = parseName(input, stack.context);

  const match = nameMatch || parseIdentifier(input);

  if (match) {
    input.advance(match.offset);
    input.acceptToken(nameMatch ? nameIdentifier : identifier);

    LOG_PARSE && console.log('--> match <%s> <%s>', nameMatch ? 'nameIdentifier' : 'identifier', match.token);
  }
}, { contextual: true });


export const propertyIdentifiers = new ExternalTokenizer((input, stack) => {

  LOG_PARSE && console.log('%s: T <propertyIdentifier>', input.pos);

  const match = parseIdentifier(input);

  if (match) {
    input.advance(match.offset);
    input.acceptToken(propertyIdentifier);

    LOG_PARSE && console.log('--> match <propertyIdentifier> <%s>', match.token);
  }
});


export const insertSemicolon = new ExternalTokenizer((input, stack) => {

  let insert = false;

  for (let i = 0;; i++) {
    const char = input.peek(i);

    if (space.includes(char)) {
      continue;
    }

    if (newline.includes(char)) {
      insert = true;
    }

    break;
  }

  if (insert) {
    input.acceptToken(insertSemi);
  }
});

const contextStarts = {
  [ contextStart ]: 'Context',
  [ functionDefinitionStart ]: 'FunctionDefinition',
  [ forExpressionStart ]: 'ForExpression',
  [ ifExpressionStart ]: 'IfExpression',
  [ quantifiedExpressionStart ]: 'QuantifiedExpression'
};

const contextEnds = {
  [ Context ]: 'Context',
  [ FunctionDefinition ]: 'FunctionDefinition',
  [ ForExpression ]: 'ForExpression',
  [ IfExpression ]: 'IfExpression',
  [ QuantifiedExpression ]: 'QuantifiedExpression',
  [ PathExpression ]: 'PathExpression',
  [ FilterExpression ]: 'FilterExpression',
  [ ArithmeticExpression ]: 'ArithmeticExpression'
};

class ValueProducer {

  /**
   * @param { Function } fn
   */
  constructor(fn) {
    this.fn = fn;
  }

  get(variables) {
    return this.fn(variables);
  }

  /**
   * @param { Function }
   *
   * @return { ValueProducer }
   */
  static of(fn) {
    return new ValueProducer(fn);
  }

}


class Variables {

  constructor({
    name = 'Expressions',
    tokens = [],
    children = [],
    parent = null,
    context = { },
    value
  } = {}) {
    this.name = name;
    this.tokens = tokens;
    this.children = children;
    this.parent = parent;
    this.context = context;
    this.value = value;
  }

  enterScope(name) {

    const childScope = this.of({
      name,
      parent: this
    });

    LOG_VARS && console.log('[%s] enter', childScope.path, childScope.context);

    return childScope;
  }

  exitScope(str) {

    if (!this.parent) {
      LOG_VARS && console.log('[%s] NO exit %o\n%s', this.path, this.context, indent(str, '  '));

      return this;
    }

    LOG_VARS && console.log('[%s] exit %o\n%s', this.path, this.context, indent(str, '  '));

    return this.parent.pushChild(this);
  }

  token(part) {

    // console.log('[%s] token <%s>', this.path, part);

    return this.assign({
      tokens: [ ...this.tokens, part ]
    });
  }

  literal(value) {

    LOG_VARS && console.log('[%s] literal %o', this.path, value);

    return this.pushChild(this.of({
      name: 'Literal',
      value
    }));
  }

  /**
   * Return computed scope value
   *
   * @return {any}
   */
  computedValue() {
    for (let scope = this;;scope = scope.children.slice(-1)[0]) {

      if (!scope) {
        return null;
      }

      if (scope.value) {
        return scope.value;
      }
    }
  }

  contextKeys() {
    return Object.keys(this.context);
  }

  get path() {
    return this.parent?.path?.concat(' > ', this.name) || this.name;
  }

  /**
   * Return value of variable.
   *
   * @param { string } variable
   * @return { any } value
   */
  get(variable) {
    const val = this.context[String(variable)];

    if (val instanceof ValueProducer) {
      return val.get(this);
    } else {
      return val;
    }
  }

  resolveName() {

    const variable = this.tokens.join(' ');
    const tokens = [];

    const parentScope = this.assign({
      tokens
    });

    const variableScope = this.of({
      name: 'VariableName',
      parent: parentScope,
      value: this.get(variable)
    });

    LOG_VARS && console.log('[%s] resolve name <%s=%s>', variableScope.path, variable, this.get(variable));

    return parentScope.pushChild(variableScope);
  }

  pushChild(child) {

    const parent = this.assign({
      children: [ ...this.children, child ]
    });

    child.parent = parent;

    return parent;
  }

  pushChildren(children) {

    let parent = this;

    for (const child of children) {
      parent = parent.pushChild(child);
    }

    return parent;
  }

  declareName() {

    if (this.tokens.length === 0) {
      throw Error('no tokens to declare name');
    }

    const variableName = this.tokens.join(' ');

    LOG_VARS && console.log('[%s] declareName <%s>', this.path, variableName);

    return this.assign({
      tokens: []
    }).pushChild(
      this.of({
        name: 'Name',
        value: variableName
      })
    );
  }

  define(name, value) {

    if (typeof name !== 'string') {
      LOG_VARS && console.log('[%s] no define <%s=%s>', this.path, name, value);

      return this;
    }

    name = normalizeContextKey(name);

    LOG_VARS && console.log('[%s] define <%s=%s>', this.path, name, value);

    const context = {
      ...this.context,
      [name]: value
    };

    return this.assign({
      context
    });
  }

  /**
   * @param { Record<string, any> } [options]
   *
   * @return { Variables }
   */
  assign(options = {}) {

    return Variables.of({
      ...this,
      ...options
    });
  }

  /**
   * @param { Record<string, any> } [options]
   *
   * @return { Variables }
   */
  of(options = {}) {

    const defaultOptions = {
      context: this.context,
      parent: this.parent
    };

    return Variables.of({
      ...defaultOptions,
      ...options
    });
  }

  static of(options) {
    const {
      name,
      tokens = [],
      children = [],
      parent = null,
      context = {},
      value
    } = options;

    return new Variables({
      name,
      tokens: [ ...tokens ],
      children: [ ...children ],
      context: {
        ...context
      },
      parent,
      value
    });
  }

}

export function normalizeContextKey(name) {
  return name.replace(/\s*([./\-'+*])\s*/g, ' $1 ').replace(/\s{2,}/g, ' ').trim();
}

/**
 * @template T
 *
 * @param {T} context
 * @return {T}
 */
export function normalizeContext(context) {

  if (typeof context === 'undefined' || context === null) {
    return context;
  }

  if (Object.getPrototypeOf(context) !== Object.prototype) {
    return context;
  }

  const normalizedContext = {};

  for (const [ key, value ] of Object.entries(context)) {
    normalizedContext[normalizeContextKey(key)] = normalizeContext(value);
  }

  return normalizedContext;
}

/**
 * Wrap children of variables under the given named child.
 *
 * @param { Variables } variables
 * @param { string } name
 * @param { string } code
 * @return { Variables }
 */
function wrap(variables, scopeName, code) {

  const parts = variables.children.filter(c => c.name !== scopeName);
  const children = variables.children.filter(c => c.name === scopeName);

  const namePart = parts[0];
  const valuePart = parts[Math.max(1, parts.length - 1)];

  const name = namePart.computedValue();
  const value = valuePart?.computedValue() || null;

  return variables
    .assign({
      children
    })
    .enterScope(scopeName)
    .pushChildren(parts)
    .exitScope(code)
    .define(name, value);
}

/**
 * @param { any } context
 *
 * @return { ContextTracker<Variables> }
 */
export function trackVariables(context = {}) {

  const start = Variables.of({
    context: normalizeContext(context)
  });

  return new ContextTracker({
    start,
    reduce(variables, term, stack, input) {

      if (term === Context) {
        variables = variables.assign({
          value: variables.context
        });
      }

      if (term === IfExpression) {
        const [ thenPart, elsePart ] = variables.children.slice(-2);

        variables = variables.assign({
          value: {
            ...thenPart?.computedValue(),
            ...elsePart?.computedValue()
          }
        });
      }

      if (term === FilterExpression) {
        const [ sourcePart, _ ] = variables.children.slice(-2);

        variables = variables.assign({
          value: sourcePart?.computedValue()
        });
      }

      const start = contextStarts[term];

      if (start) {
        return variables.enterScope(start);
      }

      const code = input.read(input.pos, stack.pos);

      const end = contextEnds[term];

      if (end) {
        return variables.exitScope(code);
      }

      if (term === ContextEntry) {
        return wrap(variables, 'ContextEntry', code);
      }

      if (
        term === ForInExpression ||
        term === QuantifiedInExpression
      ) {
        return wrap(variables, 'InExpression', code);
      }

      // define <partial> within ForExpression body
      if (term === forExpressionBodyStart) {

        return variables.define(
          'partial',
          ValueProducer.of(variables => {
            return variables.children[variables.children.length - 1]?.computedValue();
          })
        );
      }

      if (
        term === ParameterName
      ) {
        const [ left ] = variables.children.slice(-1);

        const name = left.computedValue();

        // TODO: attach type information
        return variables.define(name, 1);
      }

      // pull <expression> into PathExpression child
      if (term === pathExpressionStart) {

        const children = variables.children.slice(0, -1);
        const lastChild = variables.children.slice(-1)[0];

        return variables.assign({
          children
        }).enterScope('PathExpression').pushChild(lastChild).assign({
          context: {
            ...variables.context,
            ...lastChild.computedValue()
          }
        });
      }

      // pull <expression> into ArithmeticExpression child
      if (
        term === arithmeticPlusStart ||
        term === arithmeticTimesStart ||
        term === arithmeticExpStart
      ) {
        const children = variables.children.slice(0, -1);
        const lastChild = variables.children.slice(-1)[0];

        return variables.assign({
          children
        }).enterScope('ArithmeticExpression').pushChild(lastChild);
      }

      if (term === arithmeticUnaryStart) {
        return variables.enterScope('ArithmeticExpression');
      }

      // pull <expression> into FilterExpression child
      if (term === filterExpressionStart) {
        const children = variables.children.slice(0, -1);
        const lastChild = variables.children.slice(-1)[0];

        return variables.assign({
          children
        }).enterScope('FilterExpression').pushChild(lastChild).assign({
          context: {
            ...variables.context,
            ...lastChild.computedValue()
          }
        });
      }

      if (
        term === Identifier ||
        term === AdditionalIdentifier ||
        term === PropertyIdentifier
      ) {
        return variables.token(code);
      }

      if (
        term === StringLiteral
      ) {
        return variables.literal(code.replace(/^"|"$/g, ''));
      }

      if (term === BooleanLiteral) {
        return variables.literal(code === 'true' ? true : false);
      }

      if (term === NumericLiteral) {
        return variables.literal(parseFloat(code));
      }

      if (term === nil) {
        return variables.literal(null);
      }

      if (
        term === VariableName
      ) {
        return variables.resolveName();
      }

      if (
        term === Name ||
        term === PropertyName
      ) {
        return variables.declareName();
      }

      if (
        term === expression0 ||
        term === PositiveUnaryTest
      ) {
        if (variables.tokens.length > 0) {
          throw new Error('uncleared name');
        }
      }

      if (term === expression0) {

        let parent = variables;

        while (parent.parent) {
          parent = parent.exitScope(code);
        }

        return parent;
      }

      return variables;
    }
  });
}

export const variableTracker = trackVariables({});