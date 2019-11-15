import { Varint64 } from '../models/Varint64';
import { Utf8Util } from '../models/Utf8Util';
import { LengthType } from '../models/IdBlockUtil';
export class BufferReader {

    private _pos: number = 0;
    private _buf!: Uint8Array;
    private _view!: DataView;

    load(buf: Uint8Array, pos: number = 0) {
        this._buf = buf;
        this._pos = pos;
        this._view = new DataView(buf.buffer);
    }

    readVarint(): Varint64 {
        let varint = Varint64.readFromBuffer(this._buf, this._pos);
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
        let pos = this._pos;
        this._pos += 8;
        return this._view.getFloat64(this._buf.byteOffset + pos);
    }

    readString(): string {
        let strByteLength = this.readUint();
        let str = Utf8Util.decode(this._buf, this._pos, strByteLength);
        this._pos += strByteLength;
        return str;
    }

    readBuffer(): Uint8Array {
        let bufByteLength = this.readUint();
        let buf = this._buf.subarray(this._pos, this._pos + bufByteLength);
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
            let bufByteLength = this.readUint();
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
        let idNum = this.readUint();
        for (let i = 0; i < idNum; ++i) {
            let id = this.readUint();
            let lengthType = id & 3 as LengthType;
            this.skipByLengthType(lengthType);
        }
    }

    readBoolean(): boolean {
        let value = this._view.getUint8(this._buf.byteOffset + this._pos++);
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