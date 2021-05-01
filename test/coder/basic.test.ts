import assert from 'assert';
import { TSBufferProtoGenerator } from 'tsbuffer-proto-generator';
import { TSBuffer } from '../../src/index';

describe('Basic Encode', function () {
    it('Boolean', function () {
        let tsb = new TSBuffer({
            'a/b': {
                type: 'Boolean'
            }
        });

        assert.deepStrictEqual(tsb.encode(true, 'a/b').buf, Uint8Array.from([255]));
        assert.deepStrictEqual(tsb.encode(false, 'a/b').buf, Uint8Array.from([0]));

        // decode
        [true, false].forEach(v => {
            assert.strictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
        });
    });

    it('Number: double', function () {
        let scalarTypes = [undefined, 'double'] as const;
        for (let scalarType of scalarTypes) {
            let tsb = new TSBuffer({
                'a/b': {
                    type: 'Number',
                    scalarType: scalarType
                }
            });

            [0, 123.45678, 1.234567890123456e288, NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY].forEach(v => {
                let answer = new Uint8Array(8);
                new DataView(answer.buffer).setFloat64(0, v);
                assert.deepStrictEqual(tsb.encode(v, 'a/b').buf, answer);
            });

            // decode
            [0, 123.45678, 1.234e64, NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY].forEach(v => {
                assert.strictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
            });
        }
    });

    /* Float32Array set和get 结果有BUG 故暂时不支持float
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
            assert.deepStrictEqual(tsb.encode(v, 'a/b'), answer);
        });

        // decode
        [0, 0.123456, 1.23456e64, NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b'), 'a/b'), v);
        });
    });
    */

    it('Number: int', function () {
        let tsb = new TSBuffer({
            'a/b': {
                type: 'Number',
                scalarType: 'int'
            }
        });

        assert.equal(tsb.encode(60, 'a/b').buf!.length, 1);
        assert.equal(tsb.encode(-60, 'a/b').buf!.length, 1);

        [0, 1234567890123, -1234567890123].forEach(v => {
            assert.strictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
        });
    });

    it('Number: uint', function () {
        let tsb = new TSBuffer({
            'a/b': {
                type: 'Number',
                scalarType: 'uint'
            }
        });

        assert.equal(tsb.encode(60, 'a/b').buf!.length, 1);
        assert.equal(tsb.encode(-60, 'a/b', { skipValidate: true }).buf!.length, 10);

        [0, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER - 1].forEach(v => {
            assert.strictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
        });
    });

    it('String', function () {
        let tsb = new TSBuffer({
            'a/b': {
                type: 'String'
            }
        });

        assert.equal(tsb.encode('', 'a/b').buf!.length, 1);
        assert.equal(tsb.encode('a', 'a/b').buf!.length, 2);
        assert.equal(tsb.encode('啊啊a1', 'a/b').buf!.length, 9);

        ['', 'abc', '啊啊啊啊啊', '你好中国\nTest123\n~!@@#!%!@#$^&#%*^%&\u1234\u2234'].forEach(v => {
            assert.strictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
        });
    });

    it('Enum', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export enum TestEnum {
                    v0,
                    v1,
                    v100 = 100,
                    v101,
                    vf100 = -100,
                    vf99,
                    vabc = 'abc'
                }
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        [TestEnum.v0, TestEnum.v1, TestEnum.v100, TestEnum.v101, TestEnum.vabc, TestEnum.vf100, TestEnum.vf99].forEach(v => {
            assert.equal(tsb.encode(v, 'a/TestEnum').buf!.length, 1);
            assert.strictEqual(tsb.decode(tsb.encode(v, 'a/TestEnum').buf!, 'a/TestEnum').value, v);
        });
    });

    it('Any', function () {
        let tsb = new TSBuffer({
            'a/b': {
                type: 'Any'
            }
        });

        [0, 123, 'abc', true, null, undefined, { a: 1, b: '测试', c: [1, 2, 3] }, [1, 2, '3a', 'adf3']].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
        });
    });

    it('Object', function () {
        let tsb = new TSBuffer({
            'a/b': {
                type: 'Object'
            }
        });

        [{ a: 1, b: '测试', c: [1, 2, 3] }, [1, 2, '3a', 'adf3']].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
        });
    });

    it('Literal', function () {
        let tsb = new TSBuffer({
            'a/v123': {
                type: 'Literal',
                literal: 123
            },
            'a/vabc': {
                type: 'Literal',
                literal: 'abc'
            },
            'a/vnull': {
                type: 'Literal',
                literal: null
            },
            'a/vundef': {
                type: 'Literal',
                literal: undefined
            }
        });

        ([['v123', 123], ['vabc', 'abc'], ['vnull', null], ['vundef', undefined]] as const).forEach(v => {
            assert.equal(tsb.encode(v[1], 'a/' + v[0]).buf!.length, 0);
            assert.deepStrictEqual(tsb.decode(tsb.encode(v[1], 'a/' + v[0]).buf!, 'a/' + v[0]).value, v[1]);
        });
    });

    it('Buffer', function () {
        // ArrayBuffer
        let tsb = new TSBuffer({
            'a/b': {
                type: 'Buffer'
            }
        });
        let buf = new Uint8Array([1, 3, 5, 7, 9, 2, 4, 6, 8, 0]);
        assert.equal(tsb.encode(buf.buffer, 'a/b').buf!.length, 11);
        assert.deepStrictEqual(tsb.decode(tsb.encode(buf.buffer, 'a/b').buf!, 'a/b').value, buf.buffer);

        // TypedArray
        const typedArrays = {
            Int8Array: {
                type: Int8Array,
                itemByteLength: 1
            },
            Int16Array: {
                type: Int16Array,
                itemByteLength: 2
            },
            Int32Array: {
                type: Int32Array,
                itemByteLength: 4
            },
            Uint8Array: {
                type: Uint8Array,
                itemByteLength: 1
            },
            Uint16Array: {
                type: Uint16Array,
                itemByteLength: 2
            },
            Uint32Array: {
                type: Uint32Array,
                itemByteLength: 4
            },
            Float32Array: {
                type: Float32Array,
                itemByteLength: 4
            },
            Float64Array: {
                type: Float64Array,
                itemByteLength: 8
            }
        } as const;
        for (let key in typedArrays) {
            let tsb = new TSBuffer({
                'a/b': {
                    type: 'Buffer',
                    arrayType: key as keyof typeof typedArrays
                }
            });
            let arrItem = typedArrays[key as keyof typeof typedArrays];

            // 完整的ArrayBuffer试一遍
            let arr1 = new arrItem.type([1, 3, 5, 7, 9, 2, 4, 6, 8, 0]);
            assert.equal(tsb.encode(arr1, 'a/b').buf!.length, 1 + 10 * arrItem.itemByteLength);
            assert.deepStrictEqual(tsb.decode(tsb.encode(arr1, 'a/b').buf!, 'a/b').value, arr1, key + ' failed');

            // 使用subarray生成数组
            let value = [1, 3, 5, 7, 9, 2, 4, 6, 8, 0];
            let wholeOri = Array.from({ length: 7 }, () => 0).concat(value).concat(Array.from({ length: 13 }, () => 0))
            let wholeTyped = new arrItem.type(wholeOri);
            let arr = wholeTyped.subarray(7, 7 + value.length);
            assert.deepStrictEqual(arr, new arrItem.type(value));
            // subarray 测试
            assert.equal(tsb.encode(arr, 'a/b').buf!.length, 1 + 10 * arrItem.itemByteLength);
            assert.deepStrictEqual(tsb.decode(tsb.encode(arr, 'a/b').buf!, 'a/b').value, arr, key + ' failed');
        }
    });
});

export enum TestEnum {
    v0,
    v1,
    v100 = 100,
    v101,
    vf100 = -100,
    vf99,
    vabc = 'abc'
}