import * as assert from 'assert';
import { Utf8Util } from '../../src/models/Utf8Util';

describe('Utf8Util', function () {
    it('measureLength', function () {
        let str = 'test'.repeat(1000);
        assert.strictEqual(Utf8Util.measureLength(str), Buffer.byteLength(str, 'utf-8'));
    })

    it('encode & decode', function () {
        let str = 'test'.repeat(1000);

        let jsLength = Utf8Util.measureLength(str);
        let jsBuf = new Uint8Array(jsLength);
        Utf8Util.encode(str, jsBuf, 0);

        let nodeBuf = new Uint8Array(Buffer.from(str, 'utf-8'));

        assert.deepStrictEqual(jsBuf, nodeBuf);

        assert.strictEqual(Utf8Util.decode(jsBuf, 0, jsLength), str);
        assert.strictEqual(Utf8Util.decode(nodeBuf, 0, jsLength), str);
        assert.strictEqual(Buffer.from(jsBuf).toString('utf-8'), str);
    })
})