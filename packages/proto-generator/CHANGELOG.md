# CHANGELOG

## [1.7.2] - 2022-06-12
### Changed
- `resolveModule` changed to return absolute path

## [1.7.1] - 2022-04-28
### Added
- Support `unknown`, treated as `any` (Contributed by @seho)

## [1.7.0] - 2022-02-08
### Added
- Support `keyof`
- Support `Pick<XXX, keyof XXX>`
- Support `Pick<XXX, TypeReference>`
- Support `Pick<UnionType>` and `Pick<IntersectionType>`, the same to `Omit`
- Support `interface` extends Mapped Type, like `Pick` `Omit`
- Support reference enum value as literal type,like:
    ```ts
    export enum Types {
        Type1,
        Type2
    }
    export interface Obj {
        type: Types.Type1,
        value: string
    }
    ```

## [1.6.0] - 2021-12-18
### Added
- Add `keepRemark` option for generate proto.

## [1.5.0] - 2021-11-08
### Changed
- Update dependencies

## [1.4.9] - 2021-10-17
### Added
- Support change global reference by using `resolveModule` and `astCache` together.
- Add `customSchemaIds`.

## [1.4.8] - 2021-10-17
### Fixed
- `canOptimized` 检测阈值改为 32 和 4096，考虑到 ID 末 2 位的长度标识。

## [1.4.6] - 2021-10-05
### Added
- Add `options.logger`
- Optimize error log
- All `"` to `'`