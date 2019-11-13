import * as assert from 'assert';
import { TSBufferProtoGenerator } from 'tsbuffer-proto-generator';
import { TSBuffer } from '../..';

describe('Interface', function () {
    it('property', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export interface b {
                    a: string;
                    b: number | 'random' | undefined,
                    c?: number[];
                    d?: {
                        c1: boolean,
                        c2?: string
                    } ,
                    e?: {a:'${'0'.repeat(1000)}', b: string} | {a:'${'1'.repeat(1000)}', b: number},
                    f?: {a:string} & {b:string}
                }
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        assert.equal(tsb.encode({ a: '哈哈' }, 'a/b', { skipValidate: true }).length, 9);
        assert.equal(tsb.encode({ a: '哈哈', b: undefined }, 'a/b').length, 9);
        assert.equal(tsb.encode({ a: '哈哈', b: 'random' }, 'a/b').length, 13);
        assert.equal(tsb.encode({ a: '哈哈', b: 123456 }, 'a/b').length, 21);
        assert.equal(tsb.encode({ a: '哈哈', e: { a: '0'.repeat(1000), b: '哈哈' } }, 'a/b').length, 22);

        [
            { a: 'xx' },
            { a: 'xxxx', b: 123 },
            { a: 'xxxx', b: 123.456 },
            { a: 'xxxx', b: 'random' },
            { a: 'xxxx', c: [1, 2, 3, 4, 5] },
            { a: 'xxxx', d: { c1: true } },
            { a: 'xxxx', d: { c1: true, c2: 'test123' } },
            { a: 'xxxx', e: { a: '0'.repeat(1000), b: 'abc' } },
            { a: 'xxxx', e: { a: '1'.repeat(1000), b: 60 } },
            { a: 'xxxx', f: { a: 'xxx', b: 'xxx' } },
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b'), 'a/b'), v);
        });
        assert.deepStrictEqual(tsb.decode(tsb.encode({ a: 'xxxx', b: undefined }, 'a/b'), 'a/b'), { a: 'xxxx' });
    })

    it('indexSignature', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export interface b {
                    a: string;
                    [key: string]: string;
                }
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        assert.equal(tsb.encode({ a: '哈哈' }, 'a/b').length, 9);
        assert.equal(tsb.encode({ a: '哈哈', b: 'a' }, 'a/b').length, 14);
        assert.equal(tsb.encode({ a: '哈哈', abc: 'a' }, 'a/b').length, 16);

        [
            { a: 'xx' },
            { a: 'xx', b: '' },
            { a: 'xx', b: 'xx', c: 'xxx', zxvzxcvzxv: 'xxxx' },
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b'), 'a/b'), v);
        });
    })

    it('Must appeared literal not encode', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export interface b {
                    type: 'abcabc',
                    a: string;
                    b?: string;
                }
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        [
            { type: 'abcabc', a: 'xxx' },
            { type: 'abcabc', a: 'xxx', b: 'bbb' },
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b'), 'a/b'), v);
        });
    })

    it('extends', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                interface base1 {
                    v1: 'base1';
                }

                interface base2 {
                    v2: 'base2';
                    [key: string]: string;
                }

                export interface b extends base1, base2 {
                    a: string;
                    [key: string]: string;
                }
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        assert.equal(tsb.encode({ v1: 'base1', v2: 'base2', a: 'xxx' }, 'a/b').length, 6);
        assert.equal(tsb.encode({ v1: 'base1', abc: 'abc', v2: 'base2', a: 'xxx' }, 'a/b').length, 15);
        assert.deepStrictEqual(tsb.encode({ v1: 'base1', v2: 'base2', xx: 'xx', a: 'xxx', }, 'a/b'), new Uint8Array([
            2,
            40,
            3, 120, 120, 120,
            0,
            2, 120, 120,
            2, 120, 120
        ]));

        [
            { v1: 'base1', v2: 'base2', a: 'xxx' },
            // { v1: 'base1', v2: 'base2', a: 'xxx', b: 'ccc' }
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b'), 'a/b'), v);
        });
    })

    it('nested interface', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export interface b {
                    a: {
                        a1: {
                            value: string;
                            time: number;
                            meta?: any;
                        }
                    }
                }
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        [
            {
                a: {
                    a1: {
                        value: 'xxx',
                        time: Date.now()
                    }
                }
            },
            {
                a: {
                    a1: {
                        value: 'xxx',
                        time: Date.now(),
                        meta: {
                            a: 1, b: 2, c: 'xx'
                        }
                    }
                }
            }
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b'), 'a/b'), v);
        });
    })

    it('Pick', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export interface base {
                    a: string;
                    b: number;
                    c?: { value:string }
                }

                export type b = Pick<base, 'a' | 'c'>;
                export type b1 = Pick<Pick<base, 'a'|'b'>, 'a'>;
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        [
            { a: 'xxx' },
            { a: 'xxx', c: { value: 'xxx' } }
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b'), 'a/b'), v);
        });

        [
            { a: 'xxx' }
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b1'), 'a/b1'), v);
        });
    })

    it('Omit', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export interface base {
                    a: string;
                    b: number;
                    c?: { value:string };
                    d:boolean[];
                }

                export type b = Omit<base, 'c' | 'd'>;
                export type b1 = Omit<Omit<base, 'c'|'d'>, 'b'>;
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        [
            { a: 'xxx', b: 123 }
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b'), 'a/b'), v);
        });

        [
            { a: 'xxx' }
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b1'), 'a/b1'), v);
        });
    })

    it('Partial', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export interface base {
                    a: string;
                    b: number;
                    c?: { value:string };
                    d:boolean[];
                }

                export type b = Partial<base>;
                export type b1 = Partial<Partial<base>>;
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        [
            {},
            { a: 'asdg' },
            { a: 'xxx', b: 123 },
            { a: 'xxx', b: 123, c: { value: 'xxx' } },
            { a: 'xxx', b: 123, c: { value: 'xxx' }, d: [true, false] },
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b'), 'a/b'), v);
        });

        [
            {},
            { a: 'asdg' },
            { a: 'xxx', b: 123 },
            { a: 'xxx', b: 123, c: { value: 'xxx' } },
            { a: 'xxx', b: 123, c: { value: 'xxx' }, d: [true, false] },
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b1'), 'a/b1'), v);
        });
    })

    it('Overwrite', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export interface base {
                    a: string;
                    b: string;
                }

                export type b = Overwrite<base, {b: {value: uint}}>;
                export type b1 = Overwrite<b, {a: boolean[], [key: string]: any}>;
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        assert.equal(tsb.encode({ a: 'xxx', b: { value: 123 } }, 'a/b').length, 12);

        [
            { a: 'xxx', b: { value: 1234 } },
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b'), 'a/b'), v);
        });

        [
            {
                a: [true, false, true], b: { value: 1234 }, asdgasdg: 'asdgasdg', asdgasdgasdg: 21351235,
                xxx: {
                    a: 1, b: '2', c: [1, 2, 'asdg']
                },
                ddd: [1, 2, 3, 'aaa'],
                ff: null
            },
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b1'), 'a/b1'), v);
        });
    })

    it('AllowUnknownFields', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export interface b {
                    a: string,
                    b: number,
                    c?: boolean
                }
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        let proto1 = await new TSBufferProtoGenerator({
            readFile: () => `
                export interface b {
                    a: string,
                    b: number,
                    c?: boolean,
                    a1: string[],
                    b1: number[],
                    c1?: boolean[]
                }
            `
        }).generate('a.ts');
        let tsb1 = new TSBuffer(proto1);

        // 新字段不影响旧Proto解码
        [
            { a: 'asdf', b: 123 },
            { a: 'asdf', b: 123, c: true }
        ].forEach(v => {
            let v1 = Object.assign({}, v, { a1: ['asdf'], b1: [1, 2, 3] });
            let v2 = Object.assign({}, v, { a1: ['asdf'], b1: [1, 2, 3], c1: [true, false] });
            assert.deepStrictEqual(tsb.decode(tsb1.encode(v1, 'a/b'), 'a/b'), v);
            assert.deepStrictEqual(tsb.decode(tsb1.encode(v2, 'a/b'), 'a/b'), v);
        });
    })
})