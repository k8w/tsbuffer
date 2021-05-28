import { SchemaType, TSBufferSchema, TypeReference } from "tsbuffer-schema";

/** @internal */
export class IdBlockUtil {
    static getPayloadLengthInfo(parsedSchema: Exclude<TSBufferSchema, TypeReference>): {
        lengthType: LengthType,
        needLengthPrefix?: boolean
    } {
        switch (parsedSchema.type) {
            case SchemaType.Boolean:
            case SchemaType.Enum:
                return { lengthType: LengthType.Varint };
            case SchemaType.Number:
                if (!parsedSchema.scalarType || parsedSchema.scalarType.includes('64') || parsedSchema.scalarType === 'double') {
                    return { lengthType: LengthType.Bit64 }
                }
                else if (parsedSchema.scalarType && parsedSchema.scalarType.startsWith('big')) {
                    return { lengthType: LengthType.LengthDelimited };
                }
                else {
                    return { lengthType: LengthType.Varint };
                }
            case SchemaType.Buffer:
            case SchemaType.String:
            case SchemaType.Any:
            case SchemaType.Object:
                return { lengthType: LengthType.LengthDelimited };
            case SchemaType.Interface:
            case SchemaType.Pick:
            case SchemaType.Partial:
            case SchemaType.Omit:
            case SchemaType.Union:
            case SchemaType.Intersection:
                return { lengthType: LengthType.IdBlock };
            case SchemaType.Array:
            case SchemaType.Overwrite:
            case SchemaType.Tuple:
                return {
                    lengthType: LengthType.LengthDelimited,
                    needLengthPrefix: true
                };
            case SchemaType.Literal:
                return {
                    lengthType: LengthType.LengthDelimited,
                    needLengthPrefix: false
                }
            case SchemaType.Date:
                return { lengthType: LengthType.Varint };
            default:
                throw new Error(`Unrecognized schema type: ${parsedSchema.type}`);
        }
    }
}

/** @internal */
export enum LengthType {
    LengthDelimited = 0,
    Varint = 1,
    Bit64 = 2,
    IdBlock = 3,
}