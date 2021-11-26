# CHANGELOG

## [2.1.5] - 2021-11-26
### Fixed
- Remove unused code from `Base64Util`
- Update `Utf8CoderJs` (from [protobuf.js](https://github.com/protobufjs/protobuf.js/blob/master/lib/utf8/index.js))

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