import { TSBufferSchema } from 'tsbuffer-schema';
import { BufferWriter } from './BufferWriter';
import { NumberTypeSchema } from 'tsbuffer-schema/src/schemas/NumberTypeSchema';
import { TSBufferValidator } from 'tsbuffer-validator';
import { Config } from '../models/Config';
import { InterfaceTypeSchema } from 'tsbuffer-schema/src/schemas/InterfaceTypeSchema';
import { InterfaceReference } from 'tsbuffer-schema/src/InterfaceReference';
import { TypeReference } from 'tsbuffer-schema/src/TypeReference';
import { OverwriteTypeSchema } from 'tsbuffer-schema/src/schemas/OverwriteTypeSchema';
import { UnionTypeSchema } from 'tsbuffer-schema/src/schemas/UnionTypeSchema';
import { IntersectionTypeSchema } from 'tsbuffer-schema/src/schemas/IntersectionTypeSchema';
import { Varint64 } from '../models/Varint64';
import { TypedArrays, TypedArray } from '../TypedArrays';
import { BufferTypeSchema } from 'tsbuffer-schema/src/schemas/BufferTypeSchema';
import { ValidateResult } from 'tsbuffer-validator/src/ValidateResult';

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

    private _write(value: any, schema: TSBufferSchema, skipFields?: { [fieldName: string]: 1 }) {
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
                this._writer.push({ type: 'varint', value: Varint64.from(_v.length) });
                // Element Payload
                for (let i = 0; i < _v.length; ++i) {
                    this._write(_v[i], schema.type === 'Array' ? schema.elementType : schema.elementTypes[i]);
                }
                break;
            case 'Enum':
                let enumItem = schema.members.find(v => v.value === value);
                if (!enumItem) {
                    throw new Error(`Unexpect enum value: ${value}`);
                }
                this._writer.push({ type: 'varint', value: Varint64.from(enumItem.id) });
                break;
            case 'Any':
                if (value === undefined) {
                    this._writer.push({ type: 'string', value: 'undefined' });
                }
                else {
                    this._writer.push({ type: 'string', value: JSON.stringify(value) });
                }
                break;
            case 'NonPrimitive':
                this._writer.push({ type: 'string', value: JSON.stringify(value) });
                break;
            case 'Literal':
                break;
            case 'Interface':
                this._writeInterface(value, schema, skipFields);
                break;
            case 'Buffer':
                this._writeBuffer(value, schema);
                break;
            case 'IndexedAccess':
            case 'Reference':
                this._write(value, this._validator.protoHelper.parseReference(schema), skipFields);
                break;
            case 'Pick':
            case 'Partial':
            case 'Omit':
                this._writeInterface(value, schema.target, skipFields);
                break;
            case 'Overwrite':
                this._writeOverwrite(value, schema, skipFields);
                break;
            case 'Union':
                this._writeUnion(value, schema, skipFields);
                break;
            case 'Intersection':
                this._writeIntersection(value, schema, skipFields);
                break;
            default:
                throw new Error(`Unrecognized schema type: ${(schema as any).type}`);
        }
    }

    private _writeNumber(value: any, schema: NumberTypeSchema) {
        // 默认为double
        let scalarType = schema.scalarType || 'double';

        switch (scalarType) {
            // 定长编码
            case 'int32':
            case 'uint32':
            // case 'float':
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

    private _writeInterface(value: any, schema: InterfaceTypeSchema | InterfaceReference, skipFields: { [fieldName: string]: 1 } = {}, skipIndexSignature?: boolean) {
        // 记录起始op位置，用于最后插入BlockID数量
        let opStartOps = this._writer.ops.length;
        let blockIdCount = 0;

        let parsedSchema = this._validator.protoHelper.parseReference(schema) as Exclude<InterfaceTypeSchema | InterfaceReference, TypeReference>;

        // MappedType
        switch (parsedSchema.type) {
            case 'Overwrite':
                this._writeOverwrite(value, parsedSchema, skipFields);
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
                this._writer.push({ type: 'varint', value: Varint64.from(blockId) });

                // 写入extend interface前 writeOps的长度
                let opsLengthBeforeWrite = this._writer.ops.length;

                // extend Block
                this._writeInterface(value, extend.type, skipFields,
                    // 确保indexSignature是在最小层级编码
                    !!parsedSchema.indexSignature || skipIndexSignature // 如果父级有indexSignature 或 父级跳过 则跳过indexSignature
                );

                // 写入前后writeOps只增加了一个（block length），说明该extend并未写入任何property字段，取消编码这个block
                if (this._writer.ops.length === opsLengthBeforeWrite + 1) {
                    // 移除BlockID
                    this._writer.ops.splice(this._writer.ops.length - 2, 2);
                }
                // extend写入成功 blockId数量+1
                else {
                    ++blockIdCount;
                }
            }
        }

        // property
        if (parsedSchema.properties) {
            for (let property of parsedSchema.properties) {
                let parsedType = this._validator.protoHelper.parseReference(property.type);

                // Literal不编码 直接跳过
                if (parsedType.type === 'Literal') {
                    skipFields[property.name] = 1;
                    continue;
                }

                // 只编码已定义的字段
                if (value[property.name] === undefined) {
                    continue;
                }

                // SkipFields
                if (skipFields[property.name]) {
                    continue;
                }
                skipFields[property.name] = 1;

                let blockId = property.id + Config.interface.maxExtendsNum + 1;
                // BlockID (propertyID)
                this._writer.push({ type: 'varint', value: Varint64.from(blockId) });
                // Value Payload
                this._write(value[property.name], parsedType);

                ++blockIdCount;
            }
        }

        // indexSignature
        if (!skipIndexSignature) {
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
                    this._writer.push({ type: 'varint', value: Varint64.from(0) });
                    // 字段名
                    this._writer.push({ type: 'string', value: key });
                    // Value Payload
                    this._write(value[key], flat.indexSignature.type);

                    ++blockIdCount;
                }
            }
        }

        this._writer.ops.splice(opStartOps, 0, this._writer.req2op({ type: 'varint', value: Varint64.from(blockIdCount) }));
    }

    private _writeOverwrite(value: any, schema: OverwriteTypeSchema, skipFields: { [fieldName: string]: 1 } = {}) {
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
        this._writeInterface(overwriteValue, overwrite);
        this._writeInterface(targetValue, target);
    }

    private _writeUnion(value: any, schema: UnionTypeSchema, skipFields: { [fieldName: string]: 1 } = {}, unionFields?: string[]) {
        // 计算UnionFields
        if (!unionFields) {
            unionFields = skipFields ? Object.keys(skipFields) : [];
        }
        this._validator.protoHelper.extendsUnionFields(unionFields, schema.members.map(v => v.type));

        // 记住编码起点
        let encodeStartPos = this._writer.ops.length;
        let idNum = 0;

        for (let member of schema.members) {
            // 验证该member是否可以编码
            let vRes: ValidateResult;
            // interface 加入unionFIelds去validate
            if (this._validator.protoHelper.isInterface(member.type)) {
                vRes = this._validator.validateInterfaceReference(value, member.type, unionFields);
            }
            // LogicType 递归unionFields
            else if (member.type.type === 'Union') {
                vRes = this._validator.validateUnionType(value, member.type, unionFields);
            }
            else if (member.type.type === 'Intersection') {
                vRes = this._validator.validateIntersectionType(value, member.type, unionFields);
            }
            // 其它类型 直接validate
            else {
                vRes = this._validator.validateBySchema(value, member.type);
            }

            if (vRes.isSucc) {
                // 编码
                // Part2: ID
                this._writer.push({ type: 'varint', value: Varint64.from(member.id) });
                // Part3: Payload
                if (member.type.type === 'Union') {
                    this._writeUnion(value, member.type, skipFields, unionFields)
                }
                else {
                    this._write(value, member.type, skipFields);
                }
                idNum++;

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
            // 编码块
            this._write(value, member.type, skipFields);
        }
    }

    private _writeBuffer(value: ArrayBuffer | TypedArray, schema: BufferTypeSchema) {
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

}

export interface IDBlockItem {
    id: number,
    value: any,
    schema: TSBufferSchema
}