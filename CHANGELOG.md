# Changelog

All notable changes to [lezer-feel](https://github.com/nikku/lezer-feel) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

___Note:__ Yet to be released changes appear here._

## 2.2.0

* `DEPS`: update to `@lezer/lr@1.4.7`
* `DEPS`: update to `min-dash@5.0.0`

## 2.1.0

* `CHORE`: improve performance with large contexts ([#73](https://github.com/nikku/lezer-feel/pull/73), [#70](https://github.com/nikku/lezer-feel/pull/70), [#59](https://github.com/nikku/lezer-feel/issues/59), [#67](https://github.com/nikku/lezer-feel/issues/67))

## 2.0.0

* `FEAT`: make pure ES module ([#66](https://github.com/nikku/lezer-feel/pull/66))
* `DEPS`: update to `@lezer/lr@1.4.4`
* `DEPS`: update to `@lezer/highlight@1.2.3`

### Breaking Changes

* Dropped CJS distribution. You need `Node >= 20.12.0` to import this module from CJS

## 1.9.0

* `FEAT`: support multi line strings in `camunda` dialect ([#56](https://github.com/nikku/lezer-feel/pull/56))
* `FIX`: allow line breaks in `camunda` backtick identifiers ([#57](https://github.com/nikku/lezer-feel/pull/57))
* `DEPS`: update to `min-dash@4.2.3`

## 1.8.1

_Revert of `v1.8.0`, as it broke custom contexts._

## 1.8.0

* `FEAT`: improve parsing speed with large contexts ([#54](https://github.com/nikku/lezer-feel/pull/54))
* `FEAT`: eagerly normalize context keys ([#54](https://github.com/nikku/lezer-feel/pull/54))

## 1.7.1

* `FIX`: require closing `"` on string literals ([#52](https://github.com/nikku/lezer-feel/pull/52))

## 1.7.0

* `FEAT`: attach `Expr` group to expression statements

## 1.6.0

* `FEAT`: support exponential notation for numbers ([#49](https://github.com/nikku/lezer-feel/pull/49))

## 1.5.0

* `FEAT`: allow `=` and `!=` as comparison operators ([#48](https://github.com/nikku/lezer-feel/pull/48))

## 1.4.0

* `FEAT`: deeply merge type contexts ([#19](https://github.com/nikku/lezer-feel/issues/19), [#41](https://github.com/nikku/lezer-feel/pull/41))
* `DEPS`: bump `lezer/*`

## 1.3.0

* `FEAT`: add `camunda` dialect
* `FEAT`: support backtick escaped variables in `camunda` dialect ([#36](https://github.com/nikku/lezer-feel/issues/36))

## 1.2.8

* `FIX`: re-introduce `types` field

## 1.2.7

* `FIX`: correct broken `main` export ([#33](https://github.com/nikku/lezer-feel/pull/33))
* `FIX`: correctly export `VariableContext` constructor type ([#33](https://github.com/nikku/lezer-feel/pull/33), [`2ba5471`](https://github.com/nikku/lezer-feel/pull/33/commits/2ba5471069b8357f48197b629f440d079f5c2f40))
* `FIX`: correct wildcard style definition ([#33](https://github.com/nikku/lezer-feel/pull/33), [`0f7e7e1`](https://github.com/nikku/lezer-feel/pull/33/commits/0f7e7e1c5d1a30ed4d0c1dd5d178e59743a5e034))
* `CHORE`: introduce `exports` declaration ([#33](https://github.com/nikku/lezer-feel/pull/33))

## 1.2.6

* `FIX`: correctly reduce `ContextEntry` without name ([#32](https://github.com/nikku/lezer-feel/pull/32))

## 1.2.5

* `FIX`: correctly parse `date and time` as a variable name ([#31](https://github.com/nikku/lezer-feel/pull/31))

## 1.2.4

* `FIX`: only parse valid name start chars

## 1.2.3

* `FIX`: correct nested list and interval parsing

## 1.2.2

* `FIX`: parse long, nested lists

## 1.2.1

* `FIX`: correct partial `QuantifiedExpression` parse ([#24](https://github.com/nikku/lezer-feel/issues/24))

## 1.2.0

_Re-publish of `v1.1.0`._

## 1.1.0

* `DEPS`: update `@lezer/*` dependencies

## 1.0.2

* `FIX`: correctly parse names with `**` ([#23](https://github.com/nikku/lezer-feel/issues/23))

## 1.0.1

* `FIX`: fail on empty expression

## 1.0.0

* `FEAT`: parse single `Expression`
* `FIX`: consistently parse expression split across multiple lines

### Breaking Changes

* Rather than parsing multiple expressions we strictly parse a single expression as mandated by the DMN FEEL spec.

## 0.17.1

* `FIX`: make `VariableContext#isAtomic` static ([#22](https://github.com/nikku/lezer-feel/pull/22))

## 0.17.0

* `FEAT`: add `VariableContext` abstraction ([#18](https://github.com/nikku/lezer-feel/pull/18))
* `FIX`: allow building on Windows ([#20), [#21](https://github.com/nikku/lezer-feel/pull/21))
* `DEPS`: bump `lezer*`

## 0.16.2

* `FIX`: correct context propagation in some cases ([#15](https://github.com/nikku/lezer-feel/issues/15))

## 0.16.1

* `FIX`: require `else` block ([#14](https://github.com/nikku/lezer-feel/issues/14))

## 0.16.0

* `FEAT`: deduce `List` shape from members ([`597ccb5b`](https://github.com/nikku/lezer-feel/commit/597ccb5b96ab20dbac455e940d6771af1b5d3010))

## 0.15.0

* `FEAT`: parse `Interval` endpoints as expressions ([#13](https://github.com/nikku/lezer-feel/pull/13))
* `FIX`: parse `PathExpression` inside `ParenthesizedExpression` ([#12](https://github.com/nikku/lezer-feel/issues/12))
* `FIX`: parse `PathExpression` inside `List` ([#11](https://github.com/nikku/lezer-feel/issues/11))

### Breaking Changes

* Recognize FEEL, not S-FEEL ([#13](https://github.com/nikku/lezer-feel/pull/13))

## 0.14.1

* `FEAT`: improve highlighting inside type definitions
* `FIX`: don't mark `VariableName` usage as `local` declarations

## 0.14.0

* `FIX`: correct highlight prop definitions ([#10](https://github.com/nikku/lezer-feel/issues/10))

## 0.13.1

* `FIX`: normalize variable name before lookup

## 0.13.0

* `FEAT`: track context across `get value` calls ([#9](https://github.com/nikku/lezer-feel/issues/9))

## 0.12.1

* `FIX`: restore `normalizeContextKey` export

## 0.12.0

* `FEAT`: simplify context normalizatin
* `FEAT`: preserve original context keys

### Breaking Changes

* `normalizeContext` and `normalizeContextKey` gone from public API (again)

## 0.11.4

* `CHORE`: mark as side-effect free

## 0.11.3

* `FIX`: correctly parse `PathExpression` inside `FunctionInvocation`

## 0.11.2

* `FIX`: correct nested multi-line parsing of keywords

## 0.11.1

* `FIX`: correct multi-line parsing of keywords

## 0.11.0

* `FEAT`: generate source maps
* `FIX`: correct type inference on empty lists

## 0.10.0

* `FIX`: correct handling of operator ambiguity
* `FIX`: define `VariableName` as `Identifier` sequence
* `CHORE`: improve logging
* `CHORE`: remove unnecessary conflict indicators

## 0.9.1

* `FIX`: correctly parse nested `date and time` ([#8](https://github.com/nikku/lezer-feel/issues/8))

## 0.9.0

* `FEAT`: support `AtLiteral` to define dates

## 0.8.9

* `FIX`: correct `namePart` parsing in `Name`

## 0.8.8

* `FIX`: parse unicode surrogate pairs (again)

## 0.8.7

* `FIX`: recognize all chars defined by FEEL
* `FIX`: correct `namePart` parsing

## 0.8.6

* `FIX`: don't normalize instances

## 0.8.5

* `FIX`: correctly normalize arrays

## 0.8.4

* `FIX`: make `normalizeContext` null safe

## 0.8.3

* `FIX`: disallow leading additional name symbols

## 0.8.2

* `FIX`: correct `null` handling

## 0.8.1

* `CHORE`: expose `normalizeContext`
* `FIX`: correctly normalize multiple spaces in contextual names

## 0.8.0

* `FEAT`: support context sensitive parsing ([#3](https://github.com/nikku/lezer-feel/issues/3))

### Breaking Changes

* Reworked `Name` vs. `VariableName` handling: `VariableName` now strictly refers to existing name access, while `Name` strictly refers to name definition

## 0.7.0

* `FEAT`: rename `InstanceOf` -> `InstanceOfExpression`
* `FEAT`: support names with spaces
* `FEAT`: insource highlighter props introduced with `v0.6.0`

### Breaking Changes

* `VariableName` and `Name` now expose identifier parts
* `SpecialKey` and `SpecialParameterName` removed in favor of `Name`
* `InstanceOf` renamed to `InstanceOfExpression`
* Highlight props now directly injected into node tree

## 0.6.0

* `FEAT`: add FEEL token highlighter

## 0.5.1

* `FIX`: correct types

## 0.5.0

* `DEPS`: bump to `lezer@1`

## 0.4.0

* `DEPS`: bump to `lezer@0.16`

## 0.3.0

* `FEAT`: distinguish static and dynamic names
* `FEAT`: assign expression and literal groups

## 0.2.0

* `FEAT`: simplify `DateTimeLiteral`

## 0.1.0

* `FEAT`: simplify `BooleanLiteral`
* `FEAT`: parse expression as `PathExpression` rather than `QualifiedName` ([`86d34d049`](https://github.com/nikku/lezer-feel/commit/86d34d049cbcdb2f39798450934aff74f96e9243))
* `CHORE`: introduce anonymous `identifier` token ([`86d34d04`](https://github.com/nikku/lezer-feel/commit/86d34d049cbcdb2f39798450934aff74f96e9243))
* `CHORE`: bump to `lezer@0.13`

## 0.0.3

* `FIX`: always return parameters

## 0.0.2

* `CHORE`: `@detectDelim`

## 0.0.1

_Initial release._