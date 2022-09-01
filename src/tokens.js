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

const LOG_PARSE = typeof process != 'undefined' && process.env && /\bfparse(:dbg)?\b/.test(process.env.LOG);
const LOG_PARSE_DEBUG = typeof process != 'undefined' && process.env && /\fparse:dbg\b/.test(process.env.LOG);
const LOG_VARS = typeof process != 'undefined' && process.env && /\bcontext?\b/.test(process.env.LOG);

const spaceChars = [
  9, 11, 12, 32, 133, 160,
  5760, 8192, 8193, 8194, 8195, 8196, 8197, 8198,
  8199, 8200, 8201, 8202, 8232, 8233, 8239, 8287, 12288
];

const newlineChars = chars('\n\r');

const additionalNameChars = chars("'./-+*");

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
function isStartChar(ch) {
  return (
    ch === 63 // ?
  ) || (
    ch === 95 // _
  ) || (
    ch >= 65 && ch <= 90 // A-Z
  ) || (
    ch >= 97 && ch <= 122 // a-z
  ) || (
    ch >= 161 && !isPartChar(ch) && !isSpace(ch)
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
function isPartChar(ch) {
  return (
    ch >= 48 && ch <= 57 // 0-9
  ) || (
    ch === 0xB7
  ) || (
    ch >= 0x0300 && ch <= 0x036F
  ) || (
    ch >= 0x203F && ch <= 0x2040
  );
}

/**
 * @param { number } ch
 * @return { boolean }
 */
function isSpace(ch) {
  return spaceChars.includes(ch);
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
 * @param { boolean } [includeOperators]
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
 * @param { number } [offset]
 * @param { boolean } [namePart]
 *
 * @return { { token: string, offset: number } | null }
 */
function parseIdentifier(input, offset = 0, namePart = false) {
  for (let inside = false, chars = [], i = 0;; i++) {
    const next = input.peek(offset + i);

    if (isStartChar(next) || ((inside || namePart) && isPartChar(next))) {
      if (!inside) {
        inside = true;
      }

      chars.push(next);
    } else {

      if (chars.length) {
        return {
          token: String.fromCharCode(...chars),
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
 * @return { { token: string, offset: number, term: number } | null }
 */
function parseName(input, variables) {
  const contextKeys = variables.contextKeys();

  const start = variables.tokens;

  for (let i = 0, tokens = [], nextMatch = null;;) {

    const namePart = (start.length + tokens.length) > 0;
    const maybeSpace = tokens.length > 0;

    const match = (
      parseIdentifier(input, i, namePart) ||
      namePart && parseAdditionalSymbol(input, i, true) ||
      maybeSpace && parseSpaces(input, i)
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
        offset: token.length,
        term: nameIdentifier
      };
    }

    if (dateTimeIdentifiers.some(el => el === name)) {
      const token = tokens[0];

      // parse date time identifiers as normal
      // identifiers to allow specialization to kick in
      //
      // cf. https://github.com/nikku/lezer-feel/issues/8
      nextMatch = {
        token,
        offset: token.length,
        term: identifier
      };
    }

    if (
      !contextKeys.some(el => el.startsWith(name)) &&
      !dateTimeIdentifiers.some(el => el.startsWith(name))
    ) {
      return nextMatch;
    }
  }

}

const identifiersMap = {
  [ identifier ]: 'identifier',
  [ nameIdentifier ]: 'nameIdentifier'
};

export const identifiers = new ExternalTokenizer((input, stack) => {

  LOG_PARSE_DEBUG && console.log('%s: T <identifier | nameIdentifier>', input.pos);

  const nameMatch = parseName(input, stack.context);

  const start = stack.context.tokens;

  const match = nameMatch || parseIdentifier(input, 0, start.length > 0);

  if (match) {
    input.advance(match.offset);
    input.acceptToken(nameMatch ? nameMatch.term : identifier);

    LOG_PARSE && console.log('%s: MATCH <%s> <%s>', input.pos, nameMatch ? identifiersMap[nameMatch.term] : 'identifier', match.token);
  }
}, { contextual: true });


export const propertyIdentifiers = new ExternalTokenizer((input, stack) => {

  LOG_PARSE_DEBUG && console.log('%s: T <propertyIdentifier>', input.pos);

  const start = stack.context.tokens;

  const match = parseIdentifier(input, 0, start.length > 0);

  if (match) {
    input.advance(match.offset);
    input.acceptToken(propertyIdentifier);

    LOG_PARSE && console.log('%s: MATCH <propertyIdentifier> <%s>', input.pos, match.token);
  }
});


export const insertSemicolon = new ExternalTokenizer((input, stack) => {

  LOG_PARSE_DEBUG && console.log('%s: T <insertSemi>', input.pos);

  let offset;
  let insert = false;

  for (offset = 0;; offset++) {
    const char = input.peek(offset);

    if (spaceChars.includes(char)) {
      continue;
    }

    if (newlineChars.includes(char)) {
      insert = true;
    }

    break;
  }

  if (insert) {

    const identifier = parseIdentifier(input, offset + 1);
    const spaces = parseSpaces(input, offset + 1);

    if (spaces || identifier && /^(then|else|return|satisfies)$/.test(identifier.token)) {
      return;
    }

    LOG_PARSE && console.log('%s: MATCH <insertSemi>', input.pos);
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

const dateTimeLiterals = {
  'date and time': 1,
  'date': 1,
  'time': 1,
  'duration': 1
};

const dateTimeIdentifiers = Object.keys(dateTimeLiterals);

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

    LOG_VARS && console.log('[%s] token <%s> + <%s>', this.path, this.tokens.join(' '), part);

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
    return Object.keys(this.context).map(normalizeContextKey);
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

    if (!child) {
      return this;
    }

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

/**
 * @param { string } name
 *
 * @return { string } normalizedName
 */
export function normalizeContextKey(name) {
  return name.replace(/\s*([./\-'+*])\s*/g, ' $1 ').replace(/\s{2,}/g, ' ').trim();
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
    context
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
            ...lastChild?.computedValue()
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