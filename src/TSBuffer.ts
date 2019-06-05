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
        let schema = this._proto[path][symbolName];
        if (!schema) {
            throw new Error(`Cannot find schema ${symbolName} at ${path}`)
        }
        
        return this._encoder.encode(value, schema);
    }
}