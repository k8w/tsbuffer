import { TSBuffer } from '../src/TSBuffer';
let tsb = new TSBuffer({
    a: {
        a1: {
            type: 'Number',
            scalarType: 'uint'
        },
        a2: {
            type: 'String'
        }
    }
});

let res = tsb.encode(12345, 'a', 'a1');
let res1 = tsb.encode('哈哈哈abc', 'a', 'a2');
console.log(res);
console.log(res1);