import * as assert from 'assert';
import { TSBufferProtoGenerator } from 'tsbuffer-proto-generator';
import { TSBuffer } from '../../src/index';

describe('LogicTypes', function () {
    it('A | B', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export type b = {a:string}|{b:number}|{c:boolean};
                export type b1 = ({a:string}|{b:number})|{c:boolean};
                export type b2 = {a:string} | ( {b:number} | {c:boolean} ) | null;
                export type item = {a:string} | null;
                export type arr = item[];
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        tsb.encodeJSON({ a: 'asdg', b: 12412, c: false }, 'a/b2');

        [
            { a: 'a' },
            { b: 12 },
            { c: true },
            { a: 'asdg', b: 12412, c: false }
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b').json!)), 'a/b').value, v);
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b1').json!)), 'a/b1').value, v);
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b2').json!)), 'a/b2').value, v);
        });

        assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(null, 'a/b2').json!)), 'a/b2').value, null);
        assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON([null], 'a/arr').json!)), 'a/arr').value, [null]);
    })

    it('Mutual exclustion', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export type b = {type: 'aaaa', valueA: string}
                    | {type:'bbbb', valueB: string}
                    | {type: 'cccc', valueC:string}
                    | {type:'bbbb'|'cccc', valueBC: string};
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        [
            { type: 'aaaa', valueA: 'asdgasdg' },
            { type: 'bbbb', valueB: 'asdgasdg' },
            { type: 'cccc', valueC: 'asdgasdg' },
            { type: 'cccc', valueC: 'asdgasdg', valueBC: 'asdgasdg' },
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b').json!)), 'a/b').value, v);
        });
    })

    it('A & B', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                type A = { a: string };
                type B = { b: number };
                type C = { c: 'asdfasdf' };
                export type b = A & B & C;
                export type b1 = (A & B) & C;
                export type b2 = A & (B & C);
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        [
            { a: 'asdgasdg', b: 1234567890, c: 'asdfasdf' }
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b').json!)), 'a/b').value, v);
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b1').json!)), 'a/b1').value, v);
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b2').json!)), 'a/b2').value, v);
        });
    });

    it('A & (B | C)', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                type A = { a: string };
                type B = { b: number };
                type C = { c: 'asdfasdf' };
                export type b = A & (B | C);
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        [
            { a: 'asdgasdg', b: 1234567890 },
            { a: 'asdgasdg', c: 'asdfasdf' }
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b').json!)), 'a/b').value, v);
        });
    })

    it('(A & B) | C)', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                type A = { a: string };
                type B = { b: number };
                type C = { c: 'asdfasdf' };
                export type b = (A & B) | C;
                export type b1 = A & B | C;
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        [
            { a: 'asdgasdg', b: 1234567890 },
            { c: 'asdfasdf' },
            { a: 'asdgasdg', b: 1234567890, c: 'asdfasdf' },
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b').json!)), 'a/b').value, v);
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b1').json!)), 'a/b1').value, v);
        });
    })

    it('A&B | C&D)', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                type A = { a: string };
                type B = { b: number };
                type C = { c: 'asdfasdf' };
                type D = { d: boolean | null };
                export type b = (A & B) | (C&D);
                export type b1 = A & B | C&D;
                export type b2 = A & B | (C&D);
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        [
            { a: 'asdgasdg', b: 1234567890 },
            { c: 'asdfasdf', d: true },
            { c: 'asdfasdf', d: null },
            { a: 'asdgasdg', b: 1234567890, c: 'asdfasdf', d: null },
            { a: 'asdgasdg', b: 1234567890, c: 'asdfasdf', d: false },
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b').json!)), 'a/b').value, v);
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b1').json!)), 'a/b1').value, v);
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b2').json!)), 'a/b2').value, v);
        });
    })

    it('Unknown Union ID', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export type a = {a:string} | {b:number} | {c:boolean};
                export type a1 = {a:string} | {b:number} | {c:boolean} | {d:boolean[]};
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        [
            { a: 'a' },
            { b: 12 },
            { c: true },
            { a: 'asdg', b: 12412, c: false }
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/a').json!)), 'a/a1').value, v);

            let v1 = Object.assign({}, v, { d: [true, false] });
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v1, 'a/a1').json!)), 'a/a').value, v);
        });
    })

    it('Unknown Intersection ID', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export type a = {a:string} & {b:number} & {c:boolean};
                export type a1 = {a:string} & {b:number} & {c:boolean} & {d?: boolean[]};
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        let v = { a: 'asdg', b: 12412, c: false };
        let v1 = { a: 'asdg', b: 12412, c: false, d: [true, false] };

        assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/a').json!)), 'a/a1').value, v);
        assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/a1').json!)), 'a/a').value, v);
        assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v1, 'a/a1').json!)), 'a/a').value, v);
    })

    it('Partial<Pick>> & { xxx: string }', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export interface Post {
                    _id: string,
                    author: string
                    title: string,
                    content: string,
                    create: { time: Date, uid: string },
                    update?: { time: Date, uid: string },
                }

                export type UpdatePost = Partial<Pick<Post, 'title' | 'content'>> & { _id: string };
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        let v = {
            _id: 'aaa',
            title: 'bbb',
            content: 'ccc'
        };

        let enc = tsb.encodeJSON(v, 'a/UpdatePost');
        let dec = tsb.decodeJSON(JSON.parse(JSON.stringify(enc.json!)), 'a/UpdatePost')
        assert.deepStrictEqual(dec.value, v);

        let enc1 = tsb.encodeJSON({
            title: 'xxx',
            content: 'xxx'
        }, 'a/UpdatePost');
        assert.strictEqual(enc1.errMsg, 'Missing required property `_id`.');


    })

    it('Omit & {a?: string}', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export interface base {
                    a: string;
                    b: number;
                    c?: { value:string };
                    d:boolean[];
                }

                export type b = Omit<base, 'a'| 'c' | 'd'> & {a?: string};
                export type b1 = Omit<base,'c' | 'd'>;
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        [
            { a: 'xxx', b: 123 }
        ].forEach(v => {

            assert.deepStrictEqual(tsb.decodeJSON(tsb.encodeJSON(v, 'a/b').json!, 'a/b').value, v);
        });

        [
            { a: 'xxx', b: 123 }
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decodeJSON(tsb.encodeJSON(v, 'a/b1').json!, 'a/b1').value, v);
        });

        assert.deepStrictEqual(tsb.decodeJSON(tsb.encodeJSON({ a: 'xxx', b: 123 }, 'a/b').json!, 'a/b').value, tsb.decodeJSON(tsb.encodeJSON({ a: 'xxx', b: 123 }, 'a/b1').json!, 'a/b1').value);
    })
})