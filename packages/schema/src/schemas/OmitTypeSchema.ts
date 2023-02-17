import { InterfaceReference } from '../models/InterfaceReference';
import { InterfaceTypeSchema } from './InterfaceTypeSchema';
import { IntersectionTypeSchema } from './IntersectionTypeSchema';
import { UnionTypeSchema } from './UnionTypeSchema';

/** 
 * TypeScript `Omit` type,
 * represents omit some properties from a interface.
 * 
 * @remarks 
 * See: {@link https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys}
 * 
 * @example
 * ```ts
 * interface AAA {
 *     a: string,
 *     b: string,
 *     c: string
 * }
 * 
 * // Equivalent to `{ c: string }`
 * type BBB = Omit<AAA, 'a' | 'b'>;
 * ```
 */
export interface OmitTypeSchema {
    type: 'Omit';
    target: InterfaceTypeSchema | InterfaceReference | UnionTypeSchema | IntersectionTypeSchema;
    keys: string[];
}