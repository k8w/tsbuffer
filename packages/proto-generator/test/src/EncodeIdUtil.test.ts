import * as assert from 'assert';
import { EncodeIdUtil } from '../../src/EncodeIdUtil';

describe('EncodeIdUtil', function () {
  it('genEncodeIdMap', function () {
    let result = EncodeIdUtil.genEncodeIds(['d', 'e', 'f', 'a', 'b', 'c']);
    assert.deepStrictEqual(result, [
      { key: 'd', id: 0 },
      { key: 'e', id: 1 },
      { key: 'f', id: 2 },
      { key: 'a', id: 3 },
      { key: 'b', id: 4 },
      { key: 'c', id: 5 },
    ]);

    let result1 = EncodeIdUtil.genEncodeIds(
      ['d', 'e', 'f', 'a', 'b', 'c', 'h', 'i', 'j'],
      [
        { key: 'd', id: 1 },
        { key: 'a', id: 4 },
        { key: 'b', id: 5 },
      ]
    );
    assert.deepStrictEqual(result1, [
      { key: 'd', id: 1 },
      { key: 'e', id: 6 },
      { key: 'f', id: 7 },
      { key: 'a', id: 4 },
      { key: 'b', id: 5 },
      { key: 'c', id: 8 },
      { key: 'h', id: 9 },
      { key: 'i', id: 10 },
      { key: 'j', id: 11 },
    ]);
  });

  it('onGenCanOptimized', function () {
    let can = false;
    EncodeIdUtil.onGenCanOptimized = () => {
      can = true;
    };

    EncodeIdUtil.genEncodeIds(
      ['d', 'e', 'f', 'a', 'b', 'c', 'h', 'i', 'j'],
      [
        { key: 'd', id: 1 },
        { key: 'a', id: 4 },
        { key: 'b', id: 25 },
      ]
    );
    assert.strictEqual(can, false);

    EncodeIdUtil.genEncodeIds(
      ['d', 'e', 'f', 'a', 'b', 'c', 'h', 'i', 'j'],
      [
        { key: 'd', id: 1 },
        { key: 'a', id: 4 },
        { key: 'b', id: 26 },
      ]
    );
    assert.strictEqual(can, true);
  });
});
