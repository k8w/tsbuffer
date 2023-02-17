import { TSBufferProtoGenerator } from '@tsbuffer/proto-generator';
import * as assert from 'assert';
import { TSBuffer } from '../../src/index';

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

        assert.equal(tsb.encode({ a: '哈哈' }, 'a/b', { skipValidate: true }).buf!.length, 9);
        assert.equal(tsb.encode({ a: '哈哈', b: undefined }, 'a/b').buf!.length, 9);
        assert.equal(tsb.encode({ a: '哈哈', b: 'random' }, 'a/b').buf!.length, 12);
        assert.equal(tsb.encode({ a: '哈哈', b: 123456 }, 'a/b').buf!.length, 20);
        assert.equal(tsb.encode({ a: '哈哈', e: { a: '0'.repeat(1000), b: '哈哈' } }, 'a/b').buf!.length, 21);

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
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
        });
        assert.deepStrictEqual(tsb.decode(tsb.encode({ a: 'xxxx', b: undefined }, 'a/b').buf!, 'a/b').value, { a: 'xxxx' });
    })

    it('完整性检查', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export interface b {
                    a: string;
                    b: string;
                }

                export type b1 = Partial<b>;
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        assert.strictEqual(tsb.encode({ a: 'aaa' }, 'a/b').isSucc, false)
        tsb.encode({ a: 'aaa' }, 'a/b1');
        tsb.encode({ b: 'bbb' }, 'a/b1');

        let proto1 = await new TSBufferProtoGenerator({
            readFile: () => `
                export interface b {
                    a: string;
                }

                export type b1 = Partial<b>;
            `
        }).generate('a.ts');
        let tsb1 = new TSBuffer(proto1);
        let buf = tsb1.encode({ a: 'aaa' }, 'a/b').buf!;
        assert.strictEqual(tsb.decode(buf, 'a/b').isSucc, false)
        assert.deepStrictEqual(tsb.decode(buf, 'a/b1').value, { a: 'aaa' });
    })

    it('Pick/Omit加字段，Decoder协议未更新仍旧不读', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export interface b {
                    a: string;
                    b: string;
                    c: string;
                }

                export type b1 = Pick<b, 'a'|'b'>;
                export type b2 = Omit<b, 'c'>;
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        let proto1 = await new TSBufferProtoGenerator({
            readFile: () => `
                export interface b {
                    a: string;
                    b: string;
                    c: string;
                }

                export type b1 = Pick<b, 'a'>;
                export type b2 = Omit<b, 'b'|'c'>;
            `
        }).generate('a.ts');
        let tsb1 = new TSBuffer(proto1);

        let bufB1 = tsb.encode({ a: 'aaa', b: 'bbb' }, 'a/b1').buf!;
        let bufB2 = tsb.encode({ a: 'aaa', b: 'bbb' }, 'a/b2').buf!;
        assert.deepStrictEqual(tsb1.decode(bufB1, 'a/b1').value, { a: 'aaa' });
        assert.deepStrictEqual(tsb1.decode(bufB2, 'a/b2').value, { a: 'aaa' });
    });

    it('Pick/Omit嵌套', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export interface b {
                    a: string;
                    b: string;
                    c: string;
                }

                export type b1 = Pick<Pick<b, 'a'|'b'>, 'a'>;
                export type b2 = Omit<Omit<b,'b'>, 'c'>;
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);
        assert.deepStrictEqual(tsb.decode(tsb.encode({
            a: 'aaa',
            b: 'aaa',
            c: 'aaa'
        }, 'a/b1').buf!, 'a/b1').value, { a: 'aaa' });
        assert.deepStrictEqual(tsb.decode(tsb.encode({
            a: 'aaa',
            b: 'aaa',
            c: 'aaa'
        }, 'a/b2').buf!, 'a/b2').value, { a: 'aaa' });

        assert.deepStrictEqual(tsb.decode(tsb.encode({
            a: 'aaa',
            b: 'aaa',
            c: 'aaa'
        }, 'a/b').buf!, 'a/b1').value, { a: 'aaa' });
        assert.deepStrictEqual(tsb.decode(tsb.encode({
            a: 'aaa',
            b: 'aaa',
            c: 'aaa'
        }, 'a/b').buf!, 'a/b2').value, { a: 'aaa' });
    });

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

        assert.equal(tsb.encode({ a: '哈哈' }, 'a/b').buf!.length, 9);
        assert.equal(tsb.encode({ a: '哈哈', b: 'a' }, 'a/b').buf!.length, 14);
        assert.equal(tsb.encode({ a: '哈哈', abc: 'a' }, 'a/b').buf!.length, 16);

        [
            { a: 'xx' },
            { a: 'xx', b: '' },
            { a: 'xx', b: 'xx', c: 'xxx', zxvzxcvzxv: 'xxxx' },
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
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
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
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

        assert.equal(tsb.encode({ v1: 'base1', v2: 'base2', a: 'xxx' }, 'a/b').buf!.length, 6);
        assert.equal(tsb.encode({ v1: 'base1', abc: 'abc', v2: 'base2', a: 'xxx' }, 'a/b').buf!.length, 15);
        assert.deepStrictEqual(tsb.encode({ v1: 'base1', v2: 'base2', xx: 'xx', a: 'xxx', }, 'a/b').buf, new Uint8Array([
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
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
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
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
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
                export type b3 = Pick<{a:string}&{b:number}&{c?:{value: string}}, 'a'|'c'>
                export type b4 = Pick<({xx2:string}|{xx:string})&{a:string}&{b:number}&{c?:{value: string}}, 'a'|'c'>
                `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        [
            { a: 'xxx' },
            { a: 'xxx', c: { value: 'xxx' } }
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b3').buf!, 'a/b3').value, v);
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b4').buf!, 'a/b4').value, v);
        });

        [
            { a: 'xxx' }
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b1').buf!, 'a/b1').value, v);
        });

        ['a/b', 'a/b3', 'a/b4'].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode({
                a: 'str',
                b: 123,
                c: { value: 'ccc' }
            }, v).buf!, v).value, {
                a: 'str',
                c: { value: 'ccc' }
            });
        })
    })

    it('Pick keyof', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export interface base {
                    a: string;
                    b: number;
                    c?: { value:string }
                }

                export interface obj {
                    a: string,
                    c: string
                }

                export type key1 = 'a' | 'c';
                export type key2 = keyof obj;
                export type key3 = ('a'|'b'|'c')&('a'|'c'|'d');
                export type b = Pick<base, key1>;
                export type b1 = Pick<base, key2>;
                export type b2 = Pick<base, key3>;
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        [
            { a: 'xxx' },
            { a: 'xxx', c: { value: 'xxx' } }
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b1').buf!, 'a/b1').value, v);
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b2').buf!, 'a/b2').value, v);
        });

        ['a/b', 'a/b1', 'a/b2'].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode({
                a: 'str',
                b: 123,
                c: { value: 'ccc' }
            }, v).buf!, v).value, {
                a: 'str',
                c: { value: 'ccc' }
            });
        })
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
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
        });

        [
            { a: 'xxx' }
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b1').buf!, 'a/b1').value, v);
        });

        assert.deepStrictEqual(tsb.decode(tsb.encode({
            a: 'str',
            b: 123,
            c: { value: 'ccc' },
            d: [true, false]
        }, 'a/b').buf!, 'a/b').value, {
            a: 'str',
            b: 123
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
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
        });

        [
            {},
            { a: 'asdg' },
            { a: 'xxx', b: 123 },
            { a: 'xxx', b: 123, c: { value: 'xxx' } },
            { a: 'xxx', b: 123, c: { value: 'xxx' }, d: [true, false] },
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b1').buf!, 'a/b1').value, v);
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
                export type b2 = Overwrite<base, {b?: string}>[];
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        assert.equal(tsb.encode({ a: 'xxx', b: { value: 123 } }, 'a/b').buf!.length, 11);

        [
            { a: 'xxx', b: { value: 1234 } },
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
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
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b1').buf!, 'a/b1').value, v);
        });

        [
            [{
                a: 'sss', b: 'xxx'
            }],
            [{ a: 'xxx' }]
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b2').buf!, 'a/b2').value, v);
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
            assert.deepStrictEqual(tsb.decode(tsb1.encode(v1, 'a/b').buf!, 'a/b').value, v);
            assert.deepStrictEqual(tsb.decode(tsb1.encode(v2, 'a/b').buf!, 'a/b').value, v);
        });
    })

    it('Pick<A|B>', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export interface a1 {
                    type: 'a1',
                    a1?: string,
                    common1?: string,
                    common2?: string,
                }

                export interface a2 {
                    type: 'a2',
                    a2?: string,
                    common1?: string,
                    common2?: string,
                }

                type union = a1 | a2;
                export type TestPick = Pick<union, 'type'>;
                export type TestOmit = Omit<union, 'common1'>;
                export type PickOmit = Pick<TestOmit, 'type'|'common2'>
            `
        }).generate('a.ts');

        let tsb = new TSBuffer(proto);
        assert.deepStrictEqual(tsb.decode(tsb.encode({
            type: 'a1',
            a1: 'asdg',
            a2: 'gdasee',
            common1: 'asdgasdg',
            common2: 'asdgasdg'
        }, 'a/TestPick').buf!, 'a/TestPick').value, { type: 'a1' });
        assert.deepStrictEqual(tsb.decode(tsb.encode({
            type: 'a2',
            a1: 'asdg',
            a2: 'gdasee',
            common1: 'asdgasdg',
            common2: 'asdgasdg'
        }, 'a/union').buf!, 'a/TestPick').value, { type: 'a2' });
        assert.deepStrictEqual(tsb.decode(tsb.encode({
            type: 'a2',
            a1: 'asdg',
            a2: 'gdasee',
            common1: 'asdgasdg',
            common2: 'asdgasdg'
        }, 'a/TestPick').buf!, 'a/union').value, { type: 'a2' });

        assert.deepStrictEqual(tsb.decode(tsb.encode({
            type: 'a1',
            a1: 'asdg',
            a2: 'gegasdgasdg',
            common1: 'asdgasdg',
            common2: 'asdgasdg'
        }, 'a/TestOmit').buf!, 'a/TestOmit').value, {
            type: 'a1',
            a1: 'asdg',
            common2: 'asdgasdg'
        });
        assert.deepStrictEqual(tsb.decode(tsb.encode({
            type: 'a1',
            a1: 'asdg',
            a2: 'gegasdgasdg',
            common1: 'asdgasdg',
            common2: 'asdgasdg'
        }, 'a/union').buf!, 'a/TestOmit').value, {
            type: 'a1',
            a1: 'asdg',
            common2: 'asdgasdg'
        });
        assert.deepStrictEqual(tsb.decode(tsb.encode({
            type: 'a1',
            a1: 'asdg',
            a2: 'gegasdgasdg',
            common1: 'asdgasdg',
            common2: 'asdgasdg'
        }, 'a/TestOmit').buf!, 'a/union').value, {
            type: 'a1',
            a1: 'asdg',
            common2: 'asdgasdg'
        });

        assert.deepStrictEqual(tsb.decode(tsb.encode({
            type: 'a1',
            a1: 'asdg',
            a2: 'gegasdgasdg',
            common1: 'asdgasdg',
            common2: 'asdgasdg'
        }, 'a/PickOmit').buf!, 'a/PickOmit').value, {
            type: 'a1',
            common2: 'asdgasdg'
        });
        assert.deepStrictEqual(tsb.decode(tsb.encode({
            type: 'a1',
            a1: 'asdg',
            a2: 'gegasdgasdg',
            common1: 'asdgasdg',
            common2: 'asdgasdg'
        }, 'a/union').buf!, 'a/PickOmit').value, {
            type: 'a1',
            common2: 'asdgasdg'
        });
        assert.deepStrictEqual(tsb.decode(tsb.encode({
            type: 'a1',
            a1: 'asdg',
            a2: 'gegasdgasdg',
            common1: 'asdgasdg',
            common2: 'asdgasdg'
        }, 'a/PickOmit').buf!, 'a/union').value, {
            type: 'a1',
            common2: 'asdgasdg'
        });
    });

    it('NonNullable', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
export interface Wrapper {
    time: Date,
    value1?: string,
    value2: null | string | undefined,
    value4?: {
        a?: {
            b?: string | null
        } | null
    } | null
}
export type Value3 = string | null | undefined;
export type NonNullable1 = NonNullable<Wrapper['value1']>;
export type NonNullable2 = NonNullable<Wrapper['value2']>;
export type NonNullable3 = NonNullable<Value3>;
export type NonNullable4 = NonNullable<Wrapper['value4']>;
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        ['a/NonNullable1', 'a/NonNullable2', 'a/NonNullable3'].forEach(schemaId => {
            assert.deepStrictEqual(tsb.decode(tsb.encode('AAA', schemaId).buf!, schemaId).value, 'AAA');
        });

        [
            {},
            { a: null },
            { a: {} },
            { a: { b: null } },
            { a: { b: 'ASDF' } },
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/NonNullable4').buf!, 'a/NonNullable4').value, v);
        });
    })
})