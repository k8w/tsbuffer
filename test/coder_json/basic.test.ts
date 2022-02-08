import assert from 'assert';
import { TSBufferProtoGenerator } from 'tsbuffer-proto-generator';
import { SchemaType } from 'tsbuffer-schema';
import { TSBuffer } from '../../src/index';

describe('Basic Encode', function () {
    it('Boolean', function () {
        let tsb = new TSBuffer({
            'a/b': {
                type: SchemaType.Boolean
            }
        });

        // decode
        [true, false].forEach(v => {
            assert.strictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b').json!)), 'a/b').value, v);
        });
    });

    it('Number: double', function () {
        let scalarTypes = [undefined, 'double'] as const;
        for (let scalarType of scalarTypes) {
            let tsb = new TSBuffer({
                'a/b': {
                    type: SchemaType.Number,
                    scalarType: scalarType
                }
            });

            // decode
            [0, 123.45678, 1.234e64, Number.MAX_VALUE, Number.MAX_SAFE_INTEGER].forEach(v => {
                assert.strictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b').json!)), 'a/b').value, v);
            });
        }
    });

    it('Number: int', function () {
        let tsb = new TSBuffer({
            'a/b': {
                type: SchemaType.Number,
                scalarType: 'int'
            }
        });

        [0, 1234567890123, -1234567890123].forEach(v => {
            assert.strictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b').json!)), 'a/b').value, v);
        });
    });

    it('Number: uint', function () {
        let tsb = new TSBuffer({
            'a/b': {
                type: SchemaType.Number,
                scalarType: 'uint'
            }
        });

        [0, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER - 1].forEach(v => {
            assert.strictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b').json!)), 'a/b').value, v);
        });
    });

    it('String', function () {
        let tsb = new TSBuffer({
            'a/b': {
                type: SchemaType.String
            }
        });

        ['', 'abc', '啊啊啊啊啊', '你好中国\nTest123\n~!@@#!%!@#$^&#%*^%&\u1234\u2234'].forEach(v => {
            assert.strictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b').json!)), 'a/b').value, v);
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
            assert.strictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/TestEnum').json!)), 'a/TestEnum').value, v);
        });
    });

    it('Any', function () {
        let tsb = new TSBuffer({
            'a/b': {
                type: SchemaType.Any
            }
        });

        [0, 123, 'abc', true, null, { a: 1, b: '测试', c: [1, 2, 3] }, [1, 2, '3a', 'adf3']].forEach(v => {
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b').json!)), 'a/b').value, v);
        });
    });

    it('Object', function () {
        let tsb = new TSBuffer({
            'a/b': {
                type: SchemaType.Object
            }
        });

        [{ a: 1, b: '测试', c: [1, 2, 3] }, [1, 2, '3a', 'adf3']].forEach(v => {
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b').json!)), 'a/b').value, v);

        });
    });

    it('Literal', function () {
        let tsb = new TSBuffer({
            'a/v123': {
                type: SchemaType.Literal,
                literal: 123
            },
            'a/vabc': {
                type: SchemaType.Literal,
                literal: 'abc'
            },
            'a/vnull': {
                type: SchemaType.Literal,
                literal: null
            }
        });

        ([['v123', 123], ['vabc', 'abc'], ['vnull', null]] as const).forEach(v => {
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v[1], 'a/' + v[0]).json!)), 'a/' + v[0]).value, v[1]);
        });
    });

    it('Buffer', function () {
        // ArrayBuffer
        let tsb = new TSBuffer({
            'a/b': {
                type: SchemaType.Buffer
            }
        });
        let buf = new Uint8Array([1, 3, 5, 7, 9, 2, 4, 6, 8, 0]);
        let decode = tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(buf.buffer, 'a/b').json!)), 'a/b').value;
        assert.ok(decode instanceof ArrayBuffer)
        assert.deepStrictEqual(new Uint8Array(decode), buf);

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
                    type: SchemaType.Buffer,
                    arrayType: key as keyof typeof typedArrays
                }
            });
            let arrItem = typedArrays[key as keyof typeof typedArrays];

            // 完整的ArrayBuffer试一遍
            let arr1 = new arrItem.type([1, 3, 5, 7, 9, 2, 4, 6, 8, 0]);
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(arr1, 'a/b').json!)), 'a/b').value, arr1, key + ' failed');

            // 使用subarray生成数组
            let value = [1, 3, 5, 7, 9, 2, 4, 6, 8, 0];
            let wholeOri = Array.from({ length: 7 }, () => 0).concat(value).concat(Array.from({ length: 13 }, () => 0))
            let wholeTyped = new arrItem.type(wholeOri);
            let arr = wholeTyped.subarray(7, 7 + value.length);
            assert.deepStrictEqual(arr, new arrItem.type(value));
            // subarray 测试
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(arr, 'a/b').json!)), 'a/b').value, arr, key + ' failed');
        }
    });

    it('Date', function () {
        let tsb = new TSBuffer({
            'a/b': {
                type: SchemaType.Date
            }
        });

        let encoded = tsb.encodeJSON(new Date('2021/5/21'), 'a/b').json!;
        let decoded = tsb.decodeJSON(JSON.parse(JSON.stringify(encoded)), 'a/b').value as Date;
        assert.ok(decoded instanceof Date);
        assert.strictEqual(decoded.getTime(), new Date('2021/5/21').getTime())
    });

    it('Date in interface', function () {
        let tsb = new TSBuffer({
            'a/b': {
                type: SchemaType.Interface,
                properties: [
                    {
                        id: 0,
                        name: 'time',
                        type: {
                            type: SchemaType.Date
                        }
                    }
                ]
            }
        });

        let encoded = tsb.encodeJSON({ time: new Date('2021/5/21') }, 'a/b').json!;
        let decoded = tsb.decodeJSON(JSON.parse(JSON.stringify(encoded)), 'a/b').value as { time: Date };
        assert.ok(decoded.time instanceof Date);
        assert.strictEqual(decoded.time.getTime(), new Date('2021/5/21').getTime())
    })
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