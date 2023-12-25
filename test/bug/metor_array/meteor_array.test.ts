import assert from 'assert';
import 'k8w-extend-native';
import { TSBufferProto } from 'tsbuffer-schema';
import { TSBuffer } from '../../../src/index';

describe('Meteor Array Issule', function () {
    it('Array last number (Meteor)', function () {
        let proto: TSBufferProto = {
            "Msggame_holds_push/Msggame_holds_push": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "userId",
                        "type": {
                            "type": "Number"
                        }
                    },
                    {
                        "id": 1,
                        "name": "holds",
                        "type": {
                            "type": "Array",
                            "elementType": {
                                "type": "Number"
                            }
                        }
                    },
                    {
                        "id": 2,
                        "name": "holdsleng",
                        "type": {
                            "type": "Number"
                        }
                    },
                    {
                        "id": 3,
                        "name": "holdsString",
                        "type": {
                            "type": "String"
                        }
                    }
                ]
            }
        }
        let tsbuffer = new TSBuffer(proto);

        const holds = [0, 1, 2, 9, 10, 11, 18, 19, 20, 27, 27, 22, 0, 0];

        const value = {
            userId: 18,
            holds: holds.slice(),
            holdsleng: holds.length,
            holdsString: holds.join()
        };

        const encoded = tsbuffer.encode(Object.merge(value), 'Msggame_holds_push/Msggame_holds_push');
        assert.strictEqual(encoded.isSucc, true);
        const decoded = tsbuffer.decode(encoded.buf!, 'Msggame_holds_push/Msggame_holds_push');
        assert.deepStrictEqual(decoded.value, value);

        const encoded2 = tsbuffer.encodeJSON(Object.merge(value), 'Msggame_holds_push/Msggame_holds_push');
        assert.strictEqual(encoded2.isSucc, true);
        const decoded2 = tsbuffer.decodeJSON(encoded2.json!, 'Msggame_holds_push/Msggame_holds_push');
        assert.deepStrictEqual(decoded2.value, value);

    })
})