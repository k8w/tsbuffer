import { InterfaceReference } from '../models/InterfaceReference';
import { InterfaceTypeSchema } from './InterfaceTypeSchema';
import { IntersectionTypeSchema } from './IntersectionTypeSchema';
import { UnionTypeSchema } from './UnionTypeSchema';

/**
 * TypeScript `Pick<Type>`
 * @remarks 
 * See: {@link https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys}
 */
export interface PickTypeSchema {
    type: 'Pick';
    target: InterfaceTypeSchema | InterfaceReference | UnionTypeSchema | IntersectionTypeSchema;
    keys: string[];
}