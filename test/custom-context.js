import {
  VariableContext
} from 'lezer-feel';


/**
 * @typedef { { entries?: Record<string, any>, [key: string]: any } } EntriesContextValue
 */


/**
 * A context that holds multiple alternative shape variants,
 * preserving distinct shapes instead of merging them.
 */
class UnionContext extends VariableContext {

  /**
   * @param { VariableContext[] } variants
   */
  constructor(variants) {
    super({});
    this.variants = variants;
  }

  /**
   * Return all keys available across all variants.
   *
   * @returns {string[]}
   */
  getKeys() {
    const allKeys = new Set();
    for (const variant of this.variants) {
      for (const key of variant.getKeys()) {
        allKeys.add(key);
      }
    }
    return [ ...allKeys ];
  }

  /**
   * Return value for the given key, searching across all variants.
   * If multiple variants have the key, returns a new UnionContext of those values.
   *
   * @param {string} key
   * @returns {VariableContext|null}
   */
  get(key) {
    const results = [];
    for (const variant of this.variants) {
      const val = variant.get(key);
      if (val != null) {
        results.push(val);
      }
    }

    if (results.length === 0) {
      return null;
    }

    if (results.length === 1) {
      return results[0];
    }

    // return a union when multiple variants exist
    return new UnionContext(results.map(r => EntriesContext.toVariant(r)));
  }

  /**
   * Add a key as a new variant entry.
   *
   * @param {string} key
   * @param {any} value
   *
   * @returns {this}
   */
  set(key, value) {

    const context = /** @type {this} */ (
      new UnionContext([
        ...this.variants,
        EntriesContext.of({ entries: { [key]: value } })
      ])
    );

    return context;
  }
}


/**
 * An alternative context that holds additional meta-data
 */
export class EntriesContext extends VariableContext {

  /**
   * @param {EntriesContextValue} value
   */
  constructor(value = { entries: {} }) {
    super(value);

    const entries = this.value.entries = this.value.entries || {};

    for (const [ key, entry ] of Object.entries(entries)) {
      if (entry instanceof EntriesContext) {
        continue;
      }

      entries[key] = EntriesContext.of(entry);
    }
  }

  getKeys() {
    return Object.keys(this.value.entries);
  }

  get(key) {
    const value = this.value.entries[key];

    if (!value) {
      return value;
    }

    const atomicValue = value?.value.atomicValue;

    // keep value producer
    if (atomicValue?.fn) {
      return atomicValue;
    }

    return value;
  }

  /**
   * @param {string} key
   * @param {any} value
   *
   * @return {this}
   */
  set(key, value) {

    const constructor = /** @type { typeof EntriesContext } */ (this.constructor);

    return /** @type {this} */ (constructor.of(
      {
        ...this.value,
        entries: {
          ...this.value.entries,
          [key]: value
        }
      }
    ));
  }

  /**
   * @param { EntriesContext | EntriesContextValue | Record<string, any> } context
   *
   * @return { EntriesContextValue }
   */
  static __unwrap(context) {

    if (this.isAtomic(context)) {
      return context instanceof this
        ? context.value
        : { atomicValue: context };
    }

    return context;
  }

  /**
   * Create a context from one or more values.
   *
   * @param { ...(VariableContext | EntriesContextValue | any) } contexts
   * @returns { EntriesContext | UnionContext }
   */
  static of(...contexts) {
    if (contexts.length > 1) {

      // create a union context preserving each variant's shape
      return new UnionContext(contexts.map(c => this.toVariant(c)));
    }

    // create new context from key
    return this.toVariant(contexts[0]);
  }

  /**
   * Normalize a value to a VariableContext variant.
   * VariableContext subclasses are returned as-is; plain values are wrapped.
   *
   * @param {VariableContext | any} value
   * @returns {VariableContext}
   */
  static toVariant(value) {
    return value instanceof VariableContext ? value : new this(this.__unwrap(value));
  }

}


export function toEntriesContextValue(context) {

  return context && Object.keys(context).reduce((result, key) => {
    const value = context[key];

    result.entries[key] = typeof value === 'object' ? toEntriesContextValue(value)
      : value;

    return result;
  }, { entries: {} });
}
