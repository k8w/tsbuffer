import { LengthType } from '../models/IdBlockUtil';
import { Utf8Coder } from '../models/Utf8Coder';
import { Varint64 } from '../models/Varint64';
export class BufferReader {

    private _pos = 0;
    private _buf!: Uint8Array;
    private _view!: DataView;

    constructor() {
        
    }

    load(buf: Uint8Array, pos = 0) {
        this._buf = buf;
        this._pos = pos;
        this._view = new DataView(buf.buffer);
    }

    readVarint(): Varint64 {
        const varint = Varint64.readFromBuffer(this._buf, this._pos);
        this._pos += varint.byteLength;
        return varint;
    }

    readUint(): number {
        return this.readVarint().toNumber(true);
    }

    readInt(): number {
        return this.readVarint().zzDecode().toNumber();
    }

    readDouble(): number {
        const pos = this._pos;
        this._pos += 8;
        return this._view.getFloat64(this._buf.byteOffset + pos);
    }

    readString(): string {
        const strByteLength = this.readUint();
        const str = Utf8Coder.read(this._buf, this._pos, strByteLength);
        this._pos += strByteLength;
        return str;
    }

    readBuffer(): Uint8Array {
        const bufByteLength = this.readUint();
        const buf = this._buf.subarray(this._pos, this._pos + bufByteLength);
        this._pos += bufByteLength;
        return buf;
    }

    skip(byteLength: number) {
        this._pos += byteLength;
    }

    skipByLengthType(lengthType: LengthType) {
        if (lengthType === LengthType.Bit64) {
            this._pos += 8;
        }
        else if (lengthType === LengthType.Varint) {
            this.readVarint();
        }
        else if (lengthType === LengthType.LengthDelimited) {
            const bufByteLength = this.readUint();
            this._pos += bufByteLength;
        }
        else if (lengthType === LengthType.IdBlock) {
            this.skipIdBlock();
        }
        else {
            throw new Error('Unknown lengthType: ' + lengthType);
        }
    }

    skipIdBlock() {
        const idNum = this.readUint();
        for (let i = 0; i < idNum; ++i) {
            const id = this.readUint();
            const lengthType = id & 3 as LengthType;
            this.skipByLengthType(lengthType);
        }
    }

    readBoolean(): boolean {
        const value = this._view.getUint8(this._buf.byteOffset + this._pos++);
        if (value === 255) {
            return true;
        }
        else if (value === 0) {
            return false;
        }
        else {
            throw new Error(`Invalid boolean encoding [${value}] at pos ${this._pos - 1}`);
        }
    }

    get unreadByteLength(): number {
        return this._buf.byteLength - this._pos;
    }

    dispose() {
        this._buf = this._view = undefined as any;
    }
}