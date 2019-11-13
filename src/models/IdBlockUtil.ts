import { TSBufferSchema } from "tsbuffer-schema";
import { TypeReference } from "tsbuffer-schema/src/TypeReference";

export class IdBlockUtil {
    static getPayloadLengthInfo(parsedSchema: Exclude<TSBufferSchema, TypeReference>): {
        lengthType: LengthType,
        needLengthPrefix?: boolean
    } {
        switch (parsedSchema.type) {
            case 'Boolean':
            case 'Enum':
                return { lengthType: LengthType.Varint };
            case 'Number':
                if (parsedSchema.scalarType && parsedSchema.scalarType.includes('32') || parsedSchema.scalarType === 'float') {
                    return { lengthType: LengthType.Bit32 }
                }
                else if (!parsedSchema.scalarType || parsedSchema.scalarType.includes('64') || parsedSchema.scalarType === 'double') {
                    return { lengthType: LengthType.Bit64 }
                }
                else if (parsedSchema.scalarType && parsedSchema.scalarType.startsWith('big')) {
                    return { lengthType: LengthType.LengthDelimited };
                }
                else {
                    return { lengthType: LengthType.Varint };
                }
            case 'String':
            case 'Buffer':
            case 'Any':
            case 'NonPrimitive':
                return { lengthType: LengthType.LengthDelimited };
            case 'Array':
            case 'Interface':
            case 'Pick':
            case 'Partial':
            case 'Omit':
            case 'Overwrite':
            case 'Tuple':
            case 'Union':
            case 'Intersection':
                return {
                    lengthType: LengthType.LengthDelimited,
                    needLengthPrefix: true
                };
            case 'Literal':
                throw new Error('Literal should not be encoded');
            default:
                throw new Error(`Unrecognized schema type: ${(parsedSchema as any).type}`);
        }
    }
}

export enum LengthType {
    LengthDelimited = 0,
    Varint = 1,
    Bit32 = 2,
    Bit64 = 3,
}