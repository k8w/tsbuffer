import { Utf8Util } from '../src/models/Utf8Util';
import { BufferReader } from '../src/decoder/BufferReader';
console.log('字符串UTF8编码，JS VS NodeJS原生');

let str = 'test'.repeat(1000);

const N = 10000;

console.time('Utf8Util.measureLength')
for (let i = 0; i < N; ++i) {
    Utf8Util.measureLength(str);
}
console.timeEnd('Utf8Util.measureLength')

console.time('NodeJS measureLength')
for (let i = 0; i < N; ++i) {
    Buffer.byteLength(str);
}
console.timeEnd('NodeJS measureLength')

let length = Buffer.byteLength(str);
console.time('Utf8Util.encode')
for (let i = 0; i < N; ++i) {
    Utf8Util.encode(str, new Uint8Array(length), 0);
}
console.timeEnd('Utf8Util.encode')

console.time('NodeJS encode')
for (let i = 0; i < N; ++i) {
    Buffer.from(str, 'utf-8');
}
console.timeEnd('NodeJS encode')

let encodedBuf = Buffer.from(str, 'utf-8');
console.time('Utf8Util.decode')
for (let i = 0; i < N; ++i) {
    Utf8Util.decode(encodedBuf, 0, length);
}
console.timeEnd('Utf8Util.decode')

console.time('NodeJS decode')
for (let i = 0; i < N; ++i) {
    encodedBuf.toString('utf-8');
}
console.timeEnd('NodeJS decode')