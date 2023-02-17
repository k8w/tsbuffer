import { TSBufferSchema } from '../models/TSBufferSchema';

/**
 * TypeScript `Tuple` type
 *
 * @remarks
 * It has less encoded size than `Array`.
 *
 * See: {@link https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types}
 */
export interface TupleTypeSchema {
  type: 'Tuple';
  elementTypes: TSBufferSchema[];
  optionalStartIndex?: number;
}
