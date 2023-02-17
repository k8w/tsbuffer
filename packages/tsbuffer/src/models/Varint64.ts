/** @internal */
export class Varint64 {
    // [high, low]
    uint32s: Uint32Array;

    constructor(high: number, low: number, byteLength?: number) {
        this.uint32s = new Uint32Array([high, low]);
        if (byteLength !== undefined) {
            this._byteLength = byteLength;
        }
    }

    static readonly Zero = new Varint64(0, 0);

    static from(value: number): Varint64 {
        if (value === 0) {
            return this.Zero;
        }

        const sign = value < 0;
        if (sign) {
            value = -value;
        }

        let lo = value >>> 0,
            hi = (value - lo) / 4294967296 >>> 0;
        if (sign) {
            hi = ~hi >>> 0;
            lo = ~lo >>> 0;
            if (++lo > 4294967295) {
                lo = 0;
                if (++hi > 4294967295)
                    hi = 0;
            }
        }

        return new Varint64(hi, lo);
    }

    toNumber(unsigned?: boolean): number {
        if (!unsigned && this.uint32s[0] >>> 31) {
            let low = ~this.uint32s[1] + 1 >>> 0,
                high = ~this.uint32s[0] >>> 0;
            if (!low)
                high = high + 1 >>> 0;
            return -(low + high * 4294967296);
        }
        return this.uint32s[1] + this.uint32s[0] * 4294967296;
    }

    zzEncode() {
        const mask = this.uint32s[0] >> 31;
        this.uint32s[0] = ((this.uint32s[0] << 1 | this.uint32s[1] >>> 31) ^ mask) >>> 0;
        this.uint32s[1] = (this.uint32s[1] << 1 ^ mask) >>> 0;
        return this;
    }

    zzDecode() {
        const mask = -(this.uint32s[1] & 1);
        this.uint32s[1] = ((this.uint32s[1] >>> 1 | this.uint32s[0] << 31) ^ mask) >>> 0;
        this.uint32s[0] = (this.uint32s[0] >>> 1 ^ mask) >>> 0;
        return this;
    }

    private _byteLength?: number;
    get byteLength(): number {
        if (this._byteLength === undefined) {
            const part0 = this.uint32s[1],
                part1 = (this.uint32s[1] >>> 28 | this.uint32s[0] << 4) >>> 0,
                part2 = this.uint32s[0] >>> 24;
            this._byteLength = part2 === 0
                ? part1 === 0
                    ? part0 < 16384
                        ? part0 < 128 ? 1 : 2
                        : part0 < 2097152 ? 3 : 4
                    : part1 < 16384
                        ? part1 < 128 ? 5 : 6
                        : part1 < 2097152 ? 7 : 8
                : part2 < 128 ? 9 : 10;
        }

        return this._byteLength;
    }

    /**
     * 编码
     * @param buf 
     * @param pos 
     * @returns 编码后最新的pos
     */
    writeToBuffer(buf: Uint8Array, pos: number): number {
        while (this.uint32s[0]) {
            buf[pos++] = this.uint32s[1] & 127 | 128;
            this.uint32s[1] = (this.uint32s[1] >>> 7 | this.uint32s[0] << 25) >>> 0;
            this.uint32s[0] >>>= 7;
        }
        while (this.uint32s[1] > 127) {
            buf[pos++] = this.uint32s[1] & 127 | 128;
            this.uint32s[1] = this.uint32s[1] >>> 7;
        }
        buf[pos++] = this.uint32s[1];

        return pos;
    }

    static readFromBuffer(buf: Uint8Array, pos: number): Varint64 {
        const startPos = pos;
        let hi = 0, lo = 0;
        let i = 0;
        if (buf.byteLength - pos > 4) { // fast route (lo)
            for (; i < 4; ++i) {
                // 1st..4th
                lo = (lo | (buf[pos] & 127) << i * 7) >>> 0;
                if (buf[pos++] < 128)
                    return new Varint64(hi, lo, pos - startPos);
            }
            // 5th
            lo = (lo | (buf[pos] & 127) << 28) >>> 0;
            hi = (hi | (buf[pos] & 127) >> 4) >>> 0;
            if (buf[pos++] < 128)
                return new Varint64(hi, lo, pos - startPos);
            i = 0;
        } else {
            for (; i < 3; ++i) {
                /* istanbul ignore if */
                if (pos >= buf.byteLength)
                    throw new Error('Read varint error: index out of range')
                // 1st..3th
                lo = (lo | (buf[pos] & 127) << i * 7) >>> 0;
                if (buf[pos++] < 128)
                    return new Varint64(hi, lo, pos - startPos);
            }
            // 4th
            lo = (lo | (buf[pos++] & 127) << i * 7) >>> 0;
            return new Varint64(hi, lo, pos - startPos);
        }
        if (buf.byteLength - pos > 4) { // fast route (hi)
            for (; i < 5; ++i) {
                // 6th..10th
                hi = (hi | (buf[pos] & 127) << i * 7 + 3) >>> 0;
                if (buf[pos++] < 128)
                    return new Varint64(hi, lo, pos - startPos);
            }
        } else {
            for (; i < 5; ++i) {
                /* istanbul ignore if */
                if (pos >= buf.byteLength)
                    throw new Error('Read varint error: index out of range');
                // 6th..10th
                hi = (hi | (buf[pos] & 127) << i * 7 + 3) >>> 0;
                if (buf[pos++] < 128)
                    return new Varint64(hi, lo, pos - startPos);
            }
        }
        /* istanbul ignore next */
        throw Error("invalid varint encoding");
    }

}