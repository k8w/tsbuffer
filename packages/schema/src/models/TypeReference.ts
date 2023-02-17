import { IndexedAccessTypeSchema } from '../schemas/IndexedAccessTypeSchema';
import { KeyofTypeSchema } from '../schemas/KeyofTypeSchema';
import { ReferenceTypeSchema } from '../schemas/ReferenceTypeSchema';

export type TypeReference =
  | ReferenceTypeSchema
  | IndexedAccessTypeSchema
  | KeyofTypeSchema;
