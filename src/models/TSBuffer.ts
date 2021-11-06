import { CustomTypeSchema, TSBufferProto, TSBufferSchema } from "tsbuffer-schema";
import { TSBufferValidator } from 'tsbuffer-validator';
import { Decoder } from "../decoder/Decoder";
import { Encoder } from '../encoder/Encoder';

/** @public */
export interface TSBufferOptions {
    /**
     * 检查值中是否包含Schema定义之外多余的字段
     * 仅对 `validate` 方法生效
     * 是因为实现机制原因, `prune` `encode` `decode` 方法都会天然保证不会混入多余字段
     *
     * 默认：`true`
     */
    excessPropertyChecks: boolean;

    /**
     * 同 `tsconfig.json` 中的 `strictNullChecks`
     * 是否使用严格等于去判定 `undefined` 和 `null`
     * 如果该值为 `false`，则在编码过程中，`null` 在类型不兼容时可编码为`undefined`，
     * 解码过程中，`undefined` 在类型不兼容时可解码为 `null`。
     * @defaultValue false
     */
    strictNullChecks: boolean;

    /**
     * 正常编码流程是：先校验value类型合法，再进行编码
     * 此值为 `true` 时，将跳过校验步骤以提升性能
     * 但需要自行确保值类型合法，否则可能引发不确定的问题
     * 默认为 `false`
     */
    skipEncodeValidate: boolean;

    /**
     * 正常解码流程是：先进行二进制解码，再校验解码后的类型符合Schema定义
     * 此值为 `true` 时，将跳过校验步骤以提升性能
     * 但需要自行确保值类型合法，否则可能引发不确定的问题
     * 默认为 `false`
     */
    skipDecodeValidate: boolean;

    /**
     * Clone the proto, don't change this if you don't know what it is.
     * @defaultValue true
     */
    cloneProto?: boolean;

    /**
     * Append `CustomTypeSchema` to given schema,
     * to customize validate & encode methods for specific types.
     * For example 'mongodb/ObjectId'.
     */
    customTypes?: { [schemaId: string]: CustomTypeSchema };
}

/** @public */
export interface EncodeOptions {
    /** Skip validate value *before* encode */
    skipValidate?: boolean;
}

/** @public */
export interface DecodeOptions {
    /** Skip validate value *after* decode */
    skipValidate?: boolean;
}

/**
 * @public
 */
export class TSBuffer<Proto extends TSBufferProto = TSBufferProto> {

    private _validator: TSBufferValidator<Proto>;
    private _encoder: Encoder;
    private _decoder: Decoder;
    private _proto: Proto;

    /** @internal 默认配置 */
    private _options: TSBufferOptions = {
        excessPropertyChecks: true,
        strictNullChecks: false,
        skipEncodeValidate: false,
        skipDecodeValidate: false,
        cloneProto: true,
    }

    constructor(proto: Proto, options?: Partial<TSBufferOptions>) {
        // but `options.validatorOptions` has higher priority to validate process (don't affect encode)
        this._options = {
            ...this._options,
            ...options
        }

        this._proto = this._options.cloneProto ? Object.merge({}, proto) : proto;
        Object.assign(this._proto, Object.merge({}, options?.customTypes));

        this._validator = new TSBufferValidator(this._proto, {
            excessPropertyChecks: this._options.excessPropertyChecks,
            strictNullChecks: this._options.strictNullChecks,
            cloneProto: false
        });
        this.validate = this._validator.validate.bind(this._validator);
        this.prune = this._validator.prune.bind(this._validator);

        this._encoder = new Encoder({
            validator: this._validator,
            // if !strictNullChecks, then encoder can convert null to undefined
            nullAsUndefined: !this._options.strictNullChecks
        });

        this._decoder = new Decoder({
            validator: this._validator,
            // if !strictNullChecks, then decoder can convert undefined to null
            undefinedAsNull: !this._options.strictNullChecks
        });
    }

    /**
     * 编码
     * @param value - 要编码的值
     * @param schemaOrId - Schema 或 SchemaID，例如`a/b.ts`下的`Test`类型，其ID为`a/b/Test`
     */
    encode(value: any, schemaOrId: string | TSBufferSchema, options?: EncodeOptions): EncodeOutput {
        let schema: TSBufferSchema;
        if (typeof schemaOrId === 'string') {
            schema = this._proto[schemaOrId];
            if (!schema) {
                return { isSucc: false, errMsg: `Cannot find schema： ${schemaOrId}` };
            }
        }
        else {
            schema = schemaOrId
        }

        // validate before encode
        if (!(options?.skipValidate ?? this._options.skipEncodeValidate)) {
            let vRes = this._validator.validate(value, schema, {
                // 禁用excessPropertyChecks，因为不会编码excess property
                excessPropertyChecks: false
            });
            if (!vRes.isSucc) {
                return vRes;
            }
        }

        let buf: Uint8Array | undefined;
        try {
            buf = this._encoder.encode(value, schema);
        }
        catch (e) {
            return { isSucc: false, errMsg: e.message }
        }

        return { isSucc: true, buf: buf };
    }

    /**
     * 解码
     * @param buf - 待解码的二进制数据
     * @param schemaOrId - Schema 或 SchemaID，例如`a/b.ts`下的`Test`类型，其ID为`a/b/Test`
     */
    decode<T = unknown>(buf: Uint8Array, schemaOrId: string | TSBufferSchema, options?: DecodeOptions): DecodeOutput<T> {
        let schema: TSBufferSchema;
        if (typeof schemaOrId === 'string') {
            schema = this._proto[schemaOrId];
            if (!schema) {
                return { isSucc: false, errMsg: `Cannot find schema： ${schemaOrId}` }
            }
        }
        else {
            schema = schemaOrId
        }

        let value: T;
        try {
            value = this._decoder.decode(buf, schema) as T;
        }
        catch (e) {
            return { isSucc: false, errMsg: e.message };
        }

        if (!(options?.skipValidate ?? this._options.skipDecodeValidate)) {
            let vRes = this._validator.validate(value, schema);
            if (!vRes.isSucc) {
                return vRes;
            }
        }

        return { isSucc: true, value: value };
    }

    /**
     * 编码为 JSON Object，根据协议将 JSON 不支持的格式（如 ArrayBuffer、Date、ObjectId）转换成 JSON 可传输的格式
     * @param value 
     * @param schemaOrId 
     * @param options 
     */
    encodeJSON(value: any, schemaOrId: string | TSBufferSchema, options?: EncodeOptions): EncodeJsonOutput {
        let schema: TSBufferSchema;
        if (typeof schemaOrId === 'string') {
            schema = this._proto[schemaOrId];
            if (!schema) {
                return { isSucc: false, errMsg: `Cannot find schema： ${schemaOrId}` };
            }
        }
        else {
            schema = schemaOrId
        }

        // validate before encode
        if (!(options?.skipValidate ?? this._options.skipEncodeValidate)) {
            let vRes = this._validator.prune(value, schema);
            if (!vRes.isSucc) {
                return vRes;
            }
            value = vRes.pruneOutput;
        }

        // TODO schema 里没有 Buffer 和 Custom 的自动跳过

        let json: any | undefined;
        try {
            json = this._encoder.encodeJSON(value, schema);
        }
        catch (e) {
            return { isSucc: false, errMsg: e.message }
        }

        return { isSucc: true, json: json };
    }

    /**
     * 从 JSON Object 解码，根据协议将 ArrayBuffer、Date、ObjectId 等类型从 JSON 中还原
     * @param json - JSON Object (是 JSON 对象，而非 JSON 字符串)
     * @param schemaOrId 
     * @param options 
     */
    decodeJSON<T = unknown>(json: any, schemaOrId: string | TSBufferSchema, options?: DecodeOptions): DecodeOutput<T> {
        let schema: TSBufferSchema;
        if (typeof schemaOrId === 'string') {
            schema = this._proto[schemaOrId];
            if (!schema) {
                return { isSucc: false, errMsg: `Cannot find schema： ${schemaOrId}` }
            }
        }
        else {
            schema = schemaOrId
        }

        // TODO schema 里没有 Buffer 和 Custom 的自动跳过

        let value: T;
        try {
            value = this._decoder.decodeJSON(json, schema) as T;
        }
        catch (e) {
            return { isSucc: false, errMsg: e.message };
        }

        if (!(options?.skipValidate ?? this._options.skipDecodeValidate)) {
            let vRes = this._validator.prune(value, schema);
            if (!vRes.isSucc) {
                return vRes;
            }
            return { isSucc: true, value: vRes.pruneOutput };
        }

        return { isSucc: true, value: value };
    }

    validate: TSBufferValidator<Proto>['validate'];

    prune: TSBufferValidator<Proto>['prune'];

}

/** @public */
export type EncodeOutput = {
    isSucc: true,
    /** Encoded binary buffer */
    buf: Uint8Array,
    errMsg?: undefined
} | {
    isSucc: false,
    /** Error message */
    errMsg: string,
    buf?: undefined
};
/** @public */
export type DecodeOutput<T> = {
    isSucc: true,
    /** Decoded value */
    value: T,
    errMsg?: undefined
} | {
    isSucc: false,
    /** Error message */
    errMsg: string,
    value?: undefined
};

/** @public */
export type EncodeJsonOutput = {
    isSucc: true,
    /** Encoded JSON Object */
    json: any,
    errMsg?: undefined
} | {
    isSucc: false,
    /** Error message */
    errMsg: string,
    json?: undefined
};