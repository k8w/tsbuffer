import { TSBufferProto } from "tsbuffer-schema";
import { Encoder } from './encoder/Encoder';
import { TSBufferValidator } from 'tsbuffer-validator';

export class TSBuffer {

    protected _validator: TSBufferValidator;
    protected _encoder: Encoder;
    protected _proto: TSBufferProto;

    constructor(proto: TSBufferProto) {
        this._proto = proto;
        this._validator = new TSBufferValidator(proto);
        this._encoder = new Encoder(this._validator);
    }

    encode(value: any, path: string, symbolName: string) {
        return this._encoder.encode(value, this._proto[path][symbolName]);
    }
}