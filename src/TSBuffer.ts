import { TSBufferProto, TSBufferSchema } from "tsbuffer-schema";
import { TSBufferValidator, TSBufferValidatorOptions } from 'tsbuffer-validator';
import { Decoder } from "./decoder/Decoder";
import { Encoder } from './encoder/Encoder';
import { Utf8Coder, Utf8Util } from './models/Utf8Util';

export interface TSBufferOptions {
    /**
     * 校验阶段的配置，与编码过程配置相互独立（先校验，再编码）。
     * 将 `Object.assign` 到默认设置上
     */
    validatorOptions: Partial<TSBufferValidatorOptions>,

    /**
     * 编解码阶段，`null` 可编码为 `undefined`。
     * 注意：但不允许 `undefined` 视为 `null`。
     * 在类型允许的情况下优先编码为本值，仅在类型无法兼容的情况下，尝试编码为 `undefined` 或 `null`。     *
     * ```
     * var value: undefined | null = null;  // 编码为 null
     * var value: undefined | null = undefined;  // 编码为 undefined
     * var value: undefined = null;  // 编码为 undefined
     * var value: null = undefined;  // 编码为 null
     * var value: { v?: string } = { v: null };    // 编码为 {}
     * ```
     * 
     * 例如使用 MongoDB 时，如果 `db.XXX.insertOne({ a: 'AAA', b: undefined })`，
     * 插入的记录会被转换为 `{ a: 'AAA', b: null }`
     * 如果类型定义为 `{ a: string, b?: string }`，那么在编码时就会报错，因为 MongoDB 自动将 `undefined` 转换为了 `null`，
     * 不符合类型定义，可能导致编码失败。
     * 当开启 `encodeNullAsUndefined` 后，则可避免这种问题。
     */
    nullAsUndefined: boolean;

    /**
     * 自定义 UTF8 编解码器
     * 默认使用 NodeJS 或自带方法
     */
    utf8Coder: Utf8Coder;

    /**
     * 正常编码流程是：先校验value类型合法，再进行编码
     * 此值为 `true` 时，将跳过校验步骤以提升性能
     * 但需要自行确保值类型合法，否则可能引发不确定的问题
     */
    skipEncodeValidate?: boolean;

    /**
     * 正常解码流程是：先进行二进制解码，再校验解码后的类型符合Schema定义
     * 此值为 `true` 时，将跳过校验步骤以提升性能
     * 但需要自行确保值类型合法，否则可能引发不确定的问题
     */
    skipDecodeValidate?: boolean;
}

export class TSBuffer {

    protected _validator: TSBufferValidator;
    protected _encoder: Encoder;
    protected _decoder: Decoder;
    protected _proto: TSBufferProto;

    /** 默认配置 */
    private _options: TSBufferOptions = {
        validatorOptions: {},
        nullAsUndefined: false,
        utf8Coder: Utf8Util,
    }

    constructor(proto: TSBufferProto, options?: Partial<TSBufferOptions>) {
        if (options?.validatorOptions) {
            options.validatorOptions = {
                ...this._options.validatorOptions,
                ...options.validatorOptions
            }
        }

        this._options = {
            ...this._options,
            ...options
        }

        this._proto = proto;
        this._validator = new TSBufferValidator(proto, this._options.validatorOptions);

        this._encoder = new Encoder({
            validator: this._validator,
            utf8Coder: this._options.utf8Coder,
            nullAsUndefined: this._options.nullAsUndefined
        });

        this._decoder = new Decoder({
            validator: this._validator,
            utf8Coder: this._options.utf8Coder,
            undefinedAsNull: this._options.nullAsUndefined
        });
    }

    /**
     * 编码
     * @param value 要编码的值
     * @param schemaOrId SchemaID，例如`a/b.ts`下的`Test`类型，其ID为`a/b/Test`
     */
    encode(value: any, schemaOrId: string | TSBufferSchema): EncodeOutput {
        let schema: TSBufferSchema;
        if (typeof schemaOrId === 'string') {
            schema = this._proto[schemaOrId];
            if (!schema) {
                throw new Error(`Cannot find schema： ${schemaOrId}`)
            }
        }
        else {
            schema = schemaOrId
        }

        // // change validator options temporaryly
        let oriValidatorOptions = this._validator.options;
        let tempValidatorOptions: TSBufferValidatorOptions = {
            ...this._validator.options,
            excessPropertyChecks: false,
        }

        // excessPropertyChecks
        //      - validate  false（因为不会编码多余字段）
        //      - encode    false（不会编码多余字段，不需要计算unionProperties）
        // strictNullChecks  当 null as undefined
        //      - validate  false
        //      - encode    改true (union validate 因为有null as undefined 会转化propValue)

        // validate before encode
        if (!this._options.skipEncodeValidate) {
            // change validator options temporaryly
            let oriExcessPropertyChecks = this._validator.options.excessPropertyChecks;
            let oriStrictNullChecks = this._validator.options.strictNullChecks;
            this._validator.options.excessPropertyChecks = false;
            this._validator.options.strictNullChecks = oriStrictNullChecks && this._options.nullAsUndefined ? false : true;

            let vRes = this._validator.validate(value, schema);

            // revert validator options
            this._validator.options.excessPropertyChecks = oriExcessPropertyChecks;
            this._validator.options.strictNullChecks = oriStrictNullChecks;

            if (!vRes.isSucc) {
                return vRes;
            }
        }

        let buf: Uint8Array | undefined;
        try {
            buf = this._encoder.encode(value, schema);
        }
        catch (e) {
            // revert validator options
            this._validator.options = oriValidatorOptions;
            return { isSucc: false, errMsg: e.message }
        }

        // revert validator options
        this._validator.options = oriValidatorOptions;
        return { isSucc: true, buf: buf };
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
            let vRes = this._validator.validate(value, schema);
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

        return this._validator.validate(value, schema);
    }
}

/** @public */
export type EncodeOutput = { isSucc: true, buf: Uint8Array, errMsg?: undefined } | { isSucc: false, errMsg: string, buf?: undefined };
/** @public */
export type DecodeOutput = { isSucc: true, output: unknown, errMsg?: undefined } | { isSucc: false, errMsg: string, output?: undefined };