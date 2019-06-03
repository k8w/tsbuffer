import 'k8w-extend-native';

function test(str: string, fun: Function) {
    let times = 1;
    let startTime = process.uptime();
    for (let i = 0; i < times; ++i) {
        fun();
    }
    console.log(str, (process.uptime() - startTime) * 1000 / times + 'ms');
}
test('一次写100万', () => {
    let buf = new ArrayBuffer(1000 * 1000);
    let arr = new Uint8Array(buf);
    for (let i = 0; i < buf.byteLength; ++i) {
        arr[i] = i & 255;
    }
});

let src = Array.from({ length: 1000 }, (v, i) => i & 255);
test('1000次写1000到整Buffer', () => {
    let buf = new ArrayBuffer(1000 * 1000);
    let arr = new Uint8Array(buf);
    for (let i = 0; i < 1000; ++i) {
        arr.set(src, i * 1000);
    }
});

test('1000次写1000到独立Buffer', () => {
    let arr = [];
    for (let i = 0; i < 1000; ++i){
        arr.push(new Uint8Array(src))
    }
});

test('分配1000次Buffer', () => {
    let arr = [];
    for (let i = 0; i < 1000; ++i) {
        arr.push(new Uint8Array(1000))
    }
})