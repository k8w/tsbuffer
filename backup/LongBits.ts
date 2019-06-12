/**
 * 64位无符号整数
 */
export class LongBits {
    /** 低32位 */
    low: number;
    /** 高32位 */
    high: number;

    constructor(low: number, high: number) {
        this.low = low >>> 0;
        this.high = high >>> 0;
    }

    static readonly Zero = new LongBits(0, 0);

    static from(value: number): LongBits {
        if (value === 0)
            return this.Zero;
        let sign = value < 0;
        if (sign)
            value = -value;
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
        return new LongBits(lo, hi);
    }

    /**
     * Converts this long bits to a possibly unsafe JavaScript number.
     * @param {boolean} [unsigned=false] Whether unsigned or not
     * @returns {number} Possibly unsafe number
     */
    toNumber(unsigned: boolean): number {
        if (!unsigned && this.high >>> 31) {
            var low = ~this.low + 1 >>> 0,
                high = ~this.high >>> 0;
            if (!low)
                high = high + 1 >>> 0;
            return -(low + high * 4294967296);
        }
        return this.low + this.high * 4294967296;
    }

    zzEncode() {
        let mask = this.high >> 31;
        this.high = ((this.high << 1 | this.low >>> 31) ^ mask) >>> 0;
        this.low = (this.low << 1 ^ mask) >>> 0;
        return this;
    }

    zzDecode() {
        let mask = -(this.low & 1);
        this.low = ((this.low >>> 1 | this.high << 31) ^ mask) >>> 0;
        this.high = (this.high >>> 1 ^ mask) >>> 0;
        return this;
    }

    getVarintLength() {
        let part0 = this.low,
            part1 = (this.low >>> 28 | this.high << 4) >>> 0,
            part2 = this.high >>> 24;
        return part2 === 0
            ? part1 === 0
                ? part0 < 16384
                    ? part0 < 128 ? 1 : 2
                    : part0 < 2097152 ? 3 : 4
                : part1 < 16384
                    ? part1 < 128 ? 5 : 6
                    : part1 < 2097152 ? 7 : 8
            : part2 < 128 ? 9 : 10;
    }

}