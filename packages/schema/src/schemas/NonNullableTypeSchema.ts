import { TSBufferSchema } from "../models/TSBufferSchema";

/** 
 * TypeScript `NonNullable<Type>`
 * 
 * @remarks
 * See: {@link https://www.typescriptlang.org/docs/handbook/utility-types.html#nonnullabletype}
 * 
 * @example
 * ```ts
 * type A = NonNullable<B>;
 * ```
 */
export interface NonNullableTypeSchema {
    type: 'NonNullable';
    /** 引用目标l */
    target: TSBufferSchema;
}