import * as assert from 'assert';
import { Utf8Coder } from '../../src/models/Utf8Coder';

describe('Utf8Coder', function () {
    it('measureLength', function () {
        let str = 'test'.repeat(1000);
        assert.strictEqual(Utf8Coder.measureLength(str), Buffer.byteLength(str, 'utf-8'));
    })

    it('encode & decode', function () {
        let str = 'test'.repeat(1);

        let jsLength = Utf8Coder.measureLength(str);
        let jsBuf = new Uint8Array(jsLength + 10);
        let nodeBuf = new Uint8Array(jsLength + 10);

        // same written length
        assert.strictEqual(
            Utf8Coder.write(str, jsBuf, 5),
            Buffer.from(nodeBuf.buffer, nodeBuf.byteOffset, nodeBuf.byteLength).write(str, 5, 'utf-8')
        );

        assert.deepStrictEqual(jsBuf, nodeBuf);

        assert.strictEqual(Utf8Coder.read(jsBuf, 5, jsLength), str);
        assert.strictEqual(Utf8Coder.read(nodeBuf, 5, jsLength), str);
        assert.strictEqual(Buffer.from(nodeBuf.buffer, nodeBuf.byteOffset, nodeBuf.byteLength).toString('utf-8', 5, 5 + jsLength), str);
        assert.strictEqual(Buffer.from(jsBuf.buffer, jsBuf.byteOffset, jsBuf.byteLength).toString('utf-8', 5, 5 + jsLength), str);
    })
})