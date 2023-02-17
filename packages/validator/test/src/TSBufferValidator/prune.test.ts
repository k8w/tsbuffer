import { SchemaType, TSBufferProto } from '@tsbuffer/schema';
import * as assert from 'assert';
import { TSBufferValidator } from '../../../src/TSBufferValidator';

describe('prune', function () {
  const proto: TSBufferProto = require('../../genTestSchemas/output');
  let validator = new TSBufferValidator(proto);

  it('basic interface', function () {
    assert.deepStrictEqual(
      validator.prune({ a: 'aaa', b: 1, c: 'asdg' }, 'interface1/Interface1')
        .pruneOutput,
      { a: 'aaa', b: 1 }
    );
    assert.deepStrictEqual(
      validator.prune(
        { asdg: 234, a: 'aaa', asdgasdg: 'asdgasdg,', b: 1, c: 'asdg' },
        'interface1/Interface1'
      ).pruneOutput,
      { a: 'aaa', b: 1 }
    );
  });

  it('logic', function () {
    assert.deepStrictEqual(
      validator.prune(
        {
          a: 'sss',
          b: 'fff',
        },
        'logic/AB'
      ).pruneOutput,
      {
        a: 'sss',
        b: 'fff',
      }
    );

    assert.deepStrictEqual(
      validator.prune(
        {
          a: 'sss',
          b: 'fff',
          c: 'asdf',
        },
        'logic/AB'
      ).pruneOutput,
      {
        a: 'sss',
        b: 'fff',
      }
    );

    assert.deepStrictEqual(
      validator.prune(
        {
          a: 'sss',
          b: 'fff',
          c: 'asdf',
        },
        'logic/CD'
      ).pruneOutput,
      {
        c: 'asdf',
      }
    );
    assert.deepStrictEqual(
      validator.prune(
        {
          a: 'sss',
          b: 'fff',
          c: 'asdf',
          d: 'ffd',
        },
        'logic/CD'
      ).pruneOutput,
      {
        c: 'asdf',
        d: 'ffd',
      }
    );

    validator.options.excessPropertyChecks = true;
    assert.deepStrictEqual(
      validator.prune(
        {
          a: 'sss',
          b: 'fff',
          c: 'asdf',
          d: 'ffd',
        },
        'logic/ABCD2'
      ).pruneOutput,
      {
        a: 'sss',
        b: 'fff',
        c: 'asdf',
        d: 'ffd',
      }
    );
    validator.options.excessPropertyChecks = false;
  });

  it('index signature', function () {
    assert.deepStrictEqual(
      validator.prune(
        {
          name: 'asdf',
          sex: 'm',
          aaa: 'asdgasdg',
          bbb: 'asdgasdg',
        },
        'interface1/Interface2_1'
      ).pruneOutput,
      {
        name: 'asdf',
        sex: 'm',
        aaa: 'asdgasdg',
        bbb: 'asdgasdg',
      }
    );
  });

  it('nested', function () {
    assert.deepStrictEqual(
      validator.prune(
        {
          value1: { a: 'aaa', b: 123, c: 'ccc' },
          value2: { c: true, d: 'ddd', e: 'eee' },
          value3: {
            a: 'a',
            b: 'b',
            c: 'c',
            d: 'd',
          },
          value4: {
            a: 'a',
            b: 'b',
            c: 'c',
            d: 'd',
          },
          value5: 'xxx',
          value6: 'xx',
        },
        'interface1/Interface4'
      ).pruneOutput,
      {
        value1: { a: 'aaa', b: 123 },
        value2: { c: true, d: 'ddd' },
        value3: {
          a: 'a',
          b: 'b',
        },
        value4: {
          c: 'c',
          d: 'd',
        },
      }
    );
  });

  it('Array nest object', function () {
    assert.deepStrictEqual(
      validator.prune(
        [
          { value: 'asdf' },
          { value: 'ff', cc: '12' },
          { value: 'ffa', asdf: 'asd' },
        ],
        'nested/ArrObj'
      ).pruneOutput,
      [{ value: 'asdf' }, { value: 'ff' }, { value: 'ffa' }]
    );
  });

  it('Tuple', function () {
    assert.deepStrictEqual(
      validator.prune([123, 'aaa', 333], 'nested/Tuple1').pruneOutput,
      [123, 'aaa', 333]
    );
    assert.deepStrictEqual(
      validator.prune([123, 'aaa', undefined], 'nested/Tuple1').pruneOutput,
      [123, 'aaa', undefined]
    );
    assert.deepStrictEqual(
      validator.prune([123, 'aaa'], 'nested/Tuple1').pruneOutput,
      [123, 'aaa']
    );

    assert.deepStrictEqual(
      validator.prune([{ value: 'v', aa: 'aa' }], 'nested/Tuple2').pruneOutput,
      [{ value: 'v' }]
    );
    assert.deepStrictEqual(
      validator.prune([{ value: 'v', aa: 'aa' }, undefined], 'nested/Tuple2')
        .pruneOutput,
      [{ value: 'v' }, undefined]
    );
    assert.deepStrictEqual(
      validator.prune([{ value: 'v', aa: 'aa' }, 'asdg'], 'nested/Tuple2')
        .pruneOutput,
      [{ value: 'v' }, 'asdg']
    );
    assert.deepStrictEqual(
      validator.prune([{ value: 'v', aa: 'aa' }, 'asdg', []], 'nested/Tuple2')
        .pruneOutput,
      [{ value: 'v' }, 'asdg', []]
    );
    assert.deepStrictEqual(
      validator.prune(
        [{ value: 'v', aa: 'aa' }, 'asdg', [], 1, 2, 3, 4, 5],
        'nested/Tuple2'
      ).pruneOutput,
      [{ value: 'v' }, 'asdg', []]
    );
    assert.deepStrictEqual(
      validator.prune(
        [{ value: 'v', aa: 'aa' }, 'asdg', [true], 1, 2, 3, 4, 5],
        'nested/Tuple2'
      ).pruneOutput,
      [{ value: 'v' }, 'asdg', [true]]
    );
    assert.deepStrictEqual(
      validator.prune(
        [
          { value: 'v', aa: 'aa' },
          'asdg',
          [true, false, 1, 2, 3, 4, 5],
          1,
          2,
          3,
          4,
          5,
        ],
        'nested/Tuple2'
      ).pruneOutput,
      [{ value: 'v' }, 'asdg', [true, false]]
    );
    assert.deepStrictEqual(
      validator.prune(
        [
          { value: 'v', aa: 'aa' },
          'asdg',
          [undefined, true, 1, 2, 3],
          1,
          2,
          3,
          4,
          5,
        ],
        'nested/Tuple2'
      ).pruneOutput,
      [{ value: 'v' }, 'asdg', [undefined, true]]
    );
    assert.deepStrictEqual(
      validator.prune(
        [
          { value: 'v', aa: 'aa' },
          'asdg',
          [true, undefined, 1, 2, 3],
          1,
          2,
          3,
          4,
          5,
        ],
        'nested/Tuple2'
      ).pruneOutput,
      [{ value: 'v' }, 'asdg', [true, undefined]]
    );
    assert.deepStrictEqual(
      validator.prune(
        [
          { value: 'v', aa: 'aa' },
          'asdg',
          [undefined, undefined, 1, 2, 3],
          1,
          2,
          3,
          4,
          5,
        ],
        'nested/Tuple2'
      ).pruneOutput,
      [{ value: 'v' }, 'asdg', [undefined, undefined]]
    );
  });

  it('mutual exclusion', function () {
    assert.deepStrictEqual(
      validator.prune(
        {
          type: 'me1',
          common: {
            value: 'aa',
            zz: 'zz',
          },
          value1: {
            value: 123,
          },
          value2: {
            value: false,
          },
          value3: 999,
        },
        'logic/ME_Final'
      ).pruneOutput,
      {
        type: 'me1',
        common: {
          value: 'aa',
        },
        value1: {
          value: 123,
        },
      }
    );

    assert.deepStrictEqual(
      validator.prune(
        {
          type: 'me2',
          common: {
            value: 'aa',
            zz: 'zz',
          },
          value1: {
            value: 123,
          },
          value2: {
            value: [{ a: 'asdf' }, { b: 'fasd' }, { c: 'xx' }, { d: 'ff' }],
          },
          value3: 999,
        },
        'logic/ME_Final'
      ).pruneOutput,
      {
        type: 'me2',
        common: {
          value: 'aa',
        },
        value2: {
          value: [{ a: 'asdf' }, { b: 'fasd' }, { c: 'xx' }],
        },
      }
    );
  });

  it('strictNullChecks: undefined', function () {
    let strict = new TSBufferValidator(
      {
        'a/b': {
          type: SchemaType.Interface,
          properties: [
            {
              id: 0,
              name: 'a',
              type: {
                type: SchemaType.String,
              },
              optional: true,
            },
          ],
        },
      },
      { strictNullChecks: true }
    );
    let nonStrict = new TSBufferValidator(
      {
        'a/b': {
          type: SchemaType.Interface,
          properties: [
            {
              id: 0,
              name: 'a',
              type: {
                type: SchemaType.String,
              },
              optional: true,
            },
          ],
        },
      },
      { strictNullChecks: false }
    );

    assert.deepStrictEqual(strict.prune({}, 'a/b').pruneOutput, {});
    assert.deepStrictEqual(
      strict.prune({ a: undefined }, 'a/b').pruneOutput,
      {}
    );
    assert.deepStrictEqual(
      strict.prune({ a: null }, 'a/b').pruneOutput,
      undefined
    );
    assert.deepStrictEqual(nonStrict.prune({}, 'a/b').pruneOutput, {});
    assert.deepStrictEqual(
      nonStrict.prune({ a: undefined }, 'a/b').pruneOutput,
      {}
    );
    assert.deepStrictEqual(nonStrict.prune({ a: null }, 'a/b').pruneOutput, {});
  });

  it('strictNullChecks: null', function () {
    let strict = new TSBufferValidator(
      {
        'a/b': {
          type: SchemaType.Interface,
          properties: [
            {
              id: 0,
              name: 'a',
              type: {
                type: SchemaType.Union,
                members: [
                  { id: 0, type: { type: SchemaType.Literal, literal: null } },
                  { id: 1, type: { type: SchemaType.String } },
                ],
              },
            },
          ],
        },
      },
      { strictNullChecks: true }
    );
    let nonStrict = new TSBufferValidator(
      {
        'a/b': {
          type: SchemaType.Interface,
          properties: [
            {
              id: 0,
              name: 'a',
              type: {
                type: SchemaType.Union,
                members: [
                  { id: 0, type: { type: SchemaType.Literal, literal: null } },
                  { id: 1, type: { type: SchemaType.String } },
                ],
              },
            },
          ],
        },
      },
      { strictNullChecks: false }
    );

    assert.deepStrictEqual(strict.prune({}, 'a/b').pruneOutput, undefined);
    assert.deepStrictEqual(
      strict.prune({ a: undefined }, 'a/b').pruneOutput,
      undefined
    );
    assert.deepStrictEqual(strict.prune({ a: null }, 'a/b').pruneOutput, {
      a: null,
    });
    assert.deepStrictEqual(nonStrict.prune({}, 'a/b').pruneOutput, { a: null });
    assert.deepStrictEqual(
      nonStrict.prune({ a: undefined }, 'a/b').pruneOutput,
      { a: null }
    );
    assert.deepStrictEqual(nonStrict.prune({ a: null }, 'a/b').pruneOutput, {
      a: null,
    });
  });
});
