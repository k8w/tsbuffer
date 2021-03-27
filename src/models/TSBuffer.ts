import { TSBufferProto, TSBufferSchema } from "tsbuffer-schema";
import { TSBufferValidator } from 'tsbuffer-validator';
import { Decoder } from "../decoder/Decoder";
import { Encoder } from '../encoder/Encoder';
import { Utf8Coder, Utf8Util } from './Utf8Util';

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
     *
     * 默认为 `true`
     */
    strictNullChecks: boolean;

    /**
     * 自定义 UTF8 编解码器
     * 默认：本项目自带JS方法
     */
    utf8Coder: Utf8Coder;

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
        strictNullChecks: true,
        utf8Coder: Utf8Util,
        skipEncodeValidate: false,
        skipDecodeValidate: false,
    }

    constructor(proto: Proto, options?: Partial<TSBufferOptions>) {
        // but `options.validatorOptions` has higher priority to validate process (don't affect encode)
        this._options = {
            ...this._options,
            ...options
        }

        this._proto = proto;
        this._validator = new TSBufferValidator(proto, {
            excessPropertyChecks: this._options.excessPropertyChecks,
            strictNullChecks: this._options.strictNullChecks
        });
        this.validate = this._validator.validate.bind(this._validator);
        this.prune = this._validator.prune.bind(this._validator);

        this._encoder = new Encoder({
            validator: this._validator,
            utf8Coder: this._options.utf8Coder,
            // if !strictNullChecks, then encoder can convert null to undefined
            nullAsUndefined: !this._options.strictNullChecks
        });

        this._decoder = new Decoder({
            validator: this._validator,
            utf8Coder: this._options.utf8Coder,
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
    decode(buf: Uint8Array, schemaOrId: string | TSBufferSchema, options?: DecodeOptions): DecodeOutput {
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

        let value: unknown;
        try {
            value = this._decoder.decode(buf, schema);
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
export type DecodeOutput = {
    isSucc: true,
    /** Decoded value */
    value: unknown,
    errMsg?: undefined
} | {
    isSucc: false,
    /** Error message */
    errMsg: string,
    value?: undefined
};