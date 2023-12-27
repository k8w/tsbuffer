# CHANGELOG

## [2.2.8] - 2022-12-28
### Fixed
- Update dependencies

## [2.2.7] - 2022-11-17
### Fixed
- Infinite loop when using `encodeJSON` if there are circular reference in types.

## [2.2.6] - 2022-10-19
### Fixed
- Missing `errMsg` on `decodeJSON`

## [2.2.5] - 2022-10-07
### Added
- Add `errPhase` to return type of `decode` method

## [2.2.4] - 2022-09-25
### Fixed
- Support validate `keyof` types (by [@774653363](https://github.com/774653363)) 

## [2.2.3] - 2022-06-01
### Fixed
- Fixed encode error when union type members has optional property

## [2.2.2] - 2022-04-12
### Fixed
- `NonNullable` cannot be encoded and decoded when as a property in interface

## [2.2.0] - 2022-02-26
### Added
- Support `keyof`
- Support using type alias in `Pick` and `Omit`
- Support `Pick<Intersection>` and `Omit<Intersection>`

## [2.1.7] - 2022-01-06
### Fixed
- `cjs` to `js` to fix `react-scripts@5`

## [2.1.5] - 2021-11-26
### Fixed
- Remove unused code from `Base64Util` (Thanks [@JasonZhou](https://github.com/zzyss86))
- Update `Utf8CoderJs` from latest [protobuf.js](https://github.com/protobufjs/protobuf.js/blob/master/lib/utf8/index.js) (Thanks [@JasonZhou](https://github.com/zzyss86))

## [2.1.4] - 2021-11-17
### Fixed
- `encodeJSON` would convert `Date` to `string`

## [2.1.2] - 2021-11-15
### Fixed
- Fixed bug that `encodeJSON` not transform `ObjectId` to `string`

## [2.1.0] - 2021-11-04
### Added
- Add `encodeJSON` and `decodeJSON`
### Changed
- Default option of `strictNullChecks` changed to `false`


## [2.0.5] - 2021-10-17
- `CustomTypeSchema` supports
- `customTypes` support for constructor options of `TSBuffer`

## [1.2.0] - 2019-11-15
### Added
- IDBlock: 2Bit LengthType