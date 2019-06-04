import { TSBufferSchema, TSBufferProto } from 'tsbuffer-schema';
import { BufferWriter } from './BufferWriter';
import { NumberTypeSchema } from 'tsbuffer-schema/src/schemas/NumberTypeSchema';
import { LongBits } from '../models/LongBits';
import { TSBufferValidator } from 'tsbuffer-validator';

export interface EncodeOperationItem {
    length: number,
    encode: () => {}
}

export class Encoder {

    protected _writer: BufferWriter;
    protected _validator: TSBufferValidator;

    constructor(validator: TSBufferValidator) {
        this._writer = new BufferWriter;
        this._validator = validator;
    }

    encode(value: any, schema: TSBufferSchema): Uint8Array {
        this._writer.clear();
        this._addWriteOp(value, schema);
        return this._writer.finish();
    }

    private _addWriteOp(value: any, schema: TSBufferSchema) {
        switch (schema.type) {
            case 'Boolean':
                this._writer.push({ type: 'boolean', value: value });
                break;
            case 'Number':
                this._writeNumber(value, schema);
                break;
            case 'String':
                this._writer.push({ type: 'string', value: value });
                break;
            case 'Array':
            case 'Tuple':
                let _v = value as any[];
                // 数组长度：Varint
                this._writer.push({ type: 'varint', value: LongBits.from(_v.length) });
                // Element Payload
                for (let i = 0; i < _v.length; ++i) {
                    this._addWriteOp(_v[i], schema.type === 'Array' ? schema.elementType : schema.elementTypes[i]);
                }
                break;
            case 'Enum':
                this._writer.push({ type: 'varint', value: LongBits.from(value) });
                break;
            case 'Any':
            case 'NonPrimitive':
                this._writer.push({ type: 'string', value: JSON.stringify(value) });
                break;
            case 'Literal':
                break;
            case 'Interface':
                // extends
                // property
                // indexSignature
                break;
            case 'Buffer':
                this._writer.push({ type: 'buffer', value: value.buffer || value });
                break;
            case 'IndexedAccess':
            case 'Reference':
                this._addWriteOp(value, this._validator.protoHelper.parseReference(schema))
                break;
            // case 'Union':
            // case 'Intersection':
            // case 'Pick':
            // case 'Partial':
            // case 'Omit':
            // case 'Overwrite':
            // default:
            //     throw new Error(`Unrecognized schema type: ${(schema as any).type}`);
        }
    }

    private _writeNumber(value: any, schema: NumberTypeSchema) {
        // 默认为double
        let scalarType = schema.scalarType || 'double';

        switch (scalarType) {
            // 定长编码
            case 'int32':
            case 'uint32':
            case 'float':
            case 'double':
                this._writer.push({ type: scalarType, value: value });
                break;
            // Varint编码
            case 'int':
            case 'uint':
                this._writer.push({ type: 'varint', value: LongBits.from(value) });
                break;
            // TODO: BigInt
            default:
                throw new Error('Scalar type not support : ' + scalarType)
        }
    }

    private _writeIdBlocks(blocks: { id: number, value: any }[]) {

    }

}