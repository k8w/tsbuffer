import { TSBufferSchema } from "tsbuffer-schema";
import { BufferReader } from './BufferReader';
import { NumberTypeSchema } from "tsbuffer-schema/src/schemas/NumberTypeSchema";
import { TSBufferValidator } from "tsbuffer-validator";
import { InterfaceTypeSchema } from "tsbuffer-schema/src/schemas/InterfaceTypeSchema";
import { InterfaceReference } from "tsbuffer-schema/src/InterfaceReference";
import { OverwriteTypeSchema } from "tsbuffer-schema/src/schemas/OverwriteTypeSchema";
import { UnionTypeSchema } from "tsbuffer-schema/src/schemas/UnionTypeSchema";
import { IntersectionTypeSchema } from "tsbuffer-schema/src/schemas/IntersectionTypeSchema";

export class Decoder {

    private _reader: BufferReader;
    protected _validator: TSBufferValidator;

    constructor(validator: TSBufferValidator) {
        this._reader = new BufferReader();
        this._validator = validator;
    }

    decode(buffer: ArrayBuffer | Uint8Array, schema: TSBufferSchema): unknown {
        this._reader.load((buffer as Uint8Array).buffer || buffer);
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
            case 'Array':
            case 'Tuple':
                let output: any[] = [];
                // 数组长度：Varint
                let length = this._reader.readUint();
                for (let i = 0; i < length; ++i) {
                    let item = this._read(schema.type === 'Array' ? schema.elementType : schema.elementTypes[i]);
                    output.push(item);
                }
                return output;
            case 'Enum':
                let enumId = this._reader.readVarint().toNumber();
                let enumItem = schema.members.find(v => v.id === enumId);
                if (!enumItem) {
                    throw new Error(`Error enum encoding: unexpected id ${enumId}`);
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
                this._readInterface(schema);
            case 'Buffer':
                return this._reader.readBuffer();
            case 'IndexedAccess':
            case 'Reference':
                return this._read(this._validator.protoHelper.parseReference(schema));
            case 'Pick':
            case 'Partial':
            case 'Omit':
                return this._read(schema.target);
            case 'Overwrite':
                return this._readOverwrite(schema);
            case 'Union':
            case 'Intersection':
                return this._readUnionOrIntersection(schema);
            default:
                throw new Error(`Unrecognized schema type: ${(schema as any).type}`);
        }
    }

    private _readNumber(schema: NumberTypeSchema): number {
        // 默认为double
        let scalarType = schema.scalarType || 'double';

        switch (scalarType) {
            // 定长编码
            case 'int32':
            case 'uint32':
            // case 'float':
            case 'double':
                return this._reader.readNumber(scalarType);
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
            let blockId = this._reader.readUint();
            // indexSignature
            if (blockId === 0) {
                let fieldName = this._reader.readString();
                if (!flatSchema.indexSignature) {
                    throw new Error(`Error interface encoding: unexpected indexSignature at block${i}`)
                }
                output[fieldName] = this._read(flatSchema.indexSignature.type);
            }
            // extend block
            else if (blockId <= 9) {
                let extendId = blockId - 1;
                let extend = schema.extends && schema.extends.find(v => v.id === extendId);
                if (!extend) {
                    throw new Error(`Error interface encoding: unexpected extendId ${extendId}`);
                }
                let extendValue = this._read(extend.type);
                Object.assign(output, extendValue);
            }
            // property
            else {
                let propertyId = blockId - 10;
                let property = schema.properties && schema.properties.find(v => v.id === propertyId);
                if (!property) {
                    throw new Error(`Error interface encoding: unexpected propertyId ${propertyId}`);
                }
                output[property.name] = this._read(property.type);
            }
        }

        return output;
    }

    private _readOverwrite(schema: OverwriteTypeSchema): unknown {
        // Target Block
        let target = this._read(schema.target);

        // Overwrite Block
        let overwrite = this._read(schema.overwrite);

        return Object.assign({}, target, overwrite);
    }

    private _readUnionOrIntersection(schema: UnionTypeSchema | IntersectionTypeSchema): unknown {
        let output: any;

        let idNum = this._reader.readUint();
        for (let i = 0; i < idNum; ++i) {
            let id = this._reader.readUint();
            let member = schema.members.find(v => v.id === id);
            if (!member) {
                throw new Error(`Error ${schema.type} encoding: invalid member id ${id}`);
            }
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