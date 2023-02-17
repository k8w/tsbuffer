
/**
 * TypeScript `object` type
 * 
 * Represents anything that is not `number`, `string`, `boolean`, `bigint`, `symbol`, `null`, or `undefined`.
 * 
 * @remarks
 * See: {@link https://www.typescriptlang.org/docs/handbook/basic-types.html#object}
 * 
 * NOTICE: Both `Object` and `Array` is valid.
 * 
 * @example
 * ```ts
 * let a: object;
 * ```
 * 
 */
export interface ObjectTypeSchema {
    type: 'Object';
}