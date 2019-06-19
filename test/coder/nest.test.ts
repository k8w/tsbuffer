import * as assert from 'assert';
import { TSBuffer } from '../..';
import { TSBufferProtoGenerator } from 'tsbuffer-proto-generator';

describe('Nest', function () {
    it('Array', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export type b = number[];
                export type c = string[];
                export type d = string[][];
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        [[], [1, 2, 3]].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b'), 'a/b'), v);
        });

        [[], ['a/b', 'c']].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/c'), 'a/c'), v);
        });

        [[], [['a'], ['b', 'b'], ['c', 'c', 'c']]].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/d'), 'a/d'), v);
        });
    })

    it('Tuple', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export type b = [number, number, string];
                export type c = [number, string, string?, number?];
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        [[1, 0, 'asdg'], [-123, 123.456, '']].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/b'), 'a/b'), v);
        });

        [[123, 'asbc'], [123, 'asdg', 'sgdasdg'], [123.124, 'asdg', 'asdg', 412]].forEach(v => {
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a/c'), 'a/c'), v);
        });
    })
})