import { InterfaceReference } from '../models/InterfaceReference';
import { InterfaceTypeSchema } from './InterfaceTypeSchema';
import { IntersectionTypeSchema } from './IntersectionTypeSchema';
import { UnionTypeSchema } from './UnionTypeSchema';

/**
 * TypeScript `Partial<Type>`
 *
 * @remarks
 * See: {@link https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype}
 */
export interface PartialTypeSchema {
  type: 'Partial';
  target:
    | InterfaceTypeSchema
    | InterfaceReference
    | UnionTypeSchema
    | IntersectionTypeSchema;
}
