import {
  LiteralTypeSchema,
  SchemaType,
  TSBufferSchema,
} from '@tsbuffer/schema';
import * as assert from 'assert';
import { ErrorType } from '../../../src/ErrorMsg';
import { TSBufferValidator } from '../../../src/TSBufferValidator';
import { ValidateResultUtil } from '../../../src/ValidateResultUtil';

describe('BasicType Validate', function () {
  it('Unexist path or symbolName', function () {
    let validator = new TSBufferValidator(
      {
        'a/b': {
          type: 'xxx' as any,
        },
        'a/c': {
          type: SchemaType.Reference,
          target: 'x/x',
        },
        'a/d': {
          type: SchemaType.Reference,
          target: 'a/x',
        },
      },
      {}
    );

    assert.throws(() => {
      validator.validate(1, 'xxx/xxx' as any);
    });

    assert.throws(() => {
      validator.validate(1, 'a/xxx' as any);
    });

    assert.throws(() => {
      validator.validate(1, 'a/b');
    });

    assert.throws(() => {
      validator.validate(1, 'a/c');
    });

    assert.throws(() => {
      validator.validate(1, 'a/d');
    });
  });

  it('Boolean', function () {
    let schema: TSBufferSchema = {
      type: SchemaType.Boolean,
    };
    let validator = new TSBufferValidator({
      'a/b': schema,
    });

    assert.strictEqual(validator.validate(true, 'a/b').isSucc, true);
    assert.strictEqual(validator.validate(false, 'a/b').isSucc, true);
    assert.deepStrictEqual(
      validator.validate(null, 'a/b').errMsg,
      ValidateResultUtil.error(ErrorType.TypeError, 'boolean', 'null').errMsg
    );
    assert.deepStrictEqual(
      validator.validate(undefined, 'a/b').errMsg,
      ValidateResultUtil.error(ErrorType.TypeError, 'boolean', 'undefined')
        .errMsg
    );
    assert.deepStrictEqual(
      validator.validate(123, 'a/b').errMsg,
      ValidateResultUtil.error(ErrorType.TypeError, 'boolean', 'number').errMsg
    );
    assert.deepStrictEqual(
      validator.validate({}, 'a/b').errMsg,
      ValidateResultUtil.error(ErrorType.TypeError, 'boolean', 'Object').errMsg
    );
    assert.deepStrictEqual(
      validator.validate('123', 'a/b').errMsg,
      ValidateResultUtil.error(ErrorType.TypeError, 'boolean', 'string').errMsg
    );
  });

  it('Number: number', function () {
    let scalarTypes = [undefined, 'double'] as const;
    for (let scalarType of scalarTypes) {
      let schema: TSBufferSchema = {
        type: SchemaType.Number,
        scalarType: scalarType,
      };
      let validator = new TSBufferValidator({
        'a/b': schema,
      });

      assert.strictEqual(validator.validate(123, 'a/b').isSucc, true);
      assert.strictEqual(validator.validate(-123.4, 'a/b').isSucc, true);
      assert.deepStrictEqual(
        validator.validate(BigInt(1234), 'a/b').errMsg,
        ValidateResultUtil.error(ErrorType.TypeError, 'number', 'bigint').errMsg
      );
      assert.deepStrictEqual(
        validator.validate(null, 'a/b').errMsg,
        ValidateResultUtil.error(ErrorType.TypeError, 'number', 'null').errMsg
      );
      assert.deepStrictEqual(
        validator.validate(undefined, 'a/b').errMsg,
        ValidateResultUtil.error(ErrorType.TypeError, 'number', 'undefined')
          .errMsg
      );
      assert.deepStrictEqual(
        validator.validate(true, 'a/b').errMsg,
        ValidateResultUtil.error(ErrorType.TypeError, 'number', 'boolean')
          .errMsg
      );
      assert.deepStrictEqual(
        validator.validate({}, 'a/b').errMsg,
        ValidateResultUtil.error(ErrorType.TypeError, 'number', 'Object').errMsg
      );
      assert.deepStrictEqual(
        validator.validate('123', 'a/b').errMsg,
        ValidateResultUtil.error(ErrorType.TypeError, 'number', 'string').errMsg
      );
      assert.deepStrictEqual(
        validator.validate('0', 'a/b').errMsg,
        ValidateResultUtil.error(ErrorType.TypeError, 'number', 'string').errMsg
      );
      assert.deepStrictEqual(
        validator.validate('', 'a/b').errMsg,
        ValidateResultUtil.error(ErrorType.TypeError, 'number', 'string').errMsg
      );
    }
  });

  it('Number: int', function () {
    let scalarTypes = ['int', 'uint'] as const;
    for (let scalarType of scalarTypes) {
      let schema: TSBufferSchema = {
        type: SchemaType.Number,
        scalarType: scalarType,
      };
      let validator = new TSBufferValidator({
        'a/b': schema,
      });

      assert.strictEqual(validator.validate(123, 'a/b').isSucc, true);
      assert.strictEqual(validator.validate(0.0, 'a/b').isSucc, true);

      // Unsigned
      if (scalarType.startsWith('u') || scalarType.startsWith('fixed')) {
        assert.deepStrictEqual(
          validator.validate(-123, 'a/b').errMsg,
          ValidateResultUtil.error(
            ErrorType.InvalidScalarType,
            -123,
            scalarType
          ).errMsg
        );
      }
      // Signed
      else {
        assert.strictEqual(validator.validate(-123, 'a/b').isSucc, true);
      }

      // not BigInt
      assert.deepStrictEqual(
        validator.validate(BigInt(1234), 'a/b').errMsg,
        ValidateResultUtil.error(ErrorType.TypeError, 'number', 'bigint').errMsg
      );

      // 小数
      assert.deepStrictEqual(
        validator.validate(1.234, 'a/b').errMsg,
        ValidateResultUtil.error(ErrorType.InvalidScalarType, 1.234, scalarType)
          .errMsg
      );
      assert.deepStrictEqual(
        validator.validate(-1.234, 'a/b').errMsg,
        ValidateResultUtil.error(
          ErrorType.InvalidScalarType,
          -1.234,
          scalarType
        ).errMsg
      );
    }
  });

  it('Number: bigint', function () {
    (['bigint', 'bigint64', 'biguint64'] as const).forEach((v) => {
      let schema: TSBufferSchema = {
        type: SchemaType.Number,
        scalarType: v,
      };
      let validator = new TSBufferValidator({
        'a/b': schema,
      });
      assert.deepStrictEqual(
        validator.validate(BigInt(1234), 'a/b'),
        ValidateResultUtil.succ
      );
      assert.deepStrictEqual(
        validator.validate(1234, 'a/b').errMsg,
        ValidateResultUtil.error(ErrorType.TypeError, 'bigint', 'number').errMsg
      );
      assert.deepStrictEqual(
        validator.validate(1.234, 'a/b').errMsg,
        ValidateResultUtil.error(ErrorType.TypeError, 'bigint', 'number').errMsg
      );
      assert.deepStrictEqual(
        validator.validate(true, 'a/b').errMsg,
        ValidateResultUtil.error(ErrorType.TypeError, 'bigint', 'boolean')
          .errMsg
      );
      assert.deepStrictEqual(
        validator.validate('', 'a/b').errMsg,
        ValidateResultUtil.error(ErrorType.TypeError, 'bigint', 'string').errMsg
      );
      assert.deepStrictEqual(
        validator.validate('123', 'a/b').errMsg,
        ValidateResultUtil.error(ErrorType.TypeError, 'bigint', 'string').errMsg
      );
    });
  });

  it('String', function () {
    let schema = {
      type: SchemaType.String,
    } as const;
    let validator = new TSBufferValidator({
      'a/b': schema,
    });

    assert.strictEqual(validator.validate('asdgasdg', 'a/b').isSucc, true);
    assert.strictEqual(validator.validate('false', 'a/b').isSucc, true);
    (
      [
        [null, 'null'],
        [undefined, 'undefined'],
        [123, 'number'],
        [{}, 'Object'],
      ] as [any, string][]
    ).forEach((v) => {
      assert.deepStrictEqual(
        validator.validate(v[0], 'a/b').errMsg,
        ValidateResultUtil.error(ErrorType.TypeError, 'string', v[1]).errMsg
      );
    });
  });

  it('Enum', function () {
    let schema: TSBufferSchema = {
      type: SchemaType.Enum,
      members: [
        { id: 0, value: 0 },
        { id: 1, value: 1 },
        { id: 2, value: 'ABC' },
      ],
    };
    let validator = new TSBufferValidator({
      'a/b': schema,
    });

    assert.strictEqual(validator.validate(0, 'a/b').isSucc, true);
    assert.strictEqual(validator.validate(1, 'a/b').isSucc, true);
    assert.strictEqual(validator.validate('ABC', 'a/b').isSucc, true);
    (['0', '1', 123] as any[]).forEach((v) => {
      assert.deepStrictEqual(
        validator.validate(v, 'a/b').errMsg,
        ValidateResultUtil.error(ErrorType.InvalidEnumValue, v).errMsg
      );
    });
    (
      [
        [{}, 'Object'],
        [true, 'boolean'],
        [null, 'null'],
        [undefined, 'undefined'],
      ] as [any, string][]
    ).forEach((v) => {
      assert.deepStrictEqual(
        validator.validate(v[0], 'a/b').errMsg,
        ValidateResultUtil.error(ErrorType.TypeError, 'string | number', v[1])
          .errMsg
      );
    });
  });

  it('Any', function () {
    let validator = new TSBufferValidator({
      'a/b': {
        type: SchemaType.Any,
      },
    });

    assert.strictEqual(validator.validate(true, 'a/b').isSucc, true);
    assert.strictEqual(validator.validate(null, 'a/b').isSucc, true);
    assert.strictEqual(validator.validate(undefined, 'a/b').isSucc, true);
    assert.strictEqual(validator.validate(123, 'a/b').isSucc, true);
    assert.strictEqual(validator.validate('123', 'a/b').isSucc, true);
    assert.strictEqual(validator.validate({}, 'a/b').isSucc, true);
  });

  it('Literal', function () {
    let schema: LiteralTypeSchema = {
      type: SchemaType.Literal,
      literal: '123',
    };
    let validator = new TSBufferValidator({
      'a/b': schema,
    });
    assert.strictEqual(validator.validate('123', 'a/b').isSucc, true);
    assert.deepStrictEqual(
      validator.validate(123, 'a/b').errMsg,
      ValidateResultUtil.error(
        ErrorType.InvalidLiteralValue,
        schema.literal,
        123
      ).errMsg
    );
    assert.deepStrictEqual(
      validator.validate(null, 'a/b').errMsg,
      ValidateResultUtil.error(
        ErrorType.InvalidLiteralValue,
        schema.literal,
        null
      ).errMsg
    );
    assert.deepStrictEqual(
      validator.validate(undefined, 'a/b').errMsg,
      ValidateResultUtil.error(
        ErrorType.InvalidLiteralValue,
        schema.literal,
        undefined
      ).errMsg
    );

    let schema1: LiteralTypeSchema = {
      type: SchemaType.Literal,
      literal: 123,
    };
    let validator1 = new TSBufferValidator({
      'a/b': schema1,
    });
    assert.strictEqual(validator1.validate(123, 'a/b').isSucc, true);
    assert.deepStrictEqual(
      validator1.validate('123', 'a/b').errMsg,
      ValidateResultUtil.error(
        ErrorType.InvalidLiteralValue,
        schema1.literal,
        '123'
      ).errMsg
    );

    let schema2: LiteralTypeSchema = {
      type: SchemaType.Literal,
      literal: true,
    };
    let validator2 = new TSBufferValidator({
      'a/b': schema2,
    });
    assert.strictEqual(validator2.validate(true, 'a/b').isSucc, true);
    assert.deepStrictEqual(
      validator2.validate(1, 'a/b').errMsg,
      ValidateResultUtil.error(
        ErrorType.InvalidLiteralValue,
        schema2.literal,
        1
      ).errMsg
    );

    let schema3: LiteralTypeSchema = {
      type: SchemaType.Literal,
      literal: null,
    };
    let validator3 = new TSBufferValidator(
      {
        'a/b': schema3,
      },
      {
        strictNullChecks: true,
      }
    );
    assert.strictEqual(validator3.validate(null, 'a/b').isSucc, true);
    assert.deepStrictEqual(
      validator3.validate(undefined, 'a/b').errMsg,
      ValidateResultUtil.error(
        ErrorType.InvalidLiteralValue,
        schema3.literal,
        undefined
      ).errMsg
    );

    let schema4: LiteralTypeSchema = {
      type: SchemaType.Literal,
      literal: undefined,
    };
    let validator4 = new TSBufferValidator(
      {
        'a/b': schema4,
      },
      {
        strictNullChecks: true,
      }
    );
    assert.strictEqual(validator4.validate(undefined, 'a/b').isSucc, true);
    assert.deepStrictEqual(
      validator4.validate(null, 'a/b').errMsg,
      ValidateResultUtil.error(
        ErrorType.InvalidLiteralValue,
        schema4.literal,
        null
      ).errMsg
    );

    let schema5: LiteralTypeSchema = {
      type: SchemaType.Literal,
      literal: null,
    };
    let validator5 = new TSBufferValidator(
      {
        'a/b': schema5,
      },
      {
        strictNullChecks: false,
      }
    );
    assert.strictEqual(validator5.validate(null, 'a/b').isSucc, true);
    assert.deepStrictEqual(validator5.validate(undefined, 'a/b').isSucc, true);
  });

  it('strictNullChecks false', function () {
    let validator = new TSBufferValidator(
      {
        'a/b': {
          type: SchemaType.Literal,
          literal: null,
        },
      },
      {
        strictNullChecks: false,
      }
    );
    assert.deepStrictEqual(
      validator.validate(undefined, 'a/b'),
      ValidateResultUtil.succ
    );
    assert.deepStrictEqual(
      validator.validate(null, 'a/b'),
      ValidateResultUtil.succ
    );

    let validator1 = new TSBufferValidator(
      {
        'a/b': {
          type: SchemaType.Literal,
          literal: undefined,
        },
      },
      {
        strictNullChecks: false,
      }
    );
    assert.deepStrictEqual(
      validator1.validate(undefined, 'a/b'),
      ValidateResultUtil.succ
    );
    assert.deepStrictEqual(
      validator1.validate(null, 'a/b'),
      ValidateResultUtil.succ
    );

    let validator2 = new TSBufferValidator(
      {
        'a/b': {
          type: SchemaType.Interface,
          properties: [
            {
              id: 0,
              name: 'value',
              type: {
                type: SchemaType.String,
              },
              optional: true,
            },
          ],
        },
      },
      {
        strictNullChecks: false,
      }
    );
    assert.deepStrictEqual(
      validator2.validate({ value: undefined }, 'a/b'),
      ValidateResultUtil.succ
    );
    assert.deepStrictEqual(
      validator2.validate({ value: null }, 'a/b'),
      ValidateResultUtil.succ
    );
    assert.deepStrictEqual(
      validator2.validate({}, 'a/b'),
      ValidateResultUtil.succ
    );
  });

  it('Object', function () {
    let schema = {
      type: SchemaType.Object,
    } as const;
    let validator = new TSBufferValidator({
      'a/b': schema,
    });

    assert.strictEqual(validator.validate({ a: 1 }, 'a/b').isSucc, true);
    assert.deepStrictEqual(
      validator.validate([1, 2, 3], 'a/b').errMsg,
      undefined
    );
    assert.deepStrictEqual(
      validator.validate(null, 'a/b').errMsg,
      ValidateResultUtil.error(ErrorType.TypeError, 'Object', 'null').errMsg
    );
    assert.deepStrictEqual(
      validator.validate(undefined, 'a/b').errMsg,
      ValidateResultUtil.error(ErrorType.TypeError, 'Object', 'undefined')
        .errMsg
    );
    assert.deepStrictEqual(
      validator.validate(123, 'a/b').errMsg,
      ValidateResultUtil.error(ErrorType.TypeError, 'Object', 'number').errMsg
    );
    assert.deepStrictEqual(
      validator.validate(true, 'a/b').errMsg,
      ValidateResultUtil.error(ErrorType.TypeError, 'Object', 'boolean').errMsg
    );
    assert.deepStrictEqual(
      validator.validate('123', 'a/b').errMsg,
      ValidateResultUtil.error(ErrorType.TypeError, 'Object', 'string').errMsg
    );
  });

  it('Buffer', function () {
    let schema = {
      type: SchemaType.Buffer,
    } as const;
    let validator = new TSBufferValidator({
      'a/b': schema,
      'a/c': {
        type: SchemaType.Buffer,
        arrayType: 'xxx' as any,
      },
    });

    assert.throws(() => {
      validator.validate(new Uint16Array(1), 'a/c');
    });

    assert.strictEqual(
      validator.validate(new ArrayBuffer(10), 'a/b').isSucc,
      true
    );

    [
      [new Uint8Array(10), 'Uint8Array'],
      [null, 'null'],
      [undefined, 'undefined'],
      [123, 'number'],
      [true, 'boolean'],
      [123, 'number'],
      [{}, 'Object'],
      [[], 'Array'],
    ].forEach((v: any) => {
      assert.deepStrictEqual(
        validator.validate(v[0], 'a/b').errMsg,
        ValidateResultUtil.error(ErrorType.TypeError, 'ArrayBuffer', v[1])
          .errMsg
      );
    });

    let typedArrays = [
      'Int8Array',
      'Int16Array',
      'Int32Array',
      'BigInt64Array',
      'Uint8Array',
      'Uint16Array',
      'Uint32Array',
      'BigUint64Array',
      'Float32Array',
      'Float64Array',
    ] as const;
    for (let arrayType of typedArrays) {
      let schema2 = {
        type: SchemaType.Buffer,
        arrayType: arrayType,
      } as const;
      let validator = new TSBufferValidator({
        'a/b': schema2,
      });

      let typedArray = eval(arrayType);
      assert.strictEqual(
        validator.validate(new typedArray(10), 'a/b').isSucc,
        true
      );
      assert.deepStrictEqual(
        validator.validate(new ArrayBuffer(10), 'a/b').errMsg,
        ValidateResultUtil.error(ErrorType.TypeError, arrayType, 'ArrayBuffer')
          .errMsg
      );
      if (arrayType !== 'Uint8Array') {
        assert.deepStrictEqual(
          validator.validate(new Uint8Array(10), 'a/b').errMsg,
          ValidateResultUtil.error(ErrorType.TypeError, arrayType, 'Uint8Array')
            .errMsg
        );
      } else {
        assert.deepStrictEqual(
          validator.validate(new Uint16Array(10), 'a/b').errMsg,
          ValidateResultUtil.error(
            ErrorType.TypeError,
            arrayType,
            'Uint16Array'
          ).errMsg
        );
      }
    }
  });

  it('Date', function () {
    let schema: TSBufferSchema = {
      type: SchemaType.Date,
    };
    let validator = new TSBufferValidator({
      'a/b': schema,
    });

    assert.strictEqual(validator.validate(new Date(), 'a/b').isSucc, true);
    assert.strictEqual(
      validator.validate(true, 'a/b').errMsg,
      ValidateResultUtil.error(ErrorType.TypeError, 'Date', 'boolean').errMsg
    );
    assert.strictEqual(
      validator.validate(false, 'a/b').errMsg,
      ValidateResultUtil.error(ErrorType.TypeError, 'Date', 'boolean').errMsg
    );
    assert.deepStrictEqual(
      validator.validate(null, 'a/b').errMsg,
      ValidateResultUtil.error(ErrorType.TypeError, 'Date', 'null').errMsg
    );
    assert.deepStrictEqual(
      validator.validate(undefined, 'a/b').errMsg,
      ValidateResultUtil.error(ErrorType.TypeError, 'Date', 'undefined').errMsg
    );
    assert.deepStrictEqual(
      validator.validate(123, 'a/b').errMsg,
      ValidateResultUtil.error(ErrorType.TypeError, 'Date', 'number').errMsg
    );
    assert.deepStrictEqual(
      validator.validate({}, 'a/b').errMsg,
      ValidateResultUtil.error(ErrorType.TypeError, 'Date', 'Object').errMsg
    );
    assert.deepStrictEqual(
      validator.validate('123', 'a/b').errMsg,
      ValidateResultUtil.error(ErrorType.TypeError, 'Date', 'string').errMsg
    );
  });
});
