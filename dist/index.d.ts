import { LRParser, ContextTracker } from '@lezer/lr';

export const parser: LRParser;

export function trackVariables(
  context: Record<string, any>
) : ContextTracker<any>;

export function normalizeContextKey(
  string
) : string;

export class VariableContext {
  constructor(value?: any)

  getKeys(): Array<string>
  get(key: string): any
  set(key: string, value: any): VariableContext
  isAtomic(value: any): boolean

  static merge(...contexts: VariableContext[]): VariableContext
}
