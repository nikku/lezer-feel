import { ExternalTokenizer } from "@lezer/lr";

import {
  whitespace,
  dateTime as dateTimeToken,
  specialFunctionName as specialFunctionNameToken,
  specialType as specialTypeToken,
  specialParameterName as specialParameterNameToken
} from "./feel.grammar.terms";

// TODO(nikku): use actual spaces from feel, not JavaScript
const space = [
  9, 10, 11, 12, 13, 32, 133, 160, 5760,
  8192, 8193, 8194, 8195, 8196, 8197, 8198, 8199, 8200,
  8201, 8202, 8232, 8233, 8239, 8287, 12288
];

function debg(names, idx) {
  return names.map(
    name => name.map(char => String.fromCodePoint(char))
  ).map(n => [ ...n.slice(0, idx), '|', ...n.slice(idx) ].join(""));
}


/**
 * @typedef { import('@lezer/lr').InputStream } InputStream
 * @typedef { import('@lezer/lr').Stack } Stack
 */

export const dateTime = spacesTokenizer(dateTimeToken, [
  "duration",
  "time",
  "date",
  "date and time",
]);

export const specialParameterName = spacesTokenizer(specialParameterNameToken, [
  "start position",
  "decimal sep",
  "decimal separator",
  "grouping sep",
  "grouping separator"
]);

export const specialFunctionName = spacesTokenizer(specialFunctionNameToken, [
  "years and months duration",
  "string length",
  "upper case",
  "lower case",
  "substring before",
  "substring after",
  "starts with",
  "ends with",
  "list contains",
  "insert before",
  "index of",
  "distinct values",
  "met by",
  "overlaps before",
  "overlaps after",
  "finished by",
  "started by",
  "day of year",
  "day of week",
  "month of year",
  "week of year",
  "get value",
  "get entries"
]);

export const specialType = spacesTokenizer(specialTypeToken, [
  "days and time duration",
  "years and months duration",
  "date and time"
]);


function spacesTokenizer(token, names) {

  const codePoints = names.map(name => Array.from(name).map(char => char.codePointAt(0)));

  return new ExternalTokenizer(

    /**
     * @param {InputStream} input
     * @param {Stack} stack
     */
    (input, stack) => {
      if (!stack.canShift(token)) {
        return;
      }

      let acceptedNames = [];

      let matchingNames = codePoints.slice();

      let next = input.next;
      let idx = 0;
      let pos = 0;

      while ((matchingNames = matchingNames.filter(n => n[idx] === next)).length) {

        next = input.peek(++pos);

        // console.log(debg(matchingNames, idx));

        const endsSome = matchingNames.some(n => n.length === idx + 1);

        if (endsSome) {

          console.log('accept', pos + 1, debg(matchingNames, idx + 1));
          acceptedNames.push(pos);
        }

        while (space.includes(next)) {
          const potentialSpace = input.peek(pos + 1);

          if (!space.includes(potentialSpace)) {
            break;
          }

          next = potentialSpace;
          pos++;
        }

        idx++;
      }

      // we're done matching; now check what accepted names we got
      if (acceptedNames.length) {
        const pos = acceptedNames[acceptedNames.length - 1];

        input.acceptToken(token, pos);
      }
    },

    {
      contextual: true,
      fallback: true
    }
  );

}