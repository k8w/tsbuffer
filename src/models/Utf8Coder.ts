declare let Buffer: any;

/**!
 * From [protobuf.js](https://github.com/protobufjs/protobuf.js/blob/master/lib/utf8/index.js)
 */
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
        if (length < 1) {
            return "";
        }

        let str = "";
        for (let i = pos, end = pos + length; i < end;) {
            let t = buf[i++];
            if (t <= 0x7F) {
                str += String.fromCharCode(t);
            } else if (t >= 0xC0 && t < 0xE0) {
                str += String.fromCharCode((t & 0x1F) << 6 | buf[i++] & 0x3F);
            } else if (t >= 0xE0 && t < 0xF0) {
                str += String.fromCharCode((t & 0xF) << 12 | (buf[i++] & 0x3F) << 6 | buf[i++] & 0x3F);
            } else if (t >= 0xF0) {
                let t2 = ((t & 7) << 18 | (buf[i++] & 0x3F) << 12 | (buf[i++] & 0x3F) << 6 | buf[i++] & 0x3F) - 0x10000;
                str += String.fromCharCode(0xD800 + (t2 >> 10));
                str += String.fromCharCode(0xDC00 + (t2 & 0x3FF));
            }
        }

        return str;
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