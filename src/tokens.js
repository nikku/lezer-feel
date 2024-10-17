/* global console,process */

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
  List,
  listStart,
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
  AdditionalIdentifier,
  FunctionInvocation,
  functionInvocationStart
} from './parser.terms.js';

import {
  ContextTracker,
  ExternalTokenizer
} from '@lezer/lr';

// @ts-expect-error env access
const LOG_PARSE = typeof process != 'undefined' && process.env && /\bfparse(:dbg)?\b/.test(process.env.LOG);

// @ts-expect-error env access
const LOG_PARSE_DEBUG = typeof process != 'undefined' && process.env && /\bfparse:dbg\b/.test(process.env.LOG);

// @ts-expect-error env access
const LOG_VARS = typeof process != 'undefined' && process.env && /\bcontext\b/.test(process.env.LOG);

const spaceChars = [
  9, 11, 12, 32, 133, 160,
  5760, 8192, 8193, 8194, 8195, 8196, 8197, 8198,
  8199, 8200, 8201, 8202, 8232, 8233, 8239, 8287, 12288
];

const newlineChars = chars('\n\r');

const asterix = '*'.charCodeAt(0);

const additionalNameChars = chars("'./-+*^");

/**
 * @typedef { VariableContext | any } ContextValue
 */

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
    ch >= 65 && ch <= 90 // A-Z
  ) || (
    ch === 95 // _
  ) || (
    ch >= 97 && ch <= 122 // a-z
  ) || (
    ch >= 0xC0 && ch <= 0xD6
  ) || (
    ch >= 0xD8 && ch <= 0xF6
  ) || (
    ch >= 0xF8 && ch <= 0x2FF
  ) || (
    ch >= 0x370 && ch <= 0x37D
  ) || (
    ch >= 0x37F && ch <= 0x1FFF
  ) || (
    ch >= 0x200C && ch <= 0x200D
  ) || (
    ch >= 0x2070 && ch <= 0x218F
  ) || (
    ch >= 0x2C00 && ch <= 0x2FEF
  ) || (
    ch >= 0x3001 && ch <= 0xD7FF
  ) || (
    ch >= 0xF900 && ch <= 0xFDCF
  ) || (
    ch >= 0xFDF0 && ch <= 0xFFFD
  ) || (
    ch >= 0xD800 && ch <= 0xDBFF // upper surrogate
  ) || (
    ch >= 0xDC00 && ch <= 0xDFFF // lower surrogate
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

  if (next === asterix && input.peek(offset + 1) === asterix) {

    return {
      offset: 2,
      token: '**'
    };
  }

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
      namePart && parseAdditionalSymbol(input, i) ||
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

    if (contextKeys.some(el => el.startsWith(name))) {
      continue;
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

    if (dateTimeIdentifiers.some(el => el.startsWith(name))) {
      continue;
    }

    return nextMatch;
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

const prefixedContextStarts = {
  [ functionInvocationStart ]: 'FunctionInvocation',
  [ filterExpressionStart ]: 'FilterExpression',
  [ pathExpressionStart ]: 'PathExpression'
};

const contextStarts = {
  [ contextStart ]: 'Context',
  [ functionDefinitionStart ]: 'FunctionDefinition',
  [ forExpressionStart ]: 'ForExpression',
  [ listStart ]: 'List',
  [ ifExpressionStart ]: 'IfExpression',
  [ quantifiedExpressionStart ]: 'QuantifiedExpression'
};

const contextEnds = {
  [ Context ]: 'Context',
  [ FunctionDefinition ]: 'FunctionDefinition',
  [ ForExpression ]: 'ForExpression',
  [ List ]: 'List',
  [ IfExpression ]: 'IfExpression',
  [ QuantifiedExpression ]: 'QuantifiedExpression',
  [ PathExpression ]: 'PathExpression',
  [ FunctionInvocation ]: 'FunctionInvocation',
  [ FilterExpression ]: 'FilterExpression',
  [ ArithmeticExpression ]: 'ArithmeticExpression'
};

/**
 * A simple producer that retrievs a value from
 * a given context. Used to lazily take things.
 */
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
   * @param { Function } fn
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


/**
 * A basic key-value store to hold context values.
 */
export class VariableContext {

  /**
   * Creates a new context from a JavaScript object.
   *
   * @param {any} value
   */
  constructor(value = {}) {

    /**
     * @protected
     */
    this.value = value;
  }

  /**
   * Return all defined keys of the context.
   *
   * @returns {Array<string>} the keys of the context
   */
  getKeys() {
    return Object.keys(this.value);
  }

  /**
   * Returns the value of the given key.
   *
   * If the value represents a context itself, it should be wrapped in a
   * context class.
   *
   * @param {String} key
   * @returns {VariableContext|ValueProducer|null}
   */
  get(key) {
    const result = this.value[key];

    const constructor = /** @type { typeof VariableContext } */ (this.constructor);

    if (constructor.isAtomic(result)) {
      return result;
    }

    return constructor.of(result);
  }

  /**
   * Creates a new context with the given key added.
   *
   * @param {String} key
   * @param {any} value
   *
   * @returns {VariableContext} new context with the given key added
   */
  set(key, value) {

    const constructor = /** @type { typeof VariableContext } */ (this.constructor);

    return constructor.of({
      ...this.value,
      [key]: value
    });
  }

  /**
   * Wether the given value is atomic. Non-atomic values need to be wrapped in a
   * context Class.
   *
   * @param {any} value
   * @returns {Boolean}
   */
  static isAtomic(value) {
    return !value ||
          value instanceof this ||
          value instanceof ValueProducer ||
          typeof value !== 'object';
  }

  /**
   * Takes any number of Contexts and merges them into a single Context.
   *
   * @param  {...VariableContext} contexts
   * @returns {VariableContext}
   */
  static of(...contexts) {
    const unwrap = (context) => {
      if (!context || typeof context !== 'object') {
        return {};
      }

      if (context instanceof this) {
        return context.value;
      }

      return { ...context };
    };

    const merged = contexts.reduce((merged, context) => {
      return {
        ...merged,
        ...unwrap(context)
      };
    }, {});

    return new this(merged);
  }

}

class Variables {

  /**
   * @param { {
   *   name?: string,
   *   tokens?: string[],
   *   children?: Variables[],
   *   parent: Variables | null
   *   context: VariableContext,
   *   value?: any,
   *   raw?: any
   * } } options
   */
  constructor({
    name = 'Expressions',
    tokens = [],
    children = [],
    parent = null,
    context,
    value,
    raw
  }) {
    this.name = name;
    this.tokens = tokens;
    this.children = children;
    this.parent = parent;
    this.context = context;
    this.value = value;
    this.raw = raw;
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
    for (let scope = this;;scope = last(scope.children)) {

      if (!scope) {
        return null;
      }

      if (scope.value) {
        return scope.value;
      }
    }
  }

  contextKeys() {
    return this.context.getKeys().map(normalizeContextKey);
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

    const names = [ variable, variable && normalizeContextKey(variable) ];

    const contextKey = this.context.getKeys().find(
      key => names.includes(normalizeContextKey(key))
    );

    if (typeof contextKey === 'undefined') {
      return undefined;
    }

    const val = this.context.get(contextKey);

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
      value: this.get(variable),
      raw: variable
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

    /**
     * @type {Variables}
     */
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

    const context = this.context.set(name, value);

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

  /**
   * @param { {
   *   name?: string,
   *   tokens?: string[],
   *   children?: Variables[],
   *   parent?: Variables | null
   *   context: VariableContext,
   *   value?: any,
   *   raw?: any
   * } } options
   *
   * @return {Variables}
   */
  static of(options) {

    const {
      name,
      tokens = [],
      children = [],
      parent = null,
      context,
      value,
      raw
    } = options;

    if (!context) {
      throw new Error('must provide <context>');
    }

    return new Variables({
      name,
      tokens: [ ...tokens ],
      children: [ ...children ],
      context,
      parent,
      value,
      raw
    });
  }

}

/**
 * @param { string } name
 *
 * @return { string } normalizedName
 */
export function normalizeContextKey(name) {
  return name.replace(/\s*([./\-'+]|\*\*?)\s*/g, ' $1 ').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Wrap children of variables under the given named child.
 *
 * @param { Variables } variables
 * @param { string } scopeName
 * @param { string } code
 * @return { Variables }
 */
function wrap(variables, scopeName, code) {

  const parts = variables.children.filter(c => c.name !== scopeName);
  const children = variables.children.filter(c => c.name === scopeName);

  const namePart = parts[0];
  const valuePart = parts[Math.max(1, parts.length - 1)];

  const name = namePart?.computedValue();
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
 * @param { ContextValue } [context]
 * @param { typeof VariableContext } [Context]
 *
 * @return { ContextTracker<Variables> }
 */
export function trackVariables(context = {}, Context = VariableContext) {

  const start = Variables.of({
    context: Context.of(context)
  });

  return new ContextTracker({
    start,
    reduce(variables, term, stack, input) {

      if (term === IfExpression) {
        const [ thenPart, elsePart ] = variables.children.slice(-2);

        variables = variables.assign({
          value: Context.of(
            thenPart?.computedValue(),
            elsePart?.computedValue()
          )
        });
      }

      if (term === List) {
        variables = variables.assign({
          value: Context.of(
            ...variables.children.map(
              c => c?.computedValue()
            )
          )
        });
      }

      if (term === FilterExpression) {
        const [ sourcePart, _ ] = variables.children.slice(-2);

        variables = variables.assign({
          value: sourcePart?.computedValue()
        });
      }

      if (term === FunctionInvocation) {

        const [
          name,
          ...args
        ] = variables.children;

        // preserve type information through `get value(context, key)` utility
        if (name?.raw === 'get value') {
          variables = getContextValue(variables, args);
        }
      }

      const start = contextStarts[term];

      if (start) {
        return variables.enterScope(start);
      }

      const prefixedStart = prefixedContextStarts[term];

      // pull <expression> into new <prefixedStart> context
      if (prefixedStart) {

        const {
          children: currentChildren,
          context: currentContext,
        } = variables;

        const children = currentChildren.slice(0, -1);
        const lastChild = last(currentChildren);

        let newContext = null;

        if (term === pathExpressionStart) {
          newContext = Context.of(lastChild?.computedValue());
        }

        if (term === filterExpressionStart) {
          newContext = Context.of(
            currentContext,
            lastChild?.computedValue()
          ).set('item', lastChild?.computedValue());
        }

        return variables
          .assign({ children })
          .enterScope(prefixedStart)
          .pushChild(lastChild)
          .assign({ context: newContext || currentContext });
      }

      // @ts-expect-error internal method
      const code = input.read(input.pos, stack.pos);

      const end = contextEnds[term];

      if (end) {
        return variables.exitScope(code);
      }

      if (term === ContextEntry) {
        const parts = variables.children.filter(c => c.name !== 'ContextEntry');

        const name = parts[0];
        const value = last(parts);

        return wrap(variables, 'ContextEntry', code).assign(
          {
            value: Context
              .of(variables.value)
              .set(name?.computedValue(), value?.computedValue())
          }
        );
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
            return last(variables.children)?.computedValue();
          })
        );
      }

      if (
        term === ParameterName
      ) {
        const name = last(variables.children).computedValue();

        // TODO: attach type information
        return variables.define(name, 1);
      }

      // pull <expression> into ArithmeticExpression child
      if (
        term === arithmeticPlusStart ||
        term === arithmeticTimesStart ||
        term === arithmeticExpStart
      ) {
        const children = variables.children.slice(0, -1);
        const lastChild = last(variables.children);

        return variables.assign({
          children
        }).enterScope('ArithmeticExpression').pushChild(lastChild);
      }

      if (term === arithmeticUnaryStart) {
        return variables.enterScope('ArithmeticExpression');
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


// helpers //////////////

function getContextValue(variables, args) {

  if (!args.length) {
    return variables.assign({
      value: null
    });
  }

  if (args[0].name === 'Name') {
    args = extractNamedArgs(args, [ 'm', 'key' ]);
  }

  if (args.length !== 2) {
    return variables.assign({
      value: null
    });
  }

  const [
    context,
    key
  ] = args;

  const keyValue = key?.computedValue();
  const contextValue = context?.computedValue();

  if (
    (!contextValue || typeof contextValue !== 'object') || typeof keyValue !== 'string'
  ) {
    return variables.assign({
      value: null
    });
  }

  return variables.assign({
    value: [ normalizeContextKey(keyValue), keyValue ].reduce((value, keyValue) => {
      return contextValue.get(keyValue) || value;
    }, null)
  });
}

function extractNamedArgs(args, argNames) {

  const context = {};

  for (let i = 0; i < args.length; i += 2) {
    const [ name, value ] = args.slice(i, i + 2);

    context[name.value] = value;
  }

  return argNames.map(name => context[name]);
}

function last(arr) {
  return arr[arr.length - 1];
}