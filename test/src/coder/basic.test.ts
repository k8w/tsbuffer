import * as assert from 'assert';
import { TSBuffer } from '../../../src/TSBuffer';

describe('Basic Encode', function () {
    it('Boolean', function () {
        let tsb = new TSBuffer({
            a: {
                b: {
                    type: 'Boolean'
                }
            }
        });

        assert.deepStrictEqual(tsb.encode(true, 'a', 'b'), Uint8Array.from([255]));
        assert.deepStrictEqual(tsb.encode(false, 'a', 'b'), Uint8Array.from([0]));
    })

    it('Number: double', function () {
        let scalarTypes = [undefined, 'double'] as const;
        for (let scalarType of scalarTypes) {
            let tsb = new TSBuffer({
                a: {
                    b: {
                        type: 'Number',
                        scalarType: scalarType
                    }
                }
            });

            [0, 123.45678, 1.234e64, NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY].forEach(v => {
                let answer = new Uint8Array(8);
                new DataView(answer.buffer).setFloat64(0, v);
                assert.deepStrictEqual(tsb.encode(v, 'a', 'b'), answer);
            })
        }
    });

    it('Number: float', function () {
        let tsb = new TSBuffer({
            a: {
                b: {
                    type: 'Number',
                    scalarType: 'float'
                }
            }
        });

        [0, 123.45678, 1.234e64, NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY].forEach(v => {
            let answer = new Uint8Array(4);
            new DataView(answer.buffer).setFloat32(0, v);
            assert.deepStrictEqual(tsb.encode(v, 'a', 'b'), answer);
        })
    });

    // it('Number: int', function () {
    //     let scalarTypes = ['int', 'uint', 'int32', 'uint32'] as const;
    //     for (let scalarType of scalarTypes) {
    //         let tsb = new TSBuffer({
    //             a: {
    //                 b: {
    //                     type: 'Number',
    //                     scalarType: scalarType
    //                 }
    //             }
    //         });

    //         assert.strictEqual(validator.validate(123, 'a', 'b').isSucc, true);
    //         assert.strictEqual(validator.validate(0.0, 'a', 'b').isSucc, true);

    //         // Unsigned
    //         if (scalarType.startsWith('u') || scalarType.startsWith('fixed')) {
    //             assert.deepStrictEqual(validator.validate(-123, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongScalarType));
    //         }
    //         // Signed
    //         else {
    //             assert.strictEqual(validator.validate(-123, 'a', 'b').isSucc, true);
    //         }

    //         // not BigInt
    //         assert.deepStrictEqual(validator.validate(BigInt(1234), 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongScalarType));

    //         // 小数
    //         assert.deepStrictEqual(validator.validate(1.234, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongScalarType));
    //         assert.deepStrictEqual(validator.validate(-1.234, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongScalarType));
    //     }
    // });

    // it('Number: bigint', function () {
    //     (['bigint', 'bigint64', 'biguint64'] as const).forEach(v => {
    //         let tsb = new TSBuffer({
    //             a: {
    //                 b: {
    //                     type: 'Number',
    //                     scalarType: v
    //                 }
    //             }
    //         });
    //         assert.deepStrictEqual(validator.validate(BigInt(1234), 'a', 'b'), ValidateResult.success);
    //         assert.deepStrictEqual(validator.validate(1234, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongScalarType));
    //         assert.deepStrictEqual(validator.validate(1.234, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongScalarType));
    //         assert.deepStrictEqual(validator.validate(true, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //         assert.deepStrictEqual(validator.validate('', 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //         assert.deepStrictEqual(validator.validate('123', 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));

    //     })
    // })

    // it('String', function () {
    //     let tsb = new TSBuffer({
    //         a: {
    //             b: {
    //                 type: 'String'
    //             }
    //         }
    //     });

    //     assert.strictEqual(validator.validate('asdgasdg', 'a', 'b').isSucc, true);
    //     assert.strictEqual(validator.validate('false', 'a', 'b').isSucc, true);
    //     assert.deepStrictEqual(validator.validate(null, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //     assert.deepStrictEqual(validator.validate(undefined, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //     assert.deepStrictEqual(validator.validate(123, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //     assert.deepStrictEqual(validator.validate({}, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    // })

    // it('Enum', function () {
    //     let tsb = new TSBuffer({
    //         a: {
    //             b: {
    //                 type: 'Enum',
    //                 members: [
    //                     { id: 0, value: 0 },
    //                     { id: 1, value: 1 },
    //                     { id: 2, value: 'ABC' },
    //                 ]
    //             }
    //         }
    //     });

    //     assert.strictEqual(validator.validate(0, 'a', 'b').isSucc, true);
    //     assert.strictEqual(validator.validate(1, 'a', 'b').isSucc, true);
    //     assert.strictEqual(validator.validate('ABC', 'a', 'b').isSucc, true);
    //     assert.deepStrictEqual(validator.validate('0', 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidEnumValue));
    //     assert.deepStrictEqual(validator.validate('1', 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidEnumValue));
    //     assert.deepStrictEqual(validator.validate(123, 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidEnumValue));
    //     assert.deepStrictEqual(validator.validate({}, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //     assert.deepStrictEqual(validator.validate(true, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //     assert.deepStrictEqual(validator.validate(null, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //     assert.deepStrictEqual(validator.validate(undefined, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    // })

    // it('Any', function () {
    //     let tsb = new TSBuffer({
    //         a: {
    //             b: {
    //                 type: 'Any'
    //             }
    //         }
    //     });

    //     assert.strictEqual(validator.validate(true, 'a', 'b').isSucc, true);
    //     assert.strictEqual(validator.validate(null, 'a', 'b').isSucc, true);
    //     assert.strictEqual(validator.validate(undefined, 'a', 'b').isSucc, true);
    //     assert.strictEqual(validator.validate(123, 'a', 'b').isSucc, true);
    //     assert.strictEqual(validator.validate('123', 'a', 'b').isSucc, true);
    //     assert.strictEqual(validator.validate({}, 'a', 'b').isSucc, true);
    // })

    // it('Literal', function () {
    //     let tsb = new TSBuffer({
    //         a: {
    //             b: {
    //                 type: 'Literal',
    //                 literal: '123'
    //             }
    //         }
    //     });
    //     assert.strictEqual(validator.validate('123', 'a', 'b').isSucc, true);
    //     assert.deepStrictEqual(validator.validate(123, 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidLiteralValue));
    //     assert.deepStrictEqual(validator.validate(null, 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidLiteralValue));
    //     assert.deepStrictEqual(validator.validate(undefined, 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidLiteralValue));

    //     validator = new TSBufferValidator({
    //         a: {
    //             b: {
    //                 type: 'Literal',
    //                 literal: 123
    //             }
    //         }
    //     });
    //     assert.strictEqual(validator.validate(123, 'a', 'b').isSucc, true);
    //     assert.deepStrictEqual(validator.validate('123', 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidLiteralValue));

    //     validator = new TSBufferValidator({
    //         a: {
    //             b: {
    //                 type: 'Literal',
    //                 literal: true
    //             }
    //         }
    //     });
    //     assert.strictEqual(validator.validate(true, 'a', 'b').isSucc, true);
    //     assert.deepStrictEqual(validator.validate(1, 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidLiteralValue));

    //     validator = new TSBufferValidator({
    //         a: {
    //             b: {
    //                 type: 'Literal',
    //                 literal: null
    //             }
    //         }
    //     });
    //     assert.strictEqual(validator.validate(null, 'a', 'b').isSucc, true);
    //     assert.deepStrictEqual(validator.validate(undefined, 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidLiteralValue));

    //     validator = new TSBufferValidator({
    //         a: {
    //             b: {
    //                 type: 'Literal',
    //                 literal: undefined
    //             }
    //         }
    //     });
    //     assert.strictEqual(validator.validate(undefined, 'a', 'b').isSucc, true);
    //     assert.deepStrictEqual(validator.validate(null, 'a', 'b'), ValidateResult.error(ValidateErrorCode.InvalidLiteralValue));
    // })

    // it('NonPrimitive', function () {
    //     let tsb = new TSBuffer({
    //         a: {
    //             b: {
    //                 type: 'NonPrimitive'
    //             }
    //         }
    //     });

    //     assert.strictEqual(validator.validate({ a: 1 }, 'a', 'b').isSucc, true);
    //     assert.strictEqual(validator.validate([1, 2, 3], 'a', 'b').isSucc, true);
    //     assert.deepStrictEqual(validator.validate(null, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //     assert.deepStrictEqual(validator.validate(undefined, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //     assert.deepStrictEqual(validator.validate(123, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //     assert.deepStrictEqual(validator.validate(true, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //     assert.deepStrictEqual(validator.validate('123', 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    // })

    // it('Buffer', function () {
    //     let tsb = new TSBuffer({
    //         a: {
    //             b: {
    //                 type: 'Buffer'
    //             },
    //             c: {
    //                 type: 'Buffer',
    //                 arrayType: 'xxx' as any
    //             }
    //         }
    //     });

    //     assert.throws(() => {
    //         validator.validate(new Uint16Array(1), 'a', 'c');
    //     })

    //     assert.strictEqual(validator.validate(new ArrayBuffer(10), 'a', 'b').isSucc, true);
    //     assert.deepStrictEqual(validator.validate(new Uint8Array(10), 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //     assert.deepStrictEqual(validator.validate(null, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //     assert.deepStrictEqual(validator.validate(undefined, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //     assert.deepStrictEqual(validator.validate(123, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //     assert.deepStrictEqual(validator.validate(true, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //     assert.deepStrictEqual(validator.validate('123', 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //     assert.deepStrictEqual(validator.validate({}, 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //     assert.deepStrictEqual(validator.validate([], 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));

    //     let typedArrays = ['Int8Array', 'Int16Array', 'Int32Array', 'BigInt64Array', 'Uint8Array', 'Uint16Array', 'Uint32Array', 'BigUint64Array', 'Float32Array', 'Float64Array'] as const;
    //     for (let arrayType of typedArrays) {
    //         validator = new TSBufferValidator({
    //             a: {
    //                 b: {
    //                     type: 'Buffer',
    //                     arrayType: arrayType
    //                 }
    //             }
    //         });

    //         let typedArray = eval(arrayType);
    //         assert.strictEqual(validator.validate(new typedArray(10), 'a', 'b').isSucc, true);
    //         assert.deepStrictEqual(validator.validate(new ArrayBuffer(10), 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //         if (arrayType !== 'Uint8Array') {
    //             assert.deepStrictEqual(validator.validate(new Uint8Array(10), 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //         }
    //         else {
    //             assert.deepStrictEqual(validator.validate(new Uint16Array(10), 'a', 'b'), ValidateResult.error(ValidateErrorCode.WrongType));
    //         }
    //     }
    // })
})