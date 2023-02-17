import { TSBufferSchema } from '../models/TSBufferSchema';

/**
 * TypeScript intersection type, like `A & B`
 *
 * @remarks
 * See: {@link https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types}
 *
 * @example
 * ```ts
 * type X1 = A & B;
 * type X2 = A & (B | C);
 * ```
 */
export interface IntersectionTypeSchema {
  type: 'Intersection';
  members: {
    /** Encoding identifier, generated according to the order */
    id: number;
    type: TSBufferSchema;
  }[];
}
