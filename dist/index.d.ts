import { LRParser, ContextTracker } from '@lezer/lr';

export const parser: LRParser;

export type ContextValue = VariableContext | any;

export function normalizeContextKey(
  string
) : string;

export class VariableContext {

  value: any;

  constructor(value: any);

  get(key: string): any;
  set(key: string, value: any): this;

  getKeys(): string[];

  merge(other: ContextValue) : VariableContext

  static isAtomic(value: any): boolean;

  static of(...values: ContextValue[]): VariableContext;
}

export function trackVariables(
  context?: ContextValue,
  Context?: typeof VariableContext
) : ContextTracker<any>;
