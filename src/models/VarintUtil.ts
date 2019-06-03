import { LongBits } from './LongBits';
export class VarintUtil {

    // static measureLength(value: number): number{
    //     if (value > 4294967295) {
            
    //     }
    // }

    static measureUint32(uint32Value: number): number {
        return (uint32Value = uint32Value >>> 0) < 128 ? 1
            : uint32Value < 16384 ? 2
                : uint32Value < 2097152 ? 3
                    : uint32Value < 268435456 ? 4
                        : 5
    }

    static encodeUint32(uint32Value: number, arr: Uint8Array, pos: number) {
        while (uint32Value > 127) {
            arr[pos++] = uint32Value & 127 | 128;
            uint32Value >>>= 7;
        }
        arr[pos] = uint32Value;
    }

    static encodeUint64(value: LongBits, arr: Uint8Array, pos: number) {
        while (value.high) {
            arr[pos++] = value.low & 127 | 128;
            value.low = (value.low >>> 7 | value.high << 25) >>> 0;
            value.high >>>= 7;
        }
        while (value.low > 127) {
            arr[pos++] = value.low & 127 | 128;
            value.low = value.low >>> 7;
        }
        arr[pos++] = value.low;
    }

}