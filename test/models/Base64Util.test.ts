import assert from 'assert';
import { Base64Util } from '../../src/models/Base64Util';

let oriBuffer = global.Buffer;

describe('Base64Util', function () {
    it('base64', function () {
        let str = 'ABC QWER !@#$ \n\rAB\tD 中文 ❤❤↑↓"`';
        let base64 = Base64Util.base64Encode(str);
        let decode = Base64Util.base64Decode(base64);
        assert.strictEqual(decode, str);
    });

    it('base64 encode same with atob', function () {
        let str = 'ABC QWER !@#$ \n\rAB\tD 中文 ❤❤↑↓"`';
        let b1 = Base64Util.base64Encode(str);
        (global as any).Buffer = undefined;
        let b2 = Base64Util.base64Encode(str);
        (global as any).Buffer = oriBuffer;
        assert.strictEqual(b1, b2);

        let b3 = Buffer.from(str).toString('base64');
        assert.strictEqual(b3, b2);

        let d1 = Base64Util.base64Decode(b1);
        (global as any).Buffer = undefined;
        let d2 = Base64Util.base64Decode(b2);
        (global as any).Buffer = oriBuffer;
        assert.strictEqual(d1, d2);
        assert.strictEqual(d1, str);
    });

    it('buf', function () {
        let buf = new Uint8Array([1, 2, 3, 4, 5, 255, 254, 253, 252, 251, 250]);
        let base64 = Base64Util.bufferToBase64(buf);
        let decode = Base64Util.base64ToBuffer(base64);
        assert.deepStrictEqual(decode, buf);
    })

    it('buf same with no Buffer', function () {
        let buf = new Uint8Array([1, 2, 3, 4, 5, 255, 254, 253, 252, 251, 250]);

        let b1 = Base64Util.bufferToBase64(buf);
        (global as any).Buffer = undefined;
        let b2 = Base64Util.bufferToBase64(buf);
        (global as any).Buffer = oriBuffer;

        assert.strictEqual(b1, b2);

        let d1 = Base64Util.base64ToBuffer(b1);
        (global as any).Buffer = undefined;
        let d2 = Base64Util.base64ToBuffer(b2);
        (global as any).Buffer = oriBuffer;

        assert.deepStrictEqual(d1, d2);
        assert.deepStrictEqual(d1, buf);
    })
})