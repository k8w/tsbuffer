import * as assert from 'assert';
import { TSBufferSchemaGenerator } from 'tsbuffer-schema-generator';
import { TSBuffer } from '../..';

describe('Interface', function () {
    it('property', async function () {
        let proto = await new TSBufferSchemaGenerator({
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

        assert.equal(tsb.encode({ a: '哈哈' }, 'a', 'b').length, 9);
        assert.equal(tsb.encode({ a: '哈哈', b: undefined }, 'a', 'b').length, 9);
        assert.equal(tsb.encode({ a: '哈哈', b: 'random' }, 'a', 'b').length, 12);
        assert.equal(tsb.encode({ a: '哈哈', b: 123456 }, 'a', 'b').length, 20);
        assert.equal(tsb.encode({ a: '哈哈', e: { a: '0'.repeat(1000), b: '哈哈' } }, 'a', 'b').length, 22);

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
            assert.deepStrictEqual(tsb.decode(tsb.encode(v, 'a', 'b'), 'a', 'b'), v);
        });
        assert.deepStrictEqual(tsb.decode(tsb.encode({ a: 'xxxx', b: undefined }, 'a', 'b'), 'a', 'b'), { a: 'xxxx' });
    })

    it('indexSignature', function () {

    })

    it('extends', function () {

    })

    it('nested interface', function () {

    })

    it('Pick', function () {

    })

    it('Omit', function () {

    })

    it('Partial', function () {

    })

    it('Overwrite', function () {

    })
})