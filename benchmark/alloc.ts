import 'k8w-extend-native';

console.log('写Buffer性能测试')

function test(str: string, fun: Function) {
    let times = 1;
    let startTime = process.uptime();
    for (let i = 0; i < times; ++i) {
        fun();
    }
    console.log(str, (process.uptime() - startTime) * 1000 / times + 'ms');
}

let srcBuf1M!: Uint8Array;
test('一次写100万', () => {
    let buf = new ArrayBuffer(1000 * 1000);
    srcBuf1M = new Uint8Array(buf);
    for (let i = 0; i < buf.byteLength; ++i) {
        srcBuf1M[i] = i & 255;
    }
});

test('一次复制100万', () => {
    new Uint8Array(1000 * 1000).set(srcBuf1M);
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
    for (let i = 0; i < 1000; ++i) {
        new Uint8Array(src)
    }
});

let srcBuf = new Uint8Array(src);
test('1000次分配并复制长1000的Buffer', () => {
    for (let i = 0; i < 1000; ++i) {
        new Uint8Array(1000).set(srcBuf)
    }
})

test('分配1000次Buffer', () => {
    let arr = [];
    for (let i = 0; i < 1000; ++i) {
        let buf = new Uint8Array(1000);
        buf[0] = 123;
        arr.push(buf)
    }
})