import {
  VariableContext
} from 'lezer-feel';


/**
 * @typedef { { entries?: Record<string, any>, [key: string]: any } } EntriesContextValue
 */

/**
 * An alternative context that holds additional meta-data
 */
export class EntriesContext extends VariableContext {

  /**
   * @param {EntriesContextValue} value
   */
  constructor(value = { entries: {} }) {
    super(value);

    this.value.entries = this.value.entries || {};
    for (const key in this.value.entries) {
      const entry = this.value.entries[key];

      const constructor = /** @type { typeof EntriesContext } */ (this.constructor);

      if (!constructor.isAtomic(entry)) {
        this.value.entries[key] = constructor.of(this.value.entries[key]);
      }
    }
  }

  getKeys() {
    return Object.keys(this.value.entries);
  }

  get(key) {
    return this.value.entries[key];
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

    return {
      ...context
    };
  }

  /**
   * @param { EntriesContextValue } context
   * @param { EntriesContextValue} other
   *
   * @return { EntriesContextValue }
   */
  static __merge(context, other) {

    const {
      entries: contextEntries = {},
      ...contextRest
    } = this.__unwrap(context);

    const {
      entries: otherEntries = {},
      ...otherRest
    } = this.__unwrap(other);

    // @ts-ignore "access to internals"
    const mergedEntries = super.__merge(contextEntries, otherEntries);

    return {
      ...contextRest,
      ...otherRest,
      entries: mergedEntries
    };
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