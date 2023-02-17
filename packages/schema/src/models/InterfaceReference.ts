import { PickTypeSchema } from '../schemas/PickTypeSchema';
import { PartialTypeSchema } from '../schemas/PartialTypeSchema';
import { OverwriteTypeSchema } from '../schemas/OverwriteTypeSchema';
import { OmitTypeSchema } from '../schemas/OmitTypeSchema';
import { TypeReference } from './TypeReference';

export type InterfaceReference =
  | TypeReference
  | PickTypeSchema
  | PartialTypeSchema
  | OverwriteTypeSchema
  | OmitTypeSchema;
