# Changelog

All notable changes to [lezer-feel](https://github.com/nikku/lezer-feel) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

___Note:__ Yet to be released changes appear here._

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