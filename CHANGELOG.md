# Changelog

All notable changes to [lezer-feel](https://github.com/nikku/lezer-feel) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

___Note:__ Yet to be released changes appear here._

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