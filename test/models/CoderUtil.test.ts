import assert from 'assert';
import { TSBufferProto } from 'tsbuffer-schema';
import { TSBuffer } from '../../src';
import { CoderUtil } from '../../src/models/CoderUtil';

describe('CoderUtil', function () {
    it('withDate', function () {
        const proto: TSBufferProto = {
            "user/PtlGet/ResGet": {
                "type": "Overwrite",
                "target": {
                    "type": "Interface",
                    "properties": [
                        {
                            "id": 0,
                            "name": "a",
                            "type": {
                                "type": "String"
                            }
                        }
                    ]
                },
                "overwrite": {
                    "type": "Interface",
                    "properties": [
                        {
                            "id": 0,
                            "name": "a",
                            "type": {
                                "type": "Date"
                            }
                        }
                    ]
                }
            },
        }
        const tsbuffer = new TSBuffer(proto);

        assert.strictEqual(CoderUtil.isJsonCompatible(proto['user/PtlGet/ResGet'], 'decode', tsbuffer['_validator'].protoHelper), false);
    })
})