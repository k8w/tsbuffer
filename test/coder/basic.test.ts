import * as assert from 'assert';
import { TSBuffer } from '../../src/TSBuffer';
import { TSBufferSchemaGenerator } from 'tsbuffer-schema-generator';

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

        // decode
        [true, false].forEach(v => {
            assert.strictEqual(tsb.decode(tsb.encode(v, 'a', 'b'), 'a', 'b'), v);
        });
    });

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

            [0, 123.45678, 1.234567890123456e288, NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY].forEach(v => {
                let answer = new Uint8Array(8);
                new DataView(answer.buffer).setFloat64(0, v);
                assert.deepStrictEqual(tsb.encode(v, 'a', 'b'), answer);
            });

            // decode
            [0, 123.45678, 1.234e64, NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY].forEach(v => {
                assert.strictEqual(tsb.decode(tsb.encode(v, 'a', 'b'), 'a', 'b'), v);
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
            assert.deepStrictEqual(tsb.encode(v, 'a', 'b'), answer);
        });

        // decode
        [0, 0.123456, 1.23456e64, NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a', 'b'), 'a', 'b'), v);
        });
    });
    */

    it('Number: int', function () {
        let tsb = new TSBuffer({
            a: {
                b: {
                    type: 'Number',
                    scalarType: 'int'
                }
            }
        });

        assert.equal(tsb.encode(60, 'a', 'b').length, 1);
        assert.equal(tsb.encode(-60, 'a', 'b').length, 1);

        [0, 1234567890123, -1234567890123].forEach(v => {
            assert.strictEqual(tsb.decode(tsb.encode(v, 'a', 'b'), 'a', 'b'), v);
        });
    });

    it('Number: uint', function () {
        let tsb = new TSBuffer({
            a: {
                b: {
                    type: 'Number',
                    scalarType: 'uint'
                }
            }
        });

        assert.equal(tsb.encode(60, 'a', 'b').length, 1);
        assert.equal(tsb.encode(-60, 'a', 'b').length, 10);

        [0, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER - 1].forEach(v => {
            assert.strictEqual(tsb.decode(tsb.encode(v, 'a', 'b'), 'a', 'b'), v);
        });
    });

    it('Number: int32', function () {
        let tsb = new TSBuffer({
            a: {
                b: {
                    type: 'Number',
                    scalarType: 'int32'
                }
            }
        });

        assert.equal(tsb.encode(60, 'a', 'b').length, 4);
        assert.equal(tsb.encode(-60, 'a', 'b').length, 4);

        [0, 2147483647, -2147483647].forEach(v => {
            assert.strictEqual(tsb.decode(tsb.encode(v, 'a', 'b'), 'a', 'b'), v);
        });
    });

    it('Number: uint32', function () {
        let tsb = new TSBuffer({
            a: {
                b: {
                    type: 'Number',
                    scalarType: 'uint32'
                }
            }
        });

        assert.equal(tsb.encode(60, 'a', 'b').length, 4);
        assert.equal(tsb.encode(-60, 'a', 'b').length, 4);

        [0, 4294967295].forEach(v => {
            assert.strictEqual(tsb.decode(tsb.encode(v, 'a', 'b'), 'a', 'b'), v);
        });
    });

    it('String', function () {
        let tsb = new TSBuffer({
            a: {
                b: {
                    type: 'String'
                }
            }
        });

        assert.equal(tsb.encode('', 'a', 'b').length, 1);
        assert.equal(tsb.encode('a', 'a', 'b').length, 2);
        assert.equal(tsb.encode('啊啊a1', 'a', 'b').length, 9);

        ['', 'abc', '啊啊啊啊啊', '你好中国\nTest123\n~!@@#!%!@#$^&#%*^%&\u1234\u2234'].forEach(v => {
            assert.strictEqual(tsb.decode(tsb.encode(v, 'a', 'b'), 'a', 'b'), v);
        });
    });

    it('Enum', async function () {
        let proto = await new TSBufferSchemaGenerator({
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

        console.log(JSON.stringify(proto, null, 2));

        [TestEnum.v0, TestEnum.v1, TestEnum.v100, TestEnum.v101, TestEnum.vabc, TestEnum.vf100, TestEnum.vf99].forEach(v => {
            assert.equal(tsb.encode(v, 'a', 'TestEnum').length, 1);
            assert.strictEqual(tsb.decode(tsb.encode(v, 'a', 'TestEnum'), 'a', 'TestEnum'), v);
        });
    });

    it('Any', function () {

    });

    it('Literal', function () {

    });

    it('NonPrimitive', function () {

    });

    it('Buffer', function () {

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