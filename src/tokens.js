import {
  insertSemi,
  additionalIdentifier
} from './parser.terms.js';

import {
  ExternalTokenizer
} from '@lezer/lr';

const space = [
  9, 11, 12, 32, 133, 160,
  5760, 8192, 8193, 8194, 8195, 8196, 8197, 8198,
  8199, 8200, 8201, 8202, 8232, 8233, 8239, 8287, 12288
];

const newline = [
  10, 13
];

export const insertSemicolon = new ExternalTokenizer((input, stack) => {

  if (!stack.canShift(additionalIdentifier)) {
    return;
  }

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