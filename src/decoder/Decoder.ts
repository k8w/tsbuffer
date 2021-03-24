import { InterfaceTypeSchema, IntersectionTypeSchema, NumberTypeSchema, OmitTypeSchema, OverwriteTypeSchema, PartialTypeSchema, PickTypeSchema, TSBufferSchema, TypeReference, UnionTypeSchema } from "tsbuffer-schema";
import { TSBufferValidator } from "tsbuffer-validator";
import { IdBlockUtil, LengthType } from '../models/IdBlockUtil';
import { Utf8Coder } from "../models/Utf8Util";
import { Varint64 } from '../models/Varint64';
import { TSBufferOptions } from '../TSBuffer';
import { TypedArrays } from '../TypedArrays';
import { BufferReader } from './BufferReader';

export interface DecoderOptions {
    /**
     * 自定义 UTF8 编解码器
     * 默认使用内置JS方法
     * 在 NodeJS 下可传入 Node 提供的 Native 方法以提升性能
     */
    utf8: Utf8Coder;

    /**
     * Can treat `undefined` as `null`
     * 例如对 `type A = string | null`, 值 `undefined` 可被兼容解码为 `null`
     */
    undefinedAsNull?: boolean;
}

export class Decoder {

    private _reader: BufferReader;
    protected _validator: TSBufferValidator;

    constructor(validator: TSBufferValidator, utf8: TSBufferOptions['utf8']) {
        this._reader = new BufferReader(utf8);
        this._validator = validator;
    }

    decode(buffer: Uint8Array, schema: TSBufferSchema): unknown {
        this._reader.load(buffer);
        return this._read(schema);
    }

    private _read(schema: TSBufferSchema): unknown {
        switch (schema.type) {
            case 'Boolean':
                return this._reader.readBoolean();
            case 'Number':
                return this._readNumber(schema);
            case 'String':
                return this._reader.readString();
            case 'Array': {
                let output: any[] = [];
                // 数组长度：Varint
                let length = this._reader.readUint();
                for (let i = 0; i < length; ++i) {
                    let item = this._read(schema.elementType);
                    output.push(item);
                }
                return output;
            }
            case 'Tuple': {
                if (schema.elementTypes.length > 64) {
                    throw new Error('Elements oversized, maximum supported tuple elements is 64, now get ' + schema.elementTypes.length)
                }

                let output: any[] = [];
                // PayloadMask: Varint64
                let payloadMask: Varint64 = this._reader.readVarint();
                // 计算maskIndices
                let maskIndices: number[] = [];
                // Low
                for (let i = 0; i < 32; ++i) {
                    if (payloadMask.uint32s[1] & 1 << i) {
                        maskIndices.push(i);
                    }
                }
                // High
                for (let i = 0; i < 32; ++i) {
                    if (payloadMask.uint32s[0] & 1 << i) {
                        maskIndices.push(i + 32);
                    }
                }

                if (!maskIndices.length) {
                    return [];
                }

                let maxIndex = maskIndices.last();
                for (let i = 0, nextMaskIndex = 0, next = maskIndices[0]; i <= maxIndex; ++i) {
                    if (i === next) {
                        output[i] = this._read(schema.elementTypes[i]);
                        ++nextMaskIndex;
                        next = maskIndices[nextMaskIndex];
                    }
                    else {
                        output[i] = undefined;
                    }
                }

                return output;
            }
            case 'Enum':
                let enumId = this._reader.readVarint().toNumber();
                let enumItem = schema.members.find(v => v.id === enumId);
                if (!enumItem) {
                    throw new Error(`Invalid enum encoding: unexpected id ${enumId}`);
                }
                return enumItem.value;
            case 'Any':
            case 'NonPrimitive':
                let jsonStr = this._reader.readString();
                if (jsonStr === 'undefined') {
                    return undefined;
                }
                return JSON.parse(jsonStr);
            case 'Literal':
                return schema.literal;
            case 'Interface':
                return this._readInterface(schema);
            case 'Buffer':
                let uint8Arr = this._reader.readBuffer();
                if (schema.arrayType) {
                    if (schema.arrayType === 'BigInt64Array' || schema.arrayType === 'BigUint64Array') {
                        throw new Error('Unsupported arrayType: ' + schema.arrayType);
                    }
                    // Uint8Array 性能最高
                    else if (schema.arrayType === 'Uint8Array') {
                        return uint8Arr;
                    }
                    // 其余TypedArray 可能需要内存拷贝 性能次之
                    else {
                        let typedArr = TypedArrays[schema.arrayType];
                        // 字节对齐，可以直接转，无需拷贝内存
                        if (uint8Arr.byteOffset % typedArr.BYTES_PER_ELEMENT === 0) {
                            return new typedArr(uint8Arr.buffer, uint8Arr.byteOffset, uint8Arr.byteLength / typedArr.BYTES_PER_ELEMENT);
                        }
                        // 字节不对齐，不能直接转，只能拷贝内存后再生成
                        else {
                            let arrBuf = uint8Arr.buffer.slice(uint8Arr.byteOffset, uint8Arr.byteOffset + uint8Arr.byteLength);
                            return new typedArr(arrBuf);
                        }
                    }
                }
                else {
                    // ArrayBuffer涉及内存拷贝，性能较低，不建议用
                    return uint8Arr.buffer.slice(uint8Arr.byteOffset, uint8Arr.byteOffset + uint8Arr.byteLength);
                }
            case 'IndexedAccess':
            case 'Reference':
                return this._read(this._validator.protoHelper.parseReference(schema));
            case 'Partial':
            case 'Pick':
            case 'Omit':
            case 'Overwrite':
                let parsed = this._validator.protoHelper.parseMappedType(schema);
                if (parsed.type === 'Interface') {
                    return this._readPureMappedType(schema);
                }
                else if (parsed.type === 'Union') {
                    return this._readUnionOrIntersection(parsed);
                }
                break;
            case 'Union':
            case 'Intersection':
                return this._readUnionOrIntersection(schema);
            default:
                throw new Error(`Unrecognized schema type: ${(schema as any).type}`);
        }
    }

    /** 
     * PureMappedType 每一层的target 都是MappedType或Interface（最终层）
     */
    private _readPureMappedType(schema: PickTypeSchema | OmitTypeSchema | PartialTypeSchema | OverwriteTypeSchema) {
        let output: any;

        let overwrite: object | undefined;
        if (schema.type === 'Overwrite') {
            // Overwrite Block
            overwrite = this._read(schema.overwrite) as object;
        }

        let parsedTarget = this._validator.protoHelper.parseReference(schema.target);
        if (parsedTarget.type === 'Interface') {
            output = this._readInterface(parsedTarget);
        }
        else if (parsedTarget.type === 'Pick' || parsedTarget.type === 'Omit' || parsedTarget.type === 'Partial' || parsedTarget.type === 'Overwrite') {
            output = this._readPureMappedType(parsedTarget)
        }
        else {
            throw new Error('Invalid PureMappedType child: ' + schema.type);
        }

        // filter key
        if (schema.type === 'Pick') {
            // 把Pick以外的剔除
            for (let key in output) {
                if (schema.keys.indexOf(key) === -1) {
                    delete output[key];
                }
            }
        }
        else if (schema.type === 'Omit') {
            // 剔除Omit
            for (let key in output) {
                if (schema.keys.indexOf(key) > -1) {
                    delete output[key];
                }
            }
        }
        else if (schema.type === 'Overwrite') {
            Object.assign(output, overwrite);
        }
        // Partial 原样返回

        return output;
    }

    private _readNumber(schema: NumberTypeSchema): number {
        // 默认为double
        let scalarType = schema.scalarType || 'double';

        switch (scalarType) {
            // 定长编码
            case 'double':
                return this._reader.readDouble();
            // Varint编码
            case 'int':
                return this._reader.readInt();
            case 'uint':
                return this._reader.readUint();
            default:
                throw new Error('Scalar type not support : ' + scalarType)
        }
    }

    private _readInterface(schema: InterfaceTypeSchema): unknown {
        let output: any = {};
        let flatSchema = this._validator.protoHelper.getFlatInterfaceSchema(schema);

        // BlockID数量
        let blockIdNum = this._reader.readUint();
        for (let i = 0; i < blockIdNum; ++i) {
            // ReadBlock
            let readBlockId = this._reader.readUint();
            let lengthType: LengthType = readBlockId & 3;
            let blockId = readBlockId >> 2;

            // indexSignature
            if (blockId === 0) {
                if (flatSchema.indexSignature) {
                    let type = flatSchema.indexSignature.type;
                    let fieldName = this._reader.readString();
                    this._skipIdLengthPrefix(this._validator.protoHelper.parseReference(type));
                    output[fieldName] = this._read(type);
                }
                // indexSignature未定义，可能是新协议，此处兼容，根据lengthType跳过
                else {
                    // skip fieldName
                    this._reader.skipByLengthType(LengthType.LengthDelimited);
                    // skipPayload
                    this._reader.skipByLengthType(lengthType);
                }

            }
            // extend block
            else if (blockId <= 9) {
                let extendId = blockId - 1;
                let extend = schema.extends && schema.extends.find(v => v.id === extendId);
                if (extend) {
                    this._skipIdLengthPrefix(this._validator.protoHelper.parseReference(extend.type));
                    let extendValue = this._read(extend.type);
                    Object.assign(output, extendValue);
                }
                // 未知的extendId 可能是新协议 跳过
                else {
                    // skipPayload
                    this._reader.skipByLengthType(lengthType);
                }
            }
            // property
            else {
                let propertyId = blockId - 10;
                let property = schema.properties && schema.properties.find(v => v.id === propertyId);
                if (property) {
                    this._skipIdLengthPrefix(this._validator.protoHelper.parseReference(property.type));
                    output[property.name] = this._read(property.type);
                }
                // 未知的PropertyID 可能是新协议 跳过
                else {
                    // skipPayload
                    this._reader.skipByLengthType(lengthType);
                }
            }
        }

        // Literal property 由于不编码 将其补回
        for (let property of flatSchema.properties) {
            if (output.hasOwnProperty(property.name)) {
                continue;
            }
            let parsedType = this._validator.protoHelper.parseReference(property.type);
            if (parsedType.type === 'Literal') {
                output[property.name] = parsedType.literal;
            }
        }

        return output;
    }

    private _skipIdLengthPrefix(parsedSchema: Exclude<TSBufferSchema, TypeReference>) {
        let lengthInfo = IdBlockUtil.getPayloadLengthInfo(parsedSchema);
        if (lengthInfo.needLengthPrefix) {
            // skip length prefix
            this._reader.skipByLengthType(LengthType.Varint);
        }
    }

    private _readUnionOrIntersection(schema: UnionTypeSchema | IntersectionTypeSchema): unknown {
        let output: any;

        let idNum = this._reader.readUint();
        for (let i = 0; i < idNum; ++i) {
            let readId = this._reader.readUint();
            let lengthType: LengthType = readId & 3;
            let id = readId >> 2;

            let member = schema.members.find(v => v.id === id);
            // 不可识别的Member，可能是新协议，跳过使兼容
            if (!member) {
                this._reader.skipByLengthType(lengthType);
                continue;
            }

            this._skipIdLengthPrefix(this._validator.protoHelper.parseReference(member.type));
            let value = this._read(member.type);
            if (this._isObject(output) && this._isObject(value)) {
                Object.assign(output, value);
            }
            else {
                output = value;
            }
        }

        return output;
    }

    private _isObject(value: any): boolean {
        return typeof (value) === 'object' && value !== null;
    }

}