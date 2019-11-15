import { TSBufferProto } from "tsbuffer-schema";
import { Encoder } from './encoder/Encoder';
import { TSBufferValidator } from 'tsbuffer-validator';
import { Decoder } from "./decoder/Decoder";
import { ValidateResult } from "tsbuffer-validator/src/ValidateResult";
import { TSBufferSchema } from "tsbuffer-schema";
import { TSBufferValidatorOptions } from "tsbuffer-validator/src/TSBufferValidator";

export interface EncodeOptions {
    skipValidate?: boolean
}

export interface DecodeOptions {
    skipValidate?: boolean
}

export interface TSBufferOptions {
    validatorOptions?: Partial<TSBufferValidatorOptions>;
}

export class TSBuffer {

    protected _validator: TSBufferValidator;
    protected _encoder: Encoder;
    protected _decoder: Decoder;
    protected _proto: TSBufferProto;

    protected _options: TSBufferOptions = {

    }

    constructor(proto: TSBufferProto, options?: Partial<TSBufferOptions>) {
        Object.assign(this._options, options);

        this._proto = proto;
        this._validator = new TSBufferValidator(proto, this._options.validatorOptions);
        this._encoder = new Encoder(this._validator);
        this._decoder = new Decoder(this._validator);
    }

    /**
     * 编码
     * @param value 要编码的值
     * @param schemaId SchemaID，例如`a/b.ts`下的`Test`类型，其ID为`a/b/Test`
     * @param options.skipValidate 跳过编码前的验证步骤（不安全）
     */
    encode(value: any, idOrSchema: string | TSBufferSchema, options?: EncodeOptions) {
        let schema: TSBufferSchema;
        if (typeof idOrSchema === 'string') {
            schema = this._proto[idOrSchema];
            if (!schema) {
                throw new Error(`Cannot find schema： ${idOrSchema}`)
            }
        }
        else {
            schema = idOrSchema
        }

        if (!options || !options.skipValidate) {
            let vRes = this._validator.validateBySchema(value, schema);
            if (!vRes.isSucc) {
                throw new Error(vRes.originalError.message)
            }
        }

        return this._encoder.encode(value, schema);
    }

    /**
     * 解码
     * @param buf 二进制数据
     * @param schemaId SchemaID，例如`a/b.ts`下的`Test`类型，其ID为`a/b/Test`
     * @param options.skipValidate 跳过解码后的验证步骤（不安全）
     */
    decode(buf: Uint8Array, idOrSchema: string | TSBufferSchema, options?: DecodeOptions): unknown {
        let schema: TSBufferSchema;
        if (typeof idOrSchema === 'string') {
            schema = this._proto[idOrSchema];
            if (!schema) {
                throw new Error(`Cannot find schema： ${idOrSchema}`)
            }
        }
        else {
            schema = idOrSchema
        }

        let value: unknown;
        try {
            value = this._decoder.decode(buf, schema);
        }
        catch (e) {
            let err = new Error('Invalid buffer encoding');
            (err as any).encodingError = e;
            throw err;
        }

        if (!options || !options.skipValidate) {
            let vRes = this._validator.validateBySchema(value, schema);
            if (!vRes.isSucc) {
                throw new Error(vRes.originalError.message)
            }
        }

        return value;
    }

    validate(value: any, idOrSchema: string | TSBufferSchema): ValidateResult {
        let schema: TSBufferSchema;
        if (typeof idOrSchema === 'string') {
            schema = this._proto[idOrSchema];
            if (!schema) {
                throw new Error(`Cannot find schema： ${idOrSchema}`)
            }
        }
        else {
            schema = idOrSchema
        }

        return this._validator.validateBySchema(value, schema);
    }
}