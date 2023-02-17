# CHANGELOG

## [2.1.1] - 2022-09-25
### Fixed
- Support validate `keyof` types (by [@774653363](https://github.com/774653363)) 

## [2.1.0] - 2022-02-26
### Added
- Support new `KeyofTypeSchema`, support type alias and using `keyof` in `Pick` and `Omit`
- Support `Pick<Intersection>` and `Omit<Intersection>`
- Support `interface` extends Mapped Type, like `Pick` `Omit`

## [2.0.8] - 2022-01-06
### Fixed
- `cjs` to `js` to fix `react-scripts@5`

## [2.0.7] - 2021-11-08
### Changed
- Default option of `strictNullChecks` changed to `false`
### Fixed
- `null` and `undefined` is convertable when `prune`

## [2.0.6] - 2021-11-04
- Update dependencies
## [2.0.5] - 2021-10-17
### Added
- `CustomTypeSchema` support