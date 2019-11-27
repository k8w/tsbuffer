import * as assert from 'assert';
import { Utf8Util } from '../../src/models/Utf8Util';

describe('Utf8Util', function () {
    it('measureLength', function () {
        let str = 'test'.repeat(1000);
        assert.strictEqual(Utf8Util.measureLength(str), Buffer.byteLength(str, 'utf-8'));
    })

    it('encode & decode', function () {
        let str = 'test'.repeat(1);

        let jsLength = Utf8Util.measureLength(str);
        let jsBuf = new Uint8Array(jsLength + 10);
        Utf8Util.write(str, jsBuf, 5);

        let nodeBuf = new Uint8Array(jsLength + 10);
        Buffer.from(nodeBuf.buffer, nodeBuf.byteOffset, nodeBuf.byteLength).write(str, 5, 'utf-8')

        assert.deepStrictEqual(jsBuf, nodeBuf);

        assert.strictEqual(Utf8Util.read(jsBuf, 5, jsLength), str);
        assert.strictEqual(Utf8Util.read(nodeBuf, 5, jsLength), str);
        assert.strictEqual(Buffer.from(nodeBuf.buffer, nodeBuf.byteOffset, nodeBuf.byteLength).toString('utf-8', 5, 5 + jsLength), str);
        assert.strictEqual(Buffer.from(jsBuf.buffer, jsBuf.byteOffset, jsBuf.byteLength).toString('utf-8', 5, 5 + jsLength), str);
    })
})