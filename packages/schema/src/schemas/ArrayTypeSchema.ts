import { TSBufferSchema } from "../models/TSBufferSchema";

/**
 * TypeScript `Array` type
 * 
 * @remarks 
 * See: {@link https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#arrays}
 * 
 * @example
 * ```ts
 * type A = string[];
 * type B = Array<A>;
 * ```
 */
export interface ArrayTypeSchema {
    type: 'Array';
    elementType: TSBufferSchema;
}