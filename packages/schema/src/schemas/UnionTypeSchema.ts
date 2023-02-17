import { TSBufferSchema } from '../models/TSBufferSchema';

/**
 * TypeScript Union Types, like `A | B`
 *
 * @remarks
 * See: {@link https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types}
 *
 * @example
 * ```ts
 * type X1 = A | B;
 * type X2 = A | null | undefined;
 * type Gender = 'Male' | 'Female';
 * ```
 */
export interface UnionTypeSchema {
  type: 'Union';
  members: {
    // 对应条件MASK第几位
    id: number;
    type: TSBufferSchema;
  }[];
}
