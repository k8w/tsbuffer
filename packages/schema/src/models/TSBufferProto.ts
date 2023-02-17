import { TSBufferSchema } from "./TSBufferSchema";

/**
 * Collection of a group of `TSBufferSchema`
 */
export interface TSBufferProto {
    /**
     * [schemaId: string]: `{relativePath}/{namespace}/{typeName}`.
     * `path` is relative path to `baseDir`, without extension name.
     * 
     * @example
     * a/b/c/index.ts:
     * ```ts
     * export interface Test {
     *     a: string;
     * }
     * ```
     * schemaId for `Test` is `a/b/c/index/Test`
     * 
     * a/b/c/index.ts (with namespace)
     * ```ts
     * export namespace NS {
     *     export interface Test {
     *         value: string;
     *     }
     * }
     * ```
     * schemaId for `NS.Test` is `a/b/c/index/NS/Test`
     */
    [schemaId: string]: TSBufferSchema;
}