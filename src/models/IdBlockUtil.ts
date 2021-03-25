import { TSBufferSchema, TypeReference } from "tsbuffer-schema";

/** @internal */
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
                if (!parsedSchema.scalarType || parsedSchema.scalarType.includes('64') || parsedSchema.scalarType === 'double') {
                    return { lengthType: LengthType.Bit64 }
                }
                else if (parsedSchema.scalarType && parsedSchema.scalarType.startsWith('big')) {
                    return { lengthType: LengthType.LengthDelimited };
                }
                else {
                    return { lengthType: LengthType.Varint };
                }            
            case 'Buffer':
            case 'String':
            case 'Any':
            case 'NonPrimitive':
                return { lengthType: LengthType.LengthDelimited };
            case 'Interface':
            case 'Pick':
            case 'Partial':
            case 'Omit':
            case 'Union':
            case 'Intersection':
                return { lengthType: LengthType.IdBlock };
            case 'Array':            
            case 'Overwrite':
            case 'Tuple':            
                return {
                    lengthType: LengthType.LengthDelimited,
                    needLengthPrefix: true
                };
            case 'Literal':
                return {
                    lengthType: LengthType.LengthDelimited,
                    needLengthPrefix: false
                }
            default:
                throw new Error(`Unrecognized schema type: ${(parsedSchema as any).type}`);
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