import { LRParser, ContextTracker } from '@lezer/lr';

export const parser: LRParser;

export function trackVariables(
  context: Record<string, any>
) : ContextTracker<any>;

export function normalizeContextKey(
  string
) : string;
