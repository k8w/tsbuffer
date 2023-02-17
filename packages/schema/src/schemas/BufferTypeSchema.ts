
/**
 * Buffer type, include `ArrayBuffer` and typed arrays (e.g. `Uint8Array`, `Int32Array`...).
 * 
 * @example
 * ```ts
 * type A = ArrayBuffer;
 * type B = Uint8Array;
 * ```
 */
export interface BufferTypeSchema {
    type: 'Buffer';
    /**
     * 有该字段，代表类型为该字段对应的TypedArray，否则该字段为ArrayBuffer
     */
    arrayType?: 'Int8Array' | 'Int16Array' | 'Int32Array' | 'BigInt64Array' | 'Uint8Array' | 'Uint16Array' | 'Uint32Array' | 'BigUint64Array' | 'Float32Array' | 'Float64Array'
}