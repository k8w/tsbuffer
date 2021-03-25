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

        assert.equal(tsb.encode({ a: 'abc' }, 'a/b').buf!.length, 8);
        assert.equal(tsb.encode({ b: 23 }, 'a/b').buf!.length, 12);
        assert.equal(tsb.encode({ b: 23, c: true }, 'a/b').buf!.length, 16);

        tsb.encode({ a: 'asdg', b: 12412, c: false }, 'a/b2');

        [
            { a: 'a' },
            { b: 12 },
            { c: true },
            { a: 'asdg', b: 12412, c: false }
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b1').buf!, 'a/b1').value, v);
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b2').buf!, 'a/b2').value, v);
        });

        assert.deepStrictEqual(tsb.decode(tsb.encode(null, 'a/b2').buf!, 'a/b2').value, null);
        assert.deepStrictEqual(tsb.decode(tsb.encode([null], 'a/arr').buf!, 'a/arr').value, [null]);
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
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
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

        assert.equal(tsb.encode({ a: 'abc', b: 123, c: 'asdfasdf' }, 'a/b').buf!.length, 21);

        [
            { a: 'asdgasdg', b: 1234567890, c: 'asdfasdf' }
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b1').buf!, 'a/b1').value, v);
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b2').buf!, 'a/b2').value, v);
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
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
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
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b1').buf!, 'a/b1').value, v);
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
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b').buf!, 'a/b').value, v);
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b1').buf!, 'a/b1').value, v);
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b2').buf!, 'a/b2').value, v);
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
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/a').buf!, 'a/a1').value, v);

            let v1 = Object.assign({}, v, { d: [true, false] });
            assert.deepStrictEqual(tsb.decode(tsb.encode(v1, 'a/a1').buf!, 'a/a').value, v);
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

        assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/a').buf!, 'a/a1').value, v);
        assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/a1').buf!, 'a/a').value, v);
        assert.deepStrictEqual(tsb.decode(tsb.encode(v1, 'a/a1').buf!, 'a/a').value, v);
    })
})