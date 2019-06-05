import { TSBufferSchema } from 'tsbuffer-schema';
import { BufferWriter } from './BufferWriter';
import { NumberTypeSchema } from 'tsbuffer-schema/src/schemas/NumberTypeSchema';
import { LongBits } from '../models/LongBits';
import { TSBufferValidator } from 'tsbuffer-validator';
import { Config } from '../models/Config';
import { InterfaceTypeSchema } from 'tsbuffer-schema/src/schemas/InterfaceTypeSchema';
import { InterfaceReference } from 'tsbuffer-schema/src/InterfaceReference';
import { TypeReference } from 'tsbuffer-schema/src/TypeReference';

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
        this._write(value, schema);
        return this._writer.finish();
    }

    private _write(value: any, schema: TSBufferSchema) {
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
                    this._write(_v[i], schema.type === 'Array' ? schema.elementType : schema.elementTypes[i]);
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
                this._writeInterface(value, schema);
                break;
            case 'Buffer':
                this._writer.push({ type: 'buffer', value: value.buffer || value });
                break;
            case 'IndexedAccess':
            case 'Reference':
                this._write(value, this._validator.protoHelper.parseReference(schema))
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

    private _writeInterface(value: any, schema: InterfaceTypeSchema | InterfaceReference, skipFields: { [fieldName: string]: 1 } = {}) {
        // 记录起始op位置，用于最后插入BlockID数量
        let opStartOps = this._writer.ops.length;
        let blockIdCount = 0;

        let parsedSchema = this._validator.protoHelper.parseReference(schema) as Exclude<InterfaceTypeSchema | InterfaceReference, TypeReference>;
        switch (parsedSchema.type) {
            case 'Overwrite':
                this._writeOverwrite(value, schema, skipFields);
                return;
            case 'Pick':
            case 'Omit':
            case 'Partial':
                this._writeInterface(value, parsedSchema.target, skipFields);
                return;
        }

        // 以下，interface
        // extends
        if (parsedSchema.extends) {
            // 支持的继承数量有上限
            if (parsedSchema.extends.length > Config.interface.maxExtendsNum) {
                throw new Error(`Max support ${Config.interface.maxExtendsNum} extends, actual: ${parsedSchema.extends.length}`);
            }

            for (let extend of parsedSchema.extends) {
                // BlockID = extend.id + 1
                let blockId = extend.id + 1;
                this._writer.push({ type: 'varint', value: LongBits.from(blockId) });
                // extend Block
                this._writeInterface(value, extend.type, skipFields);

                ++blockIdCount;
            }
        }

        // property
        if (parsedSchema.properties) {
            for (let property of parsedSchema.properties) {
                // 只编码已定义的字段
                if (!(value as Object).hasOwnProperty(property.name)) {
                    continue;
                }

                // SkipFields
                if (skipFields[property.name]) {
                    continue;
                }
                skipFields[property.name] = 1;

                // undefined
                if (value[property.name] === undefined) {
                    continue;
                }

                let blockId = property.id + Config.interface.maxExtendsNum + 1;
                this._writer.push({ type: 'varint', value: LongBits.from(blockId) });
                this._write(value[property.name], property.type);

                ++blockIdCount;
            }
        }

        // indexSignature
        let flat = this._validator.protoHelper.getFlatInterfaceSchema(parsedSchema);
        if (flat.indexSignature) {
            for (let key in value) {
                if (value[key] === undefined) {
                    continue;
                }

                // SkipFields
                if (skipFields[key]) {
                    continue;
                }
                skipFields[key] = 1;

                // BlockID == 0
                this._writer.push({ type: 'varint', value: LongBits.from(0) });
                // 字段名
                this._writer.push({ type: 'string', value: key });
                // Value Payload
                this._write(value[key], flat.indexSignature.type);

                ++blockIdCount;
            }
        }

        this._writer.ops.splice(opStartOps, 0, this._writer.req2op({ type: 'varint', value: LongBits.from(blockIdCount) }));
    }

    private _writeOverwrite(value: any, schema: InterfaceTypeSchema | InterfaceReference, skipFields: { [fieldName: string]: 1 } = {}) {
        // TODO
    }

    // private _writeIdBlocks(blocks: { id: number, value: any }[]) {

    // }

}