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
import { TypedArrays, TypedArray, TypedArrayConstructor } from '../TypedArrays';
import { BufferTypeSchema } from 'tsbuffer-schema/src/schemas/BufferTypeSchema';

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
                // extend Block
                this._writeInterface(value, extend.type, skipFields,
                    // 确保indexSignature是在最小层级编码
                    !!parsedSchema.indexSignature || skipIndexSignature // 如果父级有indexSignature 或 父级跳过 则跳过indexSignature
                );

                ++blockIdCount;
            }
        }

        // property
        if (parsedSchema.properties) {
            for (let property of parsedSchema.properties) {
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
                this._write(value[property.name], property.type);

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

    private _writeUnion(value: any, schema: UnionTypeSchema, skipFields: { [fieldName: string]: 1 } = {}) {
        // 先将member分为两组
        let interfaceMembers: UnionTypeSchema['members'] = [];
        let nonInterfaceMembers: UnionTypeSchema['members'] = [];
        for (let member of schema.members) {
            if (this._validator.protoHelper.isInterface(member.type)) {
                interfaceMembers.push(member);
            }
            else {
                nonInterfaceMembers.push(member);
            }
        }

        // 非interface，直接验证，验证通过即可编码，且与其它Member互斥
        if (nonInterfaceMembers.length) {
            for (let member of nonInterfaceMembers) {
                if (this._validator.validateBySchema(value, member.type).isSucc) {
                    // 编码
                    // Part1，ID编码块长度（1）
                    this._writer.push({ type: 'varint', value: Varint64.from(1) });
                    // Part2: ID
                    this._writer.push({ type: 'varint', value: Varint64.from(member.id) });
                    // Part3: Payload
                    this._write(value, member.type);
                    return;
                }
            }
        }
        // interface 考虑unionFields后验证 编码通过测试的
        else if (interfaceMembers.length) {
            // 计算UnionFields
            let unionFields: string[] = [];
            this._validator.protoHelper.extendsUnionFields(unionFields, interfaceMembers.map(v => v.type));

            // 记住编码起点
            let encodeStartPos = this._writer.ops.length;
            let idNum = 0;

            // 逐个验证
            for (let member of interfaceMembers) {
                let schema = this._validator.protoHelper.parseReference(member.type) as InterfaceTypeSchema | InterfaceReference;
                // 验证通过，编码，由于SkipFields的存在，一个字段只会在它最先出现的那个member内编码
                if (this._validator.validateInterfaceReference(value, schema, unionFields).isSucc) {
                    // ID
                    this._writer.push({ type: 'varint', value: Varint64.from(member.id) });
                    // Payload
                    this._writeInterface(value, schema, skipFields);
                    ++idNum;
                }
            }

            // 已经编码
            if (idNum > 0) {
                // 前置ID数量
                this._writer.ops.splice(encodeStartPos, 0, this._writer.req2op({ type: 'varint', value: Varint64.from(idNum) }));
                return;
            }
        }

        // 未编码，没有任何条件满足，抛出异常
        throw new Error('Non member is satisfied for union type');
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