import { TSBufferProto } from "tsbuffer-schema";
import { Encoder } from './encoder/Encoder';
import { TSBufferValidator, ValidatorOutput } from 'tsbuffer-validator';
import { Decoder } from "./decoder/Decoder";
import { TSBufferSchema } from "tsbuffer-schema";
import { Utf8Util } from './models/Utf8Util';

export interface EncodeOptions {
    skipValidate?: boolean
}

export interface DecodeOptions {
    skipValidate?: boolean
}

export interface TSBufferOptions {
    /** 
     * 是否严格检查，不允许出现协议中定义外的字段
     * 由于编解码都是严格遵照协议，类型安全，所以默认为false
     * 为false时，即编解码不会编解码出额外的字段，但也不会对输入的额外字段进行验证报错
     */
    strictExcessCheck: boolean;

    /** 是否将null与undefined区别对待（等同于tsconfig中的strictNullChecks），默认为true */
    strictNullCheck: boolean;

    utf8: {
        measureLength: (str: string) => number,
        /** 返回编码后的长度 */
        write: (str: string, buf: Uint8Array, pos: number) => number,
        read: (buf: Uint8Array, pos: number, length: number) => string
    }
}

export class TSBuffer {

    protected _validator: TSBufferValidator;
    protected _encoder: Encoder;
    protected _decoder: Decoder;
    protected _proto: TSBufferProto;

    /** 默认配置 */
    options: TSBufferOptions = {
        strictExcessCheck: false,
        strictNullCheck: true,
        utf8: Utf8Util,
    }

    constructor(proto: TSBufferProto, options?: Partial<TSBufferOptions>) {
        Object.assign(this.options, options);

        this._proto = proto;
        this._validator = new TSBufferValidator(proto, {
            skipExcessCheck: !this.options.strictExcessCheck,
            strictNullCheck: this.options.strictNullCheck,
        });
        this._encoder = new Encoder(this._validator, this.options.utf8);
        this._decoder = new Decoder(this._validator, this.options.utf8);
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

    validate(value: any, idOrSchema: string | TSBufferSchema): ValidatorOutput {
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