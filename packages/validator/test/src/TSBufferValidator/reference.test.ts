import { SchemaType } from '@tsbuffer/schema';
import * as assert from 'assert';
import { TSBufferValidator } from '../../../src';
import { ErrorMsg, ErrorType } from '../../../src/ErrorMsg';
import { ValidateResultUtil } from '../../../src/ValidateResultUtil';

describe('TypeReference Validate', function () {
  it('Reference', function () {
    let schema = {
      type: SchemaType.Boolean,
    } as const;
    let validator = new TSBufferValidator({
      // 原始
      'a/a1': schema,
      // 文件内直接引用
      'a/a2': {
        type: SchemaType.Reference,
        target: 'a/a1',
      },
      // 文件内间接引用
      'a/a3': {
        type: SchemaType.Reference,
        target: 'a/a2',
      },
      // 跨文件直接引用
      'b/b1': {
        type: SchemaType.Reference,
        target: 'a/a1',
      },
      // 跨文件间接引用
      'b/b2': {
        type: SchemaType.Reference,
        target: 'a/a2',
      },
      // 跨多文件间接引用
      'c/c1': {
        type: SchemaType.Reference,
        target: 'b/b2',
      },
    });

    assert.strictEqual(validator.validate(true, 'a/a1').isSucc, true);
    assert.strictEqual(validator.validate(true, 'a/a2').isSucc, true);
    assert.strictEqual(validator.validate(true, 'a/a3').isSucc, true);
    assert.strictEqual(validator.validate(true, 'b/b1').isSucc, true);
    assert.strictEqual(validator.validate(true, 'b/b2').isSucc, true);
    assert.strictEqual(validator.validate(true, 'c/c1').isSucc, true);
    assert.deepStrictEqual(
      validator.validate(123, 'a/a1').errMsg,
      ErrorMsg[ErrorType.TypeError]('boolean', 'number')
    );
    assert.deepStrictEqual(
      validator.validate(123, 'a/a2').errMsg,
      ErrorMsg[ErrorType.TypeError]('boolean', 'number')
    );
    assert.deepStrictEqual(
      validator.validate(123, 'a/a3').errMsg,
      ErrorMsg[ErrorType.TypeError]('boolean', 'number')
    );
    assert.deepStrictEqual(
      validator.validate(123, 'b/b1').errMsg,
      ErrorMsg[ErrorType.TypeError]('boolean', 'number')
    );
    assert.deepStrictEqual(
      validator.validate(123, 'b/b2').errMsg,
      ErrorMsg[ErrorType.TypeError]('boolean', 'number')
    );
    assert.deepStrictEqual(
      validator.validate(123, 'c/c1').errMsg,
      ErrorMsg[ErrorType.TypeError]('boolean', 'number')
    );
  });

  it('IndexedAccess', function () {
    let validator = new TSBufferValidator({
      // 原始
      'a/a1': {
        type: SchemaType.Interface,
        properties: [
          {
            id: 0,
            name: 'aaa',
            type: {
              type: SchemaType.Boolean,
            },
          },
        ],
        indexSignature: {
          keyType: 'String',
          type: {
            type: SchemaType.Boolean,
          },
        },
      },
      'b/b1': {
        type: SchemaType.IndexedAccess,
        objectType: {
          type: SchemaType.Reference,
          target: 'a/a1',
        },
        index: 'aaa',
      },
      'b/b2': {
        type: SchemaType.IndexedAccess,
        objectType: {
          type: SchemaType.Reference,
          target: 'a/a1',
        },
        index: 'bbb',
      },
      'e/e1': {
        type: SchemaType.IndexedAccess,
        objectType: {
          type: SchemaType.Any as any,
        },
        index: 'xxx',
      },
      'e/e2': {
        type: SchemaType.IndexedAccess,
        objectType: {
          type: SchemaType.Interface,
          properties: [],
        },
        index: 'xxx',
      },
    });

    assert.strictEqual(validator.validate(true, 'b/b1').isSucc, true);
    assert.deepStrictEqual(
      validator.validate(123, 'b/b1').errMsg,
      ErrorMsg[ErrorType.TypeError]('boolean', 'number')
    );
    assert.deepStrictEqual(
      validator.validate(null, 'b/b1').errMsg,
      ErrorMsg[ErrorType.TypeError]('boolean', 'null')
    );
    assert.deepStrictEqual(
      validator.validate(undefined, 'b/b1').errMsg,
      ErrorMsg[ErrorType.TypeError]('boolean', 'undefined')
    );

    assert.strictEqual(validator.validate(true, 'b/b2').isSucc, true);
    assert.deepStrictEqual(
      validator.validate(123, 'b/b2').errMsg,
      ErrorMsg[ErrorType.TypeError]('boolean', 'number')
    );
    assert.deepStrictEqual(
      validator.validate(null, 'b/b2').errMsg,
      ErrorMsg[ErrorType.TypeError]('boolean', 'null')
    );
    assert.deepStrictEqual(
      validator.validate(undefined, 'b/b2').errMsg,
      ErrorMsg[ErrorType.TypeError]('boolean', 'undefined')
    );

    assert.throws(() => {
      validator.validate(123, 'e/e1');
    });
    assert.throws(() => {
      validator.validate(123, 'e/e2');
    });
  });

  it('Optional to | undefined', function () {
    let validator = new TSBufferValidator({
      'a/a1': {
        type: SchemaType.Interface,
        properties: [
          {
            id: 0,
            optional: true,
            name: 'aaa',
            type: { type: SchemaType.String },
          },
        ],
      },
      'a/b1': {
        type: SchemaType.IndexedAccess,
        objectType: {
          type: SchemaType.Reference,
          target: 'a/a1',
        },
        index: 'aaa',
      },
    });

    assert.deepStrictEqual(
      validator.validate('abc', 'a/b1'),
      ValidateResultUtil.succ
    );
    assert.deepStrictEqual(
      validator.validate(undefined, 'a/b1'),
      ValidateResultUtil.succ
    );
    assert.deepStrictEqual(
      validator.validate(123, 'a/b1').errMsg,
      ErrorMsg[ErrorType.TypeError]('string', 'number')
    );
  });

  it('IndexedAccess a optional fields with | undefined', function () {
    let validator = new TSBufferValidator({
      'a/a1': {
        type: SchemaType.Interface,
        properties: [
          {
            id: 0,
            optional: true,
            name: 'aaa',
            type: {
              type: SchemaType.Union,
              members: [
                { id: 0, type: { type: SchemaType.String } },
                {
                  id: 0,
                  type: { type: SchemaType.Literal, literal: undefined },
                },
              ],
            },
          },
        ],
      },
      'a/b1': {
        type: SchemaType.IndexedAccess,
        objectType: {
          type: SchemaType.Reference,
          target: 'a/a1',
        },
        index: 'aaa',
      },
    });

    assert.deepStrictEqual(
      validator.validate('abc', 'a/b1'),
      ValidateResultUtil.succ
    );
    assert.deepStrictEqual(
      validator.validate(undefined, 'a/b1'),
      ValidateResultUtil.succ
    );
    assert.deepStrictEqual(
      validator.validate(123, 'a/b1').errMsg,
      ErrorMsg[ErrorType.TypeError]('string', 'number')
    );
  });
});
