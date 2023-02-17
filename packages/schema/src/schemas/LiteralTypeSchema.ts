/**
 * TypeScript literal type
 *
 * @remarks
 * See: {@link https://www.typescriptlang.org/docs/handbook/literal-types.html}
 *
 * Literal type is very useful to reduce encoded buffer size.
 * No matter how long the literal is, the encoded buffer is always less than 1 byte.
 *
 * @example
 * ```ts
 * type A = 'XXXX';
 *
 * // Always appears with UnionType, like:
 * type Gender = 'Male' | 'Female';
 * ```
 */
export interface LiteralTypeSchema {
  type: 'Literal';
  // 未定义等同于undefined
  literal?: string | number | boolean | null | undefined;
}
