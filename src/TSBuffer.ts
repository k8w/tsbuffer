import { TSBufferProto } from "tsbuffer-schema";
import { Encoder } from './encoder/Encoder';
import { TSBufferValidator } from 'tsbuffer-validator';
import { Decoder } from "./decoder/Decoder";

export class TSBuffer {

    protected _validator: TSBufferValidator;
    protected _encoder: Encoder;
    protected _decoder: Decoder;
    protected _proto: TSBufferProto;

    constructor(proto: TSBufferProto) {
        this._proto = proto;
        this._validator = new TSBufferValidator(proto);
        this._encoder = new Encoder(this._validator);
        this._decoder = new Decoder(this._validator);
    }

    encode(value: any, path: string, symbolName: string, options?: {
        skipValidate?: boolean
    }) {
        let schema = this._proto[path][symbolName];
        if (!schema) {
            throw new Error(`Cannot find schema ${symbolName} at ${path}`)
        }

        if (!options || !options.skipValidate) {
            let vRes = this._validator.validateBySchema(value, schema);
            if (!vRes.isSucc) {
                throw new Error(`Invalid value: ${vRes.originalError.message}`)
            }
        }

        return this._encoder.encode(value, schema);
    }

    decode(buf: ArrayBuffer, path: string, symbolName: string, options?: {
        skipValidate?: boolean
    }): unknown {
        let schema = this._proto[path][symbolName];
        if (!schema) {
            throw new Error(`Cannot find schema ${symbolName} at ${path}`)
        }

        let value = this._decoder.decode(buf, schema)

        if (!options || !options.skipValidate) {
            let vRes = this._validator.validateBySchema(value, schema);
            if (!vRes.isSucc) {
                throw new Error(`Invalid decoded value: ${vRes.originalError.message}`)
            }
        }

        return value;
    }
}