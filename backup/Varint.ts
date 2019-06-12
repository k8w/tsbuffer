// export class Varint {

//     /** 从高位向低位排列 */
//     private _uint32s!: number[];

//     constructor(uint32s: number[]) {
//         this.set(uint32s);
//     }

//     set(uint32s: number[]) {
//         this._uint32s = [];
//         for (let v of uint32s) {
//             let value = v >>> 0;

//             // 忽略前置的高位空0: 例如 [0,0,1,0,3] 实际写入的是 [1,0,3] 
//             if (!value && !this._uint32s.length) {
//                 continue;
//             }

//             this._uint32s.push(value);    //强制转换为uint32
//         }
//     }

//     static fromUint(uint: number): Varint {
//         if (uint < 0) {
//             throw new Error(`Error uint: ${uint}`)
//         }

//         // 低32位
//         let lo = uint >>> 0;
//         // 高32位
//         let hi = (uint - lo) / 4294967296 >>> 0;

//         return new Varint(hi ? [hi, lo] : [lo]);
//     }

//     static readFromBuffer(buf: Uint8Array, pos: number): { byteLength: number, value: Varint } {
//         throw new Error();
//     }

//     // private static _max
//     get byteLength(): number {
//         // 先计算实际编码Bit数
//         // 第一位最高，计算实际编码长度
//         // 其余后置位，每位占满32位

//         // Math.ceil(Bit/7) 即为实际字节数

//         // let part0 = this.low,
//         //     part1 = (this.low >>> 28 | this.high << 4) >>> 0,
//         //     part2 = this.high >>> 24;
//         // return part2 === 0
//         //     ? part1 === 0
//         //         ? part0 < 16384
//         //             ? part0 < 128 ? 1 : 2
//         //             : part0 < 2097152 ? 3 : 4
//         //         : part1 < 16384
//         //             ? part1 < 128 ? 5 : 6
//         //             : part1 < 2097152 ? 7 : 8
//         //     : part2 < 128 ? 9 : 10;
//     }

//     toNumber(): number {
//         return 123;
//     }

//     writeToBuffer(buf: Uint8Array, pos: number) {
//         throw new Error();
//     }

//     zzEncode(): this {
//         return this
//     }

//     zzDecode(): this {
//         return this;
//     }
// }