

const Utf8CoderJS: IUtf8Coder = {
    measureLength: str => {
        let len = 0,
            c = 0;
        for (let i = 0; i < str.length; ++i) {
            c = str.charCodeAt(i);
            if (c < 128)
                len += 1;
            else if (c < 2048)
                len += 2;
            else if ((c & 0xFC00) === 0xD800 && (str.charCodeAt(i + 1) & 0xFC00) === 0xDC00) {
                ++i;
                len += 4;
            } else
                len += 3;
        }
        return len;
    },
    write: (str, buf, pos) => {
        let start = pos,
            c1, // character 1
            c2; // character 2
        for (let i = 0; i < str.length; ++i) {
            c1 = str.charCodeAt(i);
            if (c1 < 128) {
                buf[pos++] = c1;
            } else if (c1 < 2048) {
                buf[pos++] = c1 >> 6 | 192;
                buf[pos++] = c1 & 63 | 128;
            } else if ((c1 & 0xFC00) === 0xD800 && ((c2 = str.charCodeAt(i + 1)) & 0xFC00) === 0xDC00) {
                c1 = 0x10000 + ((c1 & 0x03FF) << 10) + (c2 & 0x03FF);
                ++i;
                buf[pos++] = c1 >> 18 | 240;
                buf[pos++] = c1 >> 12 & 63 | 128;
                buf[pos++] = c1 >> 6 & 63 | 128;
                buf[pos++] = c1 & 63 | 128;
            } else {
                buf[pos++] = c1 >> 12 | 224;
                buf[pos++] = c1 >> 6 & 63 | 128;
                buf[pos++] = c1 & 63 | 128;
            }
        }
        return pos - start;
    },
    read: (buf, pos, length) => {
        if (length < 1)
            return "";
        let parts: string[] | undefined = undefined,
            chunk = [],
            i = 0, // char offset
            t;     // temporary
        let end = pos + length;
        while (pos < end) {
            t = buf[pos++];
            if (t < 128)
                chunk[i++] = t;
            else if (t > 191 && t < 224)
                chunk[i++] = (t & 31) << 6 | buf[pos++] & 63;
            else if (t > 239 && t < 365) {
                t = ((t & 7) << 18 | (buf[pos++] & 63) << 12 | (buf[pos++] & 63) << 6 | buf[pos++] & 63) - 0x10000;
                chunk[i++] = 0xD800 + (t >> 10);
                chunk[i++] = 0xDC00 + (t & 1023);
            } else
                chunk[i++] = (t & 15) << 12 | (buf[pos++] & 63) << 6 | buf[pos++] & 63;
            if (i > 8191) {
                (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
                i = 0;
            }
        }
        if (parts) {
            if (i)
                parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
            return parts.join("");
        }
        return String.fromCharCode.apply(String, chunk.slice(0, i));
    }
}
const Utf8CoderNode: IUtf8Coder = {
    measureLength: str => Buffer.byteLength(str, 'utf-8'),
    write: (str: string, buf: Uint8Array, pos: number) => Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength).write(str, pos, 'utf-8'),
    read: (buf: Uint8Array, pos: number, length: number) => Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength).toString('utf-8', pos, pos + length)
}

/** @internal */
interface IUtf8Coder {
    measureLength: (str: string) => number,
    /** 返回编码后的长度 */
    write: (str: string, buf: Uint8Array, pos: number) => number,
    read: (buf: Uint8Array, pos: number, length: number) => string
}

/**
 * 自动判断环境，选择使用NodeJS Native方法编码或是JS编码
 */
export const Utf8Coder: IUtf8Coder = typeof Buffer !== 'undefined' && Buffer.from && Buffer.prototype.write ? Utf8CoderNode : Utf8CoderJS;