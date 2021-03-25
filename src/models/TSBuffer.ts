import { TSBufferProto, TSBufferSchema } from "tsbuffer-schema";
import { TSBufferValidator, TSBufferValidatorOptions } from 'tsbuffer-validator';
import { Decoder } from "../decoder/Decoder";
import { Encoder } from '../encoder/Encoder';
import { Utf8Coder, Utf8Util } from './Utf8Util';

/** @public */
export interface TSBufferOptions {
    /**
     * 校验阶段的配置，与编码过程配置相互独立（先校验，再编码）。
     * 将 `Object.assign` 到默认设置上
     * 默认：`{}`
     */
    validatorOptions: Partial<TSBufferValidatorOptions>,

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
        validatorOptions: {},
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
        this._validator = new TSBufferValidator(proto, this._options.validatorOptions);
        this.validate = this._validator.validate.bind(this._validator);
        this.prune = this._validator.prune.bind(this._validator);

        this._encoder = new Encoder({
            validator: this._validator,
            utf8Coder: this._options.utf8Coder,
            // if !strictNullChecks, then encoder can convert null to undefined
            nullAsUndefined: !this._options.validatorOptions.strictNullChecks
        });

        this._decoder = new Decoder({
            validator: this._validator,
            utf8Coder: this._options.utf8Coder,
            // if !strictNullChecks, then decoder can convert undefined to null
            undefinedAsNull: !this._options.validatorOptions.strictNullChecks
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