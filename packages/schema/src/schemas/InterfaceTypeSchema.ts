import { InterfaceReference } from '../models/InterfaceReference';
import { TSBufferSchema } from '../models/TSBufferSchema';

/**
 * TypeScript `interface`
 *
 * @remarks
 * See: {@link https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#interfaces}
 *
 * @example
 * ```ts
 * interface AAA {
 *     a: string,
 *     b?: number[],
 *     c: {
 *         value: boolean
 *     }
 * }
 *
 * // Index Signature
 * interface BBB {
 *     [key: string]: string;
 * }
 * ```
 */
export interface InterfaceTypeSchema {
  type: 'Interface';

  /** Extends which interface */
  extends?: {
    id: number;
    type: InterfaceReference;
  }[];

  /** Self properties (not include extended) */
  properties?: {
    id: number;
    name: string;
    /** 可选字段 */
    optional?: boolean;
    type: TSBufferSchema;
  }[];

  /**
   * Index Signature
   * `undefined` represents no index signature, i.e. excess property is not allowed.
   * \{ [key: string]: xxx \}
   */
  indexSignature?: {
    keyType: 'String' | 'Number';
    type: TSBufferSchema;
  };
}
