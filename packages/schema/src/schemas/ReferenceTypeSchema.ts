
/**
 * Type Reference, infers that this type should be equivalent to target type.
 * 
 * @remarks
 * If target type is in a namespace, the schema should be like below.
 * 
 * Type:
 * ```ts
 * import { SomeNS } from './some-ns';
 * type Reference = SomeNS.Target;
 * ```
 * 
 * Schema:
 * ```json
 * {
 *     type: "Reference",
 *     target: "./some-ns/SomeNS.Target"
 * }
 * ```
 * 
 * When parsing a type reference, if `target` includes point, namespace would be parsed by `target.split('.')`.
 * If `target` doesn't include point, it would be treated as a type name.
 */
export interface ReferenceTypeSchema {
    type: 'Reference';

    /** SchemaID of reference target */
    target: string;
}