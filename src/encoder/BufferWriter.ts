import { Utf8Coder, Utf8Util } from '../models/Utf8Util';
import { Varint64 } from '../models/Varint64';

/**
 * 用Op来串联 next
 * Op包含 function next length
 * 先度量长度再执行编码
 * 一次性编码
 * 使用BufferPool
 * writer.uint32(xx).string(xxx).finish();
 */
export class BufferWriter {

    private _ops: WriteOp[] = [];
    private _utf8: Utf8Coder;

    constructor(utf8?: Utf8Coder) {
        this._utf8 = utf8 || Utf8Util;
    }

    get ops(): WriteOp[] {
        return this._ops;
    }

    clear() {
        this._ops = [];
    }

    push(req: WriteReq): this {
        this._ops.push(this.req2op(req));
        return this;
    }

    req2op(req: WriteReq): WriteOp {
        if (req.type === 'string' || req.type === 'buffer') {
            let valueLength = this.measureLength(req);
            // Length
            this.push({ type: 'varint', value: Varint64.from(valueLength) });
            // Value
            return {
                ...req,
                length: valueLength
            }
        }
        else {
            let length = this.measureLength(req);
            return {
                ...req,
                length: length
            }
        }
    }

    measureLength(req: WriteReq): number {
        switch (req.type) {
            case 'varint':
                return req.value.byteLength;
            case 'string':
                return this._utf8.measureLength(req.value);
            case 'buffer':
                return req.value.byteLength;
            case 'double':
                return 8;
            case 'boolean':
                return 1;
            default:
                return NaN;
        }
    }

    finish(): Uint8Array {
        let byteLength = this._ops.sum(v => v.length);
        let pos = 0;
        let buf = new Uint8Array(byteLength);
        let view = new DataView(buf.buffer);

        for (let op of this._ops) {
            switch (op.type) {
                case 'varint':
                    let newPos = op.value.writeToBuffer(buf, pos);
                    if (newPos !== pos + op.length) {
                        throw new Error(`Error varint measuredLength ${op.length}, actual is ${newPos - pos}, value is ${op.value.toNumber()}`);
                    }
                    break;
                case 'double':
                    view.setFloat64(buf.byteOffset +pos, op.value);
                    break;
                case 'string':
                    let encLen = this._utf8.write(op.value, buf, pos);
                    if (encLen !== op.length) {
                        throw new Error(`Expect ${op.length} bytes but encoded ${encLen} bytes`);
                    }
                    break;
                case 'buffer':
                    buf.subarray(pos, pos + op.length).set(op.value);
                    break;
                case 'boolean':
                    view.setUint8(buf.byteOffset +pos, op.value ? 255 : 0);
                    break;
                default:
                    break;
            }
            pos += op.length;
        }

        return buf;
    }
}

/**
 * 编码类型说明
 * Varint 常规Varint
 * Z-Varint 原数值做ZigZag变换后再Varint编码
 * double 机器码常规编码
 * buffer 原样编码
 * string utf8编码
 * bigint-varint BigInt的Varint编码
 * BigInt64 64位int机器码
 * BigUint64 64位uint机器码
 * Boolean 1或0 （1字节）
 */
export interface WriteNumberReq {
    type: 'double',
    value: number
}
export interface WriteStringReq {
    type: 'string',
    value: string
}
export interface WriteBufferReq {
    type: 'buffer',
    value: Uint8Array
}
export interface WriteBooleanReq {
    type: 'boolean',
    value: boolean
}
export interface WriteVarintReq {
    type: 'varint',
    value: Varint64
}
export type WriteReq = WriteNumberReq | WriteStringReq | WriteBufferReq | WriteBooleanReq | WriteVarintReq;
export type WriteOp = WriteReq & { length: number }