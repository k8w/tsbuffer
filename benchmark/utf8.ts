import { Utf8Util } from '../src/models/Utf8Util';

console.log('字符串UTF8编码，JS VS NodeJS原生\n');

let str = 'a'.repeat(20);

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
console.log('\n')

let length = Buffer.byteLength(str);
let toWrite = new Uint8Array(length);
console.time('Utf8Util.write')
for (let i = 0; i < N; ++i) {
    Utf8Util.write(str, toWrite, 0);
}
console.timeEnd('Utf8Util.write')

console.time('NodeJS write')
for (let i = 0; i < N; ++i) {
    Buffer.from(toWrite.buffer, toWrite.byteOffset, toWrite.byteLength).write(str, 'utf-8');
}
console.timeEnd('NodeJS write')
console.log('\n')

let writedBuf = Buffer.from(str, 'utf-8');
console.time('Utf8Util.read')
for (let i = 0; i < N; ++i) {
    Utf8Util.read(writedBuf, 0, length);
}
console.timeEnd('Utf8Util.read')

console.time('NodeJS read')
for (let i = 0; i < N; ++i) {
    writedBuf.toString('utf-8');
}
console.timeEnd('NodeJS read')