import { BufferTypeSchema, InterfaceTypeSchema, IntersectionTypeSchema, NumberTypeSchema, OmitTypeSchema, OverwriteTypeSchema, PartialTypeSchema, PickTypeSchema, SchemaType, TSBufferSchema, TypeReference, UnionTypeSchema } from "tsbuffer-schema";
import { TSBufferValidator } from "tsbuffer-validator";
import { Base64Util } from "../models/Base64Util";
import { CoderUtil } from "../models/CoderUtil";
import { IdBlockUtil, LengthType } from '../models/IdBlockUtil';
import { SchemaUtil } from "../models/SchemaUtil";
import { TypedArrays } from '../models/TypedArrays';
import { Varint64 } from '../models/Varint64';
import { BufferReader } from './BufferReader';

/** @internal */
export interface DecoderOptions {
    validator: TSBufferValidator;

    /**
     * 如对于类型 `string | null`，当值为 `undefined` 时，是否自动将值解码时转换为 `null`
     */
    undefinedAsNull?: boolean;
}

/** @internal */
export class Decoder {

    private _reader: BufferReader;
    protected _validator: TSBufferValidator;
    private _options: DecoderOptions;

    constructor(options: DecoderOptions) {
        this._options = options;
        this._reader = new BufferReader();
        this._validator = options.validator;
    }

    decode(buffer: Uint8Array, schema: TSBufferSchema): unknown {
        this._reader.load(buffer);
        return this._read(schema);
    }

    decodeJSON(json: any, schema: TSBufferSchema): any {
        if (json === null || CoderUtil.isJsonCompatible(schema, 'decode', this._validator.protoHelper)) {
            return json;
        }

        // 递归 只处理 ArrayBuffer、Date、ObjectId
        switch (schema.type) {
            case SchemaType.Array:
                if (!Array.isArray(json)) {
                    break;
                }
                return (json as any[]).map(v => this.decodeJSON(v, schema.elementType));
            case SchemaType.Tuple:
                if (!Array.isArray(json)) {
                    break;
                }
                return (json as any[]).map((v, i) => this.decodeJSON(v, schema.elementTypes[i]));
            case SchemaType.Interface:
                if (json.constructor !== Object) {
                    break;
                }
                json = Object.assign({}, json);
                let flatSchema = this._validator.protoHelper.getFlatInterfaceSchema(schema);
                for (let key in json) {
                    let property = flatSchema.properties.find(v => v.name === key);
                    if (property) {
                        json[key] = this.decodeJSON(json[key], property.type)
                    }
                    else if (flatSchema.indexSignature) {
                        json[key] = this.decodeJSON(json[key], flatSchema.indexSignature.type);
                    }
                }
                return json;
            case SchemaType.Date:
                if (typeof json !== 'string' && typeof json !== 'number') {
                    break;
                }
                return new Date(json);
            case SchemaType.Partial:
            case SchemaType.Pick:
            case SchemaType.Omit:
            case SchemaType.Overwrite:
                let parsed = this._validator.protoHelper.parseMappedType(schema);
                return this.decodeJSON(json, parsed);
            case SchemaType.Buffer:
                if (typeof json !== 'string') {
                    break;
                }
                let uint8Arr = Base64Util.base64ToBuffer(json);
                return this._getBufferValue(uint8Arr, schema);
            case SchemaType.IndexedAccess:
            case SchemaType.Reference:
                return this.decodeJSON(json, this._validator.protoHelper.parseReference(schema));
            case SchemaType.Union:
            case SchemaType.Intersection: {
                // 逐个编码 然后合并 （失败的会原值返回，所以不影响结果）
                for (let member of schema.members) {
                    json = this.decodeJSON(json, member.type);
                }
                return json;
            }
            case SchemaType.NonNullable:
                return this.decodeJSON(json, schema.target);
            case SchemaType.Custom:
                if (schema.decodeJSON) {
                    return schema.decodeJSON(json);
                }
                break;
        }

        return json;
    }

    private _read(schema: TSBufferSchema): unknown {
        switch (schema.type) {
            case SchemaType.Boolean:
                return this._reader.readBoolean();
            case SchemaType.Number:
                return this._readNumber(schema);
            case SchemaType.String:
                return this._reader.readString();
            case SchemaType.Array: {
                let output: any[] = [];
                // 数组长度：Varint
                let length = this._reader.readUint();
                for (let i = 0; i < length; ++i) {
                    let item = this._read(schema.elementType);
                    output.push(item);
                }
                return output;
            }
            case SchemaType.Tuple: {
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

                // undefined as null
                for (let i = 0; i < schema.elementTypes.length; ++i) {
                    if (this._undefinedAsNull(output[i], schema.elementTypes[i], schema.optionalStartIndex !== undefined && i >= schema.optionalStartIndex)) {
                        output[i] = null;
                    }
                }

                return output;
            }
            case SchemaType.Enum:
                let enumId = this._reader.readVarint().toNumber();
                let enumItem = schema.members.find(v => v.id === enumId);
                if (!enumItem) {
                    throw new Error(`Invalid enum encoding: unexpected id ${enumId}`);
                }
                return enumItem.value;
            case SchemaType.Any:
            case SchemaType.Object:
                let jsonStr = this._reader.readString();
                if (jsonStr === 'undefined') {
                    return undefined;
                }
                return JSON.parse(jsonStr);
            case SchemaType.Literal:
                return schema.literal;
            case SchemaType.Interface:
                return this._readInterface(schema);
            case SchemaType.Buffer:
                let uint8Arr = this._reader.readBuffer();
                return this._getBufferValue(uint8Arr, schema);
            case SchemaType.IndexedAccess:
            case SchemaType.Reference:
                return this._read(this._validator.protoHelper.parseReference(schema));
            case SchemaType.Partial:
            case SchemaType.Pick:
            case SchemaType.Omit:
            case SchemaType.Overwrite:
                let parsed = this._validator.protoHelper.parseMappedType(schema);
                if (parsed.type === 'Interface') {
                    return this._readPureMappedType(schema);
                }
                else if (parsed.type === 'Union') {
                    return this._readUnionOrIntersection(parsed);
                }
                break;
            case SchemaType.Union:
            case SchemaType.Intersection:
                return this._readUnionOrIntersection(schema);
            case SchemaType.Date:
                return new Date(this._reader.readUint());
            case SchemaType.NonNullable:
                return this._read(schema.target);
            case SchemaType.Custom:
                if (!schema.decode) {
                    throw new Error('Missing decode method for CustomTypeSchema');
                }
                let buf = this._reader.readBuffer();
                return schema.decode(buf);
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
        // undefined as null
        for (let property of flatSchema.properties) {
            if (output.hasOwnProperty(property.name)) {
                continue;
            }

            // Literal
            let parsedType = this._validator.protoHelper.parseReference(property.type);
            if (parsedType.type === 'Literal') {
                output[property.name] = parsedType.literal;
                continue;
            }

            // undefined as null
            if (this._undefinedAsNull(output[property.name], parsedType, property.optional)) {
                output[property.name] = null;
                continue;
            }
        }

        return output;
    }

    /** @internal 是否该null值小于当做undefined编码 */
    private _undefinedAsNull(value: any, type: TSBufferSchema, isOptional?: boolean) {
        return value === undefined
            && this._options.undefinedAsNull
            && !SchemaUtil.canBeLiteral(type, undefined) && !isOptional
            && SchemaUtil.canBeLiteral(type, null);
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

        if (this._undefinedAsNull(output, schema)) {
            output = null;
        }

        return output;
    }

    private _isObject(value: any): boolean {
        return typeof (value) === 'object' && value !== null;
    }

    private _getBufferValue(uint8Arr: Uint8Array, schema: BufferTypeSchema): ArrayBuffer | ArrayBufferView {
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
            return uint8Arr.byteLength === uint8Arr.buffer.byteLength && uint8Arr.byteOffset === 0 ? uint8Arr.buffer
                : uint8Arr.buffer.slice(uint8Arr.byteOffset, uint8Arr.byteOffset + uint8Arr.byteLength);;
        }
    }

}