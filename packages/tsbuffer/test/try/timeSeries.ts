import { TSBuffer } from '../src/TSBuffer';
let tsb = new TSBuffer({
    a: {
        b: {
            type: 'Array',
            elementType: {
                type: 'Tuple',
                elementTypes: [
                    { type: 'Number' },
                    { type: 'Number' }
                ]
            }
        }
    }
});


let value = Array.from({ length: 10000 }, (v, i) => [Date.now(), Date.now()]);

console.log('压缩率对比', tsb.encode(value, 'a', 'b').length, JSON.stringify(value).length);

console.time('TSBuffer encode');
for (let i = 0; i < 1000; ++i) {
    tsb.encode(value, 'a', 'b');
}
console.timeEnd('TSBuffer encode');

console.time('JSON stringify');
for (let i = 0; i < 1000; ++i) {
    JSON.stringify(value);
}
console.timeEnd('JSON stringify');