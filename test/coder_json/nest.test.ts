import * as assert from 'assert';
import { TSBufferProtoGenerator } from 'tsbuffer-proto-generator';
import { TSBuffer } from '../../src/index';

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
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b').json!)), 'a/b').value, v);
        });

        [[], ['a/b', 'c']].forEach(v => {
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/c').json!)), 'a/c').value, v);
        });

        [[], [['a'], ['b', 'b'], ['c', 'c', 'c']]].forEach(v => {
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/d').json!)), 'a/d').value, v);
        });
    })

    it('Tuple', async function () {
        let proto = await new TSBufferProtoGenerator({
            readFile: () => `
                export type b = [number, number, string];
                export type c = [number, string, string?, number?, true?];
            `
        }).generate('a.ts');
        let tsb = new TSBuffer(proto);

        [[1, 0, 'asdg'], [-123, 123.456, '']].forEach(v => {
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/b').json!)), 'a/b').value, v);
        });

        [[123, 'asbc'], [123, 'asdg', 'sgdasdg'], [123.124, 'asdg', 'asdg', 412]].forEach(v => {
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/c').json!)), 'a/c').value, v);
        });

        [[123.124, 'asdg', 'asdg', 412, true]].forEach(v => {
            assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON(v, 'a/c').json!)), 'a/c').value, v);
        });

        assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON([123.124, 'asdg', undefined, undefined], 'a/c').json!)), 'a/c').value, [123.124, 'asdg']);
        // assert.deepStrictEqual(tsb.decodeJSON(JSON.parse(JSON.stringify(tsb.encodeJSON([123.124, 'asdg', undefined, 123, undefined], 'a/c').json!)), 'a/c').value, [123.124, 'asdg', undefined, 123]);
    })
})