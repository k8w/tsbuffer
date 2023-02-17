import { AnyTypeSchema } from "../schemas/AnyTypeSchema";
import { ArrayTypeSchema } from "../schemas/ArrayTypeSchema";
import { BooleanTypeSchema } from "../schemas/BooleanTypeSchema";
import { BufferTypeSchema } from "../schemas/BufferTypeSchema";
import { CustomTypeSchema } from "../schemas/CustomTypeSchema";
import { DateTypeSchema } from "../schemas/DateTypeSchema";
import { EnumTypeSchema } from "../schemas/EnumTypeSchema";
import { IndexedAccessTypeSchema } from "../schemas/IndexedAccessTypeSchema";
import { InterfaceTypeSchema } from "../schemas/InterfaceTypeSchema";
import { IntersectionTypeSchema } from "../schemas/IntersectionTypeSchema";
import { KeyofTypeSchema } from "../schemas/KeyofTypeSchema";
import { LiteralTypeSchema } from "../schemas/LiteralTypeSchema";
import { NonNullableTypeSchema } from "../schemas/NonNullableTypeSchema";
import { NumberTypeSchema } from "../schemas/NumberTypeSchema";
import { ObjectTypeSchema } from "../schemas/ObjectTypeSchema";
import { OmitTypeSchema } from "../schemas/OmitTypeSchema";
import { OverwriteTypeSchema } from "../schemas/OverwriteTypeSchema";
import { PartialTypeSchema } from "../schemas/PartialTypeSchema";
import { PickTypeSchema } from "../schemas/PickTypeSchema";
import { ReferenceTypeSchema } from "../schemas/ReferenceTypeSchema";
import { StringTypeSchema } from "../schemas/StringTypeSchema";
import { TupleTypeSchema } from "../schemas/TupleTypeSchema";
import { UnionTypeSchema } from "../schemas/UnionTypeSchema";

/**
 * Schema for TypeScript Types
 */
export type TSBufferSchema = (BooleanTypeSchema
	| NumberTypeSchema
	| StringTypeSchema
	| ArrayTypeSchema
	| TupleTypeSchema
	| EnumTypeSchema
	| AnyTypeSchema
	| LiteralTypeSchema
	| ObjectTypeSchema
	| InterfaceTypeSchema
	| BufferTypeSchema
	| IndexedAccessTypeSchema
	| ReferenceTypeSchema
	| KeyofTypeSchema
	| UnionTypeSchema
	| IntersectionTypeSchema
	| PickTypeSchema
	| PartialTypeSchema
	| OmitTypeSchema
	| OverwriteTypeSchema
	| NonNullableTypeSchema
	| DateTypeSchema
	| CustomTypeSchema)
	& { comment?: string };