export class Base64Util {
    static bufferToBase64(buf: Uint8Array): string {
        if (typeof Buffer !== 'undefined') {
            return Buffer.from(buf).toString('base64');
        }

        let base64 = '';
        const len = buf.length;

        for (let i = 0; i < len; i += 3) {
            base64 += base64Chars[buf[i] >> 2];
            base64 += base64Chars[((buf[i] & 3) << 4) | (buf[i + 1] >> 4)];
            base64 += base64Chars[((buf[i + 1] & 15) << 2) | (buf[i + 2] >> 6)];
            base64 += base64Chars[buf[i + 2] & 63];
        }
        if (len % 3 === 2) {
            base64 = base64.substring(0, base64.length - 1) + '=';
        }
        else if (len % 3 === 1) {
            base64 = base64.substring(0, base64.length - 2) + '==';
        }
        return base64;
    }

    static base64ToBuffer(base64: string): Uint8Array {
        if (typeof Buffer !== 'undefined') {
            return new Uint8Array(Buffer.from(base64, 'base64'));
        }

        let bufferLength = base64.length * 0.75, len = base64.length, p = 0;
        let encoded1: number, encoded2: number, encoded3: number, encoded4: number;
        if (base64[base64.length - 1] === '=') {
            bufferLength--;
            if (base64[base64.length - 2] === '=') {
                bufferLength--;
            }
        }
        const buf = new Uint8Array(bufferLength);
        for (let i = 0; i < len; i += 4) {
            encoded1 = lookup[base64.charCodeAt(i)];
            encoded2 = lookup[base64.charCodeAt(i + 1)];
            encoded3 = lookup[base64.charCodeAt(i + 2)];
            encoded4 = lookup[base64.charCodeAt(i + 3)];
            buf[p++] = (encoded1 << 2) | (encoded2 >> 4);
            buf[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
            buf[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
        }
        return buf;
    }
}

/*base64*/
const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
// Use a lookup table to find the index.
const lookup = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
for (let i = 0; i < base64Chars.length; i++) {
    lookup[base64Chars.charCodeAt(i)] = i;
}
/*end*/