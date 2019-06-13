import { Varint64 } from '../models/Varint64';
import { Utf8Util } from '../models/Utf8Util';
export class BufferReader {

    private _pos: number = 0;
    private _buf!: Uint8Array;
    private _view!: DataView;

    load(buf: ArrayBuffer, pos: number = 0) {
        this._buf = new Uint8Array(buf);
        this._pos = pos;
        this._view = new DataView(buf);
    }

    readVarint(): Varint64 {
        let varint = Varint64.readFromBuffer(this._buf, this._pos);
        this._pos += varint.byteLength;
        return varint;
    }

    readUint(): number{
        return this.readVarint().toNumber(true);
    }

    readInt(): number{
        return this.readVarint().zzDecode().toNumber();
    }

    readNumber(scalarType: 'int32' | 'uint32' | 'float' | 'double'): number {
        let pos = this._pos;
        switch (scalarType) {
            case 'int32':
                this._pos += 4;
                return this._view.getInt32(pos);
            case 'uint32':
                this._pos += 4;
                return this._view.getUint32(pos);
            case 'float':
                this._pos += 4;
                return this._view.getFloat32(pos);
            case 'double':
                this._pos += 8;
                return this._view.getFloat64(pos);
            default:
                throw new Error(`Error scalarType to read: ${scalarType}`)
        }
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

    readBoolean(): boolean {
        let value = this._view.getUint8(this._pos++);
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
}