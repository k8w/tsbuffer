import * as assert from 'assert';
import { TSBufferProtoGenerator } from 'tsbuffer-proto-generator';
import { TSBuffer } from '../..';

describe('LogicTypes', function () {
    it('A | B', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export type b = {a:string}|{b:number}|{c:boolean};
                export type b1 = ({a:string}|{b:number})|{c:boolean};
                export type b2 = {a:string} | ( {b:number} | {c:boolean} );
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        assert.equal(tsb.encode({ a: 'abc' }, 'a/b').length, 8);
        assert.equal(tsb.encode({ b: 23 }, 'a/b').length, 12);
        assert.equal(tsb.encode({ b: 23, c: true }, 'a/b').length, 16);

        tsb.encode({ a: 'asdg', b: 12412, c: false }, 'a/b2');

        [
            { a: 'a' },
            { b: 12 },
            { c: true },
            { a: 'asdg', b: 12412, c: false }
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b'), 'a/b'), v);
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b1'), 'a/b1'), v);
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b2'), 'a/b2'), v);
        });
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
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b'), 'a/b'), v);
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

        assert.equal(tsb.encode({ a: 'abc', b: 123, c: 'asdfasdf' }, 'a/b').length, 21);

        [
            { a: 'asdgasdg', b: 1234567890, c: 'asdfasdf' }
        ].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b'), 'a/b'), v);
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b1'), 'a/b1'), v);
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b2'), 'a/b2'), v);
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
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b'), 'a/b'), v);
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
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b'), 'a/b'), v);
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b1'), 'a/b1'), v);
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
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b'), 'a/b'), v);
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b1'), 'a/b1'), v);
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b2'), 'a/b2'), v);
        });
    })
})