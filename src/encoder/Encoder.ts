import { InterfaceTypeSchema, IntersectionTypeSchema, NumberTypeSchema, OmitTypeSchema, OverwriteTypeSchema, PartialTypeSchema, PickTypeSchema, SchemaType, TSBufferSchema, TypeReference, UnionTypeSchema } from 'tsbuffer-schema';
import { TSBufferValidator } from 'tsbuffer-validator';
import { Base64Util } from '..';
import { CoderUtil } from '../models/CoderUtil';
import { Config } from '../models/Config';
import { IdBlockUtil } from '../models/IdBlockUtil';
import { SchemaUtil } from '../models/SchemaUtil';
import { TypedArray, TypedArrays } from '../models/TypedArrays';
import { Varint64 } from '../models/Varint64';
import { BufferWriter } from './BufferWriter';

/** @internal */
export interface EncoderOptions {
    validator: TSBufferValidator;

    /**
     * 编解码阶段，`null` 可编码为 `undefined`。
     * 在类型允许的情况下优先编码为值本身，仅在类型无法兼容的情况下，尝试编码为 `undefined`。     * 
     * ```
     * let value1: undefined | null = null;  // 编码为 null
     * let value2: undefined = null;  // 编码为 undefined
     * let value3: { v?: string } = { v: null };    // 编码为 {}
     * ```
     * 
     * 例如使用 MongoDB 时，如果 `db.XXX.insertOne({ a: 'AAA', b: undefined })`，
     * 插入的记录会被转换为 `{ a: 'AAA', b: null }`
     * 如果类型定义为 `{ a: string, b?: string }`，那么在编码时就会报错，因为 MongoDB 自动将 `undefined` 转换为了 `null`，
     * 不符合类型定义，可能导致编码失败。
     * 当开启 `encodeNullAsUndefined` 后，则可避免这种问题。
     * 
     * 默认为 `false`
     */
    nullAsUndefined?: boolean;
}

/** @internal */
export class Encoder {

    protected _writer: BufferWriter;
    protected _validator: TSBufferValidator;
    private _options: EncoderOptions;

    constructor(options: EncoderOptions) {
        this._options = options;
        this._writer = new BufferWriter();
        this._validator = options.validator;
    }

    encode(value: any, schema: TSBufferSchema): Uint8Array {
        this._writer.clear();
        this._write(value, schema);
        return this._writer.finish();
    }

    encodeJSON(value: any, schema: TSBufferSchema): any {
        // JSON 能直接传输的类型，直接跳过
        if (typeof value !== 'object' || value === null || CoderUtil.isJsonCompatible(schema, 'encode', this._validator.protoHelper)) {
            return value;
        }

        switch (schema.type) {
            case SchemaType.Array:
                if (!Array.isArray(value)) {
                    break;
                }
                return (value as any[]).map(v => this.encodeJSON(v, schema.elementType));
            case SchemaType.Tuple: {
                if (!Array.isArray(value)) {
                    break;
                }
                return (value as any[]).map((v, i) => this.encodeJSON(v, schema.elementTypes[i]));
            }
            case SchemaType.Interface: {
                if (value.constructor !== Object) {
                    break;
                }
                value = Object.assign({}, value);
                let flatSchema = this._validator.protoHelper.getFlatInterfaceSchema(schema);
                for (let key in value) {
                    let property = flatSchema.properties.find(v => v.name === key);
                    if (property) {
                        value[key] = this.encodeJSON(value[key], property.type);
                    }
                    else if (flatSchema.indexSignature) {
                        value[key] = this.encodeJSON(value[key], flatSchema.indexSignature.type);
                    }
                }
                return value;
            }
            case SchemaType.Partial:
            case SchemaType.Pick:
            case SchemaType.Omit:
            case SchemaType.Overwrite:
                let parsed = this._validator.protoHelper.parseMappedType(schema);
                return this.encodeJSON(value, parsed);
            case SchemaType.Buffer:
                if (!(value instanceof ArrayBuffer) && !ArrayBuffer.isView(value)) {
                    break;
                }

                if (schema.arrayType) {
                    if (schema.arrayType === 'Uint8Array') {
                        return Base64Util.bufferToBase64(value as Uint8Array);
                    }
                    let view = value as ArrayBufferView;
                    let buf = view.byteLength === view.buffer.byteLength && view.byteOffset === 0 ? view.buffer
                        : view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
                    return Base64Util.bufferToBase64(new Uint8Array(buf));
                }
                else {
                    return Base64Util.bufferToBase64(new Uint8Array(value as ArrayBuffer))
                }
            case SchemaType.IndexedAccess:
            case SchemaType.Reference:
            case SchemaType.Keyof:
                return this.encodeJSON(value, this._validator.protoHelper.parseReference(schema));
            case SchemaType.Union:
            case SchemaType.Intersection: {
                // 逐个编码 然后合并 （失败的会原值返回，所以不影响结果）
                for (let member of schema.members) {
                    value = this.encodeJSON(value, member.type);
                }
                return value;
            }
            case SchemaType.NonNullable:
                return this.encodeJSON(value, schema.target);
            case SchemaType.Date:
                if (!(value instanceof Date)) {
                    break;
                }
                return value.toJSON();
            case SchemaType.Custom:
                if (schema.encodeJSON) {
                    return schema.encodeJSON(value);
                }
                else if (typeof value?.toJSON === 'function') {
                    return value.toJSON();
                }
                else if (typeof value?.toString === 'function') {
                    return value.toString();
                }
                return value;
            default:
                schema.type
        }

        return value;
    }

    private _write(value: any, schema: TSBufferSchema, options?: {
        skipFields?: { [fieldName: string]: 1 },
        pickFields?: { [fieldName: string]: 1 },
        skipIndexSignature?: boolean
    }) {
        switch (schema.type) {
            case SchemaType.Boolean:
                this._writer.push({ type: 'boolean', value: value });
                break;
            case SchemaType.Number:
                this._writeNumber(value, schema);
                break;
            case SchemaType.String:
                this._writer.push({ type: 'string', value: value });
                break;
            case SchemaType.Array: {
                let _v = value as any[];
                // 数组长度：Varint
                this._writer.push({ type: 'varint', value: Varint64.from(_v.length) });
                // Element Payload
                for (let i = 0; i < _v.length; ++i) {
                    this._write(_v[i], schema.elementType);
                }
                break;
            }
            case SchemaType.Tuple: {
                if (schema.elementTypes.length > 64) {
                    throw new Error('Elements oversized, maximum supported tuple elements is 64, now get ' + schema.elementTypes.length)
                }

                let _v = value as any[];

                // 计算maskPos（要编码的值的index）
                let maskIndices: number[] = [];
                for (let i = 0; i < _v.length; ++i) {
                    // undefined 不编码
                    // null as undefined
                    if (_v[i] === undefined || this._nullAsUndefined(_v[i], schema.elementTypes[i])) {
                        continue;
                    }

                    maskIndices.push(i);
                }
                // 生成PayloadMask：Varint64
                let lo = 0;
                let hi = 0;
                for (let v of maskIndices) {
                    if (v < 32) {
                        lo |= 1 << v;
                    }
                    else {
                        hi |= 1 << v - 32;
                    }
                }
                this._writer.push({ type: 'varint', value: new Varint64(hi, lo) });

                // Element Payload
                for (let i of maskIndices) {
                    this._write(_v[i], schema.elementTypes[i]);
                }
                break;
            }
            case SchemaType.Enum:
                let enumItem = schema.members.find(v => v.value === value);
                if (!enumItem) {
                    throw new Error(`Unexpect enum value: ${value}`);
                }
                this._writer.push({ type: 'varint', value: Varint64.from(enumItem.id) });
                break;
            case SchemaType.Any:
                if (value === undefined) {
                    this._writer.push({ type: 'string', value: 'undefined' });
                }
                else {
                    this._writer.push({ type: 'string', value: JSON.stringify(value) });
                }
                break;
            case SchemaType.Object:
                this._writer.push({ type: 'string', value: JSON.stringify(value) });
                break;
            case SchemaType.Literal:
                break;
            case SchemaType.Interface:
                this._writeInterface(value, schema, options);
                break;
            case SchemaType.Buffer:
                this._writeBuffer(value);
                break;
            case SchemaType.IndexedAccess:
            case SchemaType.Reference:
            case SchemaType.Keyof:
                this._write(value, this._validator.protoHelper.parseReference(schema), options);
                break;
            case SchemaType.Partial:
            case SchemaType.Pick:
            case SchemaType.Omit:
            case SchemaType.Overwrite:
                let parsed = this._validator.protoHelper.parseMappedType(schema);
                if (parsed.type === SchemaType.Interface) {
                    this._writePureMappedType(value, schema, options);
                }
                else if (parsed.type === SchemaType.Union) {
                    this._writeUnion(value, parsed, options?.skipFields);
                }
                else if (parsed.type === SchemaType.Intersection) {
                    this._writeIntersection(value, parsed, options?.skipFields);
                }
                break;
            case SchemaType.Union:
                this._writeUnion(value, schema, options?.skipFields);
                break;
            case SchemaType.Intersection:
                this._writeIntersection(value, schema, options?.skipFields);
                break;
            case SchemaType.Date:
                this._writer.push({ type: 'varint', value: Varint64.from((value as Date).getTime()) });
                break;
            case SchemaType.NonNullable:
                this._write(value, schema.target, options);
                break;
            case SchemaType.Custom:
                if (!schema.encode) {
                    throw new Error('Missing encode method for CustomTypeSchema');
                }
                let buf = schema.encode(value);
                // 以 Buffer 形式写入
                this._writeBuffer(buf);
                break;
            default:
                // @ts-expect-error
                throw new Error(`Unrecognized schema type: ${schema.type}`);
        }
    }

    private _writePureMappedType(value: any, schema: MappedTypeSchema, options?: {
        skipFields?: { [fieldName: string]: 1 },
        pickFields?: { [fieldName: string]: 1 },
    }) {
        if (!options) {
            options = {};
        }

        if (schema.type === 'Pick') {
            // 已存在 取交集
            if (options.pickFields) {
                let newPickFields: { [key: string]: 1 } = {};
                for (let v of schema.keys) {
                    if (options.pickFields[v]) {
                        newPickFields[v] = 1;
                    }
                }
                options.pickFields = newPickFields;
            }
            // 不存在 初始化
            else {
                options.pickFields = {};
                for (let v of schema.keys) {
                    options.pickFields[v] = 1;
                }
            }
        }
        else if (schema.type === 'Omit') {
            // 不存在 初始化
            if (!options?.skipFields) {
                if (!options) {
                    options = {};
                }
                options.skipFields = {};
            }
            // 取并集                
            for (let v of schema.keys) {
                options.skipFields[v] = 1;
            }
        }
        else if (schema.type === 'Overwrite') {
            let parsed = this._parseOverwrite(value, schema);
            // 写入Overwrite部分
            this._write(parsed.overwriteValue, parsed.overwrite, options);
        }
        else if (schema.type === 'Partial') { }
        else {
            // @ts-expect-error
            throw new Error('Invalid PureMappedType child: ' + schema.type);
        }

        // Write Interface
        let parsedTarget = this._validator.protoHelper.parseReference(schema.target);
        if (parsedTarget.type === 'Interface') {
            this._writeInterface(value, parsedTarget, options);
        }
        else {
            this._writePureMappedType(value, parsedTarget as MappedTypeSchema, options);
        }
    }

    private _writeNumber(value: any, schema: NumberTypeSchema) {
        // 默认为double
        let scalarType = schema.scalarType || 'double';

        switch (scalarType) {
            // 定长编码
            case 'double':
                this._writer.push({ type: scalarType, value: value });
                break;
            // Varint编码
            case 'int':
                this._writer.push({ type: 'varint', value: Varint64.from(value).zzEncode() });
                break;
            case 'uint':
                this._writer.push({ type: 'varint', value: Varint64.from(value) });
                break;
            default:
                throw new Error('Scalar type not support : ' + scalarType)
        }
    }

    private _writeInterface(value: any, schema: InterfaceTypeSchema, options?: {
        skipFields?: { [fieldName: string]: 1 },
        pickFields?: { [fieldName: string]: 1 },
        skipIndexSignature?: boolean
    }) {
        // skipFields默认值
        if (!options) {
            options = {}
        }
        if (!options.skipFields) {
            options.skipFields = {};
        }

        // 记录起始op位置，用于最后插入BlockID数量
        let opStartOps = this._writer.ops.length;
        let blockIdCount = 0;

        // 以下，interface
        // extends
        if (schema.extends) {
            // 支持的继承数量有上限
            if (schema.extends.length > Config.interface.maxExtendsNum) {
                throw new Error(`Max support ${Config.interface.maxExtendsNum} extends, actual: ${schema.extends.length}`);
            }

            for (let extend of schema.extends) {
                // BlockID = extend.id + 1
                let blockId = extend.id + 1;
                this._writer.push({ type: 'varint', value: Varint64.from(blockId) });
                let blockIdPos = this._writer.ops.length - 1;

                // 写入extend interface前 writeOps的长度
                let opsLengthBeforeWrite = this._writer.ops.length;

                // extend Block
                let parsedExtend = this._validator.protoHelper.parseReference(extend.type) as InterfaceTypeSchema;
                this._writeInterface(value, parsedExtend, {
                    ...options,
                    // 确保indexSignature是在最小层级编码
                    skipIndexSignature: !!schema.indexSignature || options.skipIndexSignature // 如果父级有indexSignature 或 父级跳过 则跳过indexSignature
                });

                // 写入前后writeOps只增加了一个（block length），说明该extend并未写入任何property字段，取消编码这个block
                if (this._writer.ops.length === opsLengthBeforeWrite + 1) {
                    // 移除BlockID
                    this._writer.ops.splice(this._writer.ops.length - 2, 2);
                }
                // extend写入成功 blockId数量+1
                else {
                    ++blockIdCount;
                    this._processIdWithLengthType(blockIdPos, extend.type);
                }
            }
        }

        // property
        if (schema.properties) {
            for (let property of schema.properties) {
                let parsedType = this._validator.protoHelper.parseReference(property.type);
                let propValue = value[property.name];

                // PickFields
                if (options.pickFields && !options.pickFields[property.name]) {
                    continue;
                }

                // Literal不编码 直接跳过
                if (parsedType.type === 'Literal') {
                    options.skipFields[property.name] = 1;
                    continue;
                }

                // null as undefined
                if (this._nullAsUndefined(propValue, property.type)) {
                    propValue = undefined;
                }

                // undefined不编码
                if (propValue === undefined) {
                    continue;
                }

                // SkipFields
                if (options.skipFields[property.name]) {
                    continue;
                }
                options.skipFields[property.name] = 1;

                let blockId = property.id + Config.interface.maxExtendsNum + 1;
                // BlockID (propertyID)
                this._writer.push({ type: 'varint', value: Varint64.from(blockId) });
                let blockIdPos = this._writer.ops.length - 1;

                // Value Payload
                this._write(propValue, parsedType);

                ++blockIdCount;
                this._processIdWithLengthType(blockIdPos, parsedType);
            }
        }

        // indexSignature
        if (!options.skipIndexSignature) {
            let flat = this._validator.protoHelper.getFlatInterfaceSchema(schema);
            if (flat.indexSignature) {
                for (let key in value) {
                    if (value[key] === undefined || this._nullAsUndefined(value[key], flat.indexSignature.type)) {
                        continue;
                    }

                    // PickFields
                    if (options.pickFields && !options.pickFields[key]) {
                        continue;
                    }

                    // SkipFields
                    if (options.skipFields[key]) {
                        continue;
                    }
                    options.skipFields[key] = 1;

                    // BlockID == 0
                    this._writer.push({ type: 'varint', value: Varint64.from(0) });
                    let blockIdPos = this._writer.ops.length - 1;

                    // 字段名
                    this._writer.push({ type: 'string', value: key });
                    let lengthPrefixPos = this._writer.ops.length;

                    // Value Payload
                    this._write(value[key], flat.indexSignature.type);

                    ++blockIdCount;
                    this._processIdWithLengthType(blockIdPos, flat.indexSignature.type, lengthPrefixPos);
                }
            }
        }

        this._writer.ops.splice(opStartOps, 0, this._writer.req2op({ type: 'varint', value: Varint64.from(blockIdCount) }));
    }

    /** @internal 是否该null值小于当做undefined编码 */
    private _nullAsUndefined(value: any, type: TSBufferSchema) {
        return value === null
            && this._options.nullAsUndefined
            && !SchemaUtil.canBeLiteral(type, null);
        // && SchemaUtil.canBeLiteral(type, undefined)  一定为true 因为先validate过了
    }

    private _parseOverwrite(value: any, schema: OverwriteTypeSchema) {
        let skipFields: { [key: string]: 1 } = {};

        // 解引用
        let target = this._validator.protoHelper.parseReference(schema.target) as Exclude<OverwriteTypeSchema['target'], TypeReference>;
        let overwrite = this._validator.protoHelper.parseReference(schema.overwrite) as Exclude<OverwriteTypeSchema['overwrite'], TypeReference>;
        let flatTarget = this._validator.protoHelper.getFlatInterfaceSchema(target);
        let flatOverwrite = this._validator.protoHelper.getFlatInterfaceSchema(overwrite);

        // 先区分哪些字段进入Target块，哪些字段进入Overwrite块
        let overwriteValue: any = {};
        let targetValue: any = {};

        // Overwrite块 property
        if (flatOverwrite.properties) {
            // 只要Overwrite中有此Property，即在Overwrite块编码
            for (let property of flatOverwrite.properties) {
                // undefined不编码，跳过SkipFIelds
                if (value[property.name] !== undefined && !skipFields[property.name]) {
                    overwriteValue[property.name] = value[property.name];
                    skipFields[property.name] = 1;
                }
            }
        }

        // Target块 property
        if (flatTarget.properties) {
            for (let property of flatTarget.properties) {
                // undefined不编码，跳过SkipFields
                if (value[property.name] !== undefined && !skipFields[property.name]) {
                    targetValue[property.name] = value[property.name];
                    skipFields[property.name] = 1;
                }
            }
        }

        // indexSignature
        let indexSignatureWriteValue: any;  // indexSignature要写入的目标（overwrite或target）
        let indexSignature: InterfaceTypeSchema['indexSignature'];
        // IndexSignature，优先使用Overwrite的
        if (flatOverwrite.indexSignature) {
            indexSignature = flatOverwrite.indexSignature;
            indexSignatureWriteValue = overwriteValue;
        }
        else if (flatTarget.indexSignature) {
            indexSignature = flatTarget.indexSignature
            indexSignatureWriteValue = targetValue;
        }
        if (indexSignature) {
            for (let key in value) {
                if (skipFields[key]) {
                    continue;
                }

                indexSignatureWriteValue[key] = value[key];
                skipFields[key] = 1;
            }
        }

        // 编码，此处不再需要SkipFields，因为已经筛选过
        return {
            target: target,
            targetValue: targetValue,
            overwrite: overwrite,
            overwriteValue: overwriteValue
        }
    }

    private _writeUnion(value: any, schema: UnionTypeSchema, skipFields: { [fieldName: string]: 1 } = {}, unionProperties?: string[]) {
        // 计算unionProperties
        // if (!unionProperties) {
        //     unionProperties = skipFields ? Object.keys(skipFields) : [];
        // }
        // this._validator.protoHelper.getUnionProperties(schema).forEach(v => {
        //     unionProperties!.binaryInsert(v, true);
        // })

        // 记住编码起点
        let encodeStartPos = this._writer.ops.length;
        let idNum = 0;

        // null as undefined
        if (this._nullAsUndefined(value, schema)) {
            value = undefined;
        }

        for (let member of schema.members) {
            // 验证该member是否可以编码            
            let vRes = this._validator.validate(value, member.type, {
                // 禁用excessPropertyChecks（以代替unionProperties）
                excessPropertyChecks: false,
                // 启用strictNullChecks（null as undefined已经前置处理）
                strictNullChecks: true
            });

            if (vRes.isSucc) {
                // 编码
                // Part2: ID
                this._writer.push({ type: 'varint', value: Varint64.from(member.id) });
                let idPos = this._writer.ops.length - 1;

                // Part3: Payload
                if (member.type.type === 'Union') {
                    this._writeUnion(value, member.type, skipFields)
                }
                else {
                    this._write(value, member.type, {
                        skipFields: skipFields
                    });
                }
                idNum++;

                this._processIdWithLengthType(idPos, member.type);

                // 非object的value，类型一定互斥，只编码一个足矣
                if (typeof value !== 'object') {
                    break;
                }
            }
        }

        // 已经编码
        if (idNum > 0) {
            // 前置ID数量
            this._writer.ops.splice(encodeStartPos, 0, this._writer.req2op({ type: 'varint', value: Varint64.from(idNum) }));
            return;
        }
        else {
            // 未编码，没有任何条件满足，抛出异常
            throw new Error('Non member is satisfied for union type');
        }
    }

    private _writeIntersection(value: any, schema: IntersectionTypeSchema, skipFields: { [fieldName: string]: 1 } = {}) {
        // ID数量（member数量）
        this._writer.push({ type: 'varint', value: Varint64.from(schema.members.length) });

        // 按Member依次编码
        for (let member of schema.members) {
            // ID
            this._writer.push({ type: 'varint', value: Varint64.from(member.id) });
            let idPos = this._writer.ops.length - 1;

            // 编码块
            this._write(value, member.type, {
                skipFields: skipFields
            });
            this._processIdWithLengthType(idPos, member.type);
        }
    }

    private _writeBuffer(value: ArrayBuffer | TypedArray) {
        // ArrayBuffer 转为Uint8Array
        if (value instanceof ArrayBuffer) {
            this._writer.push({ type: 'buffer', value: new Uint8Array(value) });
        }
        // Uint8Array 直接写入
        else if (value instanceof Uint8Array) {
            this._writer.push({ type: 'buffer', value: value });
        }
        // 其它TypedArray 转为Uint8Array
        else {
            let key = value.constructor.name as keyof typeof TypedArrays;
            let arrType = TypedArrays[key];
            let uint8Arr = new Uint8Array(value.buffer, value.byteOffset, value.length * arrType.BYTES_PER_ELEMENT);
            this._writer.push({ type: 'buffer', value: uint8Arr });
        }
    }

    // private _writeIdBlocks(blocks: IDBlockItem[]) {
    //     // 字段数量: Varint
    //     this._writer.push({ type: 'varint', value: Varint64.from(blocks.length) });

    //     // 依次编码
    //     for (let item of blocks) {
    //         // ID
    //         this._writer.push({ type: 'varint', value: Varint64.from(item.id) });
    //         // Payload
    //         this._write(item.value, item.schema)
    //     }
    // }

    /**
     * 重新处理ID位，使其加入末位长度信息2Bit
     * @param idPos 
     */
    private _processIdWithLengthType(idPos: number, payloadType: TSBufferSchema, lengthPrefixPos?: number) {
        let idOp = this._writer.ops[idPos];
        if (idOp.type !== 'varint') {
            throw new Error('Error idPos: ' + idPos);
        }

        // 解引用
        let parsedSchema = this._validator.protoHelper.parseReference(payloadType);

        let lengthInfo = IdBlockUtil.getPayloadLengthInfo(parsedSchema, this._validator.protoHelper);
        let newId = (idOp.value.toNumber() << 2) + lengthInfo.lengthType;
        this._writer.ops[idPos] = this._writer.req2op({
            type: 'varint',
            value: Varint64.from(newId)
        });

        if (lengthInfo.needLengthPrefix) {
            let payloadByteLength = this._writer.ops.filter((v, i) => i > idPos).sum(v => v.length);
            this._writer.ops.splice(lengthPrefixPos == undefined ? idPos + 1 : lengthPrefixPos, 0, this._writer.req2op({
                type: 'varint',
                value: Varint64.from(payloadByteLength)
            }))
        }

    }

}

/** @internal */
export interface IDBlockItem {
    id: number,
    value: any,
    schema: TSBufferSchema
}

/** @internal */
export type MappedTypeSchema = PickTypeSchema | OmitTypeSchema | PartialTypeSchema | OverwriteTypeSchema;