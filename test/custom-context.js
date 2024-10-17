import { VariableContext } from 'lezer-feel';


/**
 * An alternative context that holds additional meta-data
 */
export class EntriesContext extends VariableContext {

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

  static of(...contexts) {
    const unwrap = (context) => {
      if (this.isAtomic(context)) {
        return context instanceof this ?
          context.value :
          { atomicValue: context };
      }

      return { ...context };
    };

    const merged = contexts.reduce((merged, context) => {

      const {
        entries = {},
        ...rest
      } = unwrap(context);

      return {
        ...merged,
        ...rest,
        entries: {
          ...merged.entries,
          ...entries
        }
      };
    }, {});

    return new this(merged);
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