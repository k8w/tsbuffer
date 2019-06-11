import * as assert from 'assert';
import { TSBuffer } from '../../../src/TSBuffer';

describe('Basic Encode', function () {
    it('AnyType', function () {
        let tsb = new TSBuffer({
            a: {
                b: {
                    type: 'Any'
                }
            }
        });

        let value = {
            a: 1,
            b: 'test',
            c: [1, 2, 'a', true],
            d: { a: 1 }
        };
        let buf = tsb.encode(value, 'a', 'b');
        assert.equal(buf.length, JSON.stringify(value).length + 1);
    })
})