import { SchemaType } from '@tsbuffer/schema';
import * as assert from 'assert';
import { ErrorMsg, ErrorType } from '../../../src/ErrorMsg';
import { TSBufferValidator } from '../../../src/TSBufferValidator';
import { ValidateResultUtil } from '../../../src/ValidateResultUtil';

describe('CustomType Validate', function () {
  it('Custom', function () {
    let validator = new TSBufferValidator({
      'a/b': {
        type: SchemaType.Reference,
        target: 'custom/Email',
      },
      'custom/Email': {
        type: SchemaType.Custom,
        validate: (value) => {
          if (typeof value !== 'string') {
            return {
              isSucc: false,
              errMsg: ErrorMsg.TypeError('string', typeof value),
            };
          }
          if (!/^\w+\@\w+\.\w+$/.test(value)) {
            return { isSucc: false, errMsg: 'This is not a valid email' };
          }
          return { isSucc: true };
        },
      },
    });

    console.log(validator.validate('xxxx@qq.com', 'a/b'));
    assert.strictEqual(validator.validate('xxxx@qq.com', 'a/b').isSucc, true);
    assert.deepStrictEqual(
      validator.validate(12345, 'a/b').errMsg,
      ValidateResultUtil.error(ErrorType.TypeError, 'string', 'number').errMsg
    );
    assert.deepStrictEqual(
      validator.validate('666666', 'a/b').errMsg,
      'This is not a valid email'
    );
  });
});
