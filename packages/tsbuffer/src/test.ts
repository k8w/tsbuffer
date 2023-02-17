import { Base64Util } from "./models/Base64Util";

const buf = new Uint8Array([1, 3, 5, 7, 9, 2, 4, 6, 8, 0]);

console.log(Base64Util.bufferToBase64(buf));
console.log(Base64Util.bufferToBase64(new Uint8Array(buf.buffer)));
console.log(Buffer.from(buf).toString('base64'))

const buf2 = new Int16Array([1, 3, 5, 7, 9, 2, 4, 6, 8, 0]);
const buf3 = new Uint8Array(buf2.buffer.slice(buf2.byteOffset, buf2.byteOffset + buf2.byteLength));
console.log(Buffer.from(buf2.buffer).toString('base64'))
console.log(Buffer.from(buf3).toString('base64'))
console.log(Base64Util.bufferToBase64(buf3))

declare let Buffer: any;