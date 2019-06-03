import { assert } from 'chai';
import { Encoder } from '../../../src/encoder/Encoder';

let enc = new Encoder({});

describe('Encoder.measureLength', function () {
    it('Boolean', function () {
        assert.equal(1,1)
        assert.equal(enc.measureLength(true, { type: 'Boolean' }), 1);
    })
})