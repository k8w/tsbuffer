import { SchemaType, TSBufferProto } from '@tsbuffer/schema';
import * as assert from 'assert';
import { TSBufferValidator } from '../../../src';
import { ErrorMsg, ErrorType } from '../../../src/ErrorMsg';
import { ValidateResultUtil } from '../../../src/ValidateResultUtil';

describe('LogicType', function () {
    const proto: TSBufferProto = require('../../genTestSchemas/output');
    let validator = new TSBufferValidator(proto);

    function assertValidErr(value: any, schemaId: string, errMsg: string | undefined, property?: string[]) {
        let vRes = validator.validate(value, schemaId);
        if (property) {
            assert.strictEqual(vRes.errMsg, `Property \`${property.join('.')}\`: ${errMsg}`);
        }
        else {
            assert.strictEqual(vRes.errMsg, errMsg)
        }
    }

    it('Union: Basic', function () {
        // C | D
        assert.deepStrictEqual(validator.validate({ c: 'cc' }, 'logic/CD'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ d: 'dd' }, 'logic/CD'), ValidateResultUtil.succ);
        // excess check
        assert.deepStrictEqual(validator.validate({ c: 'cc', d: 123 }, 'logic/CD'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ c: 123, d: 'ddd' }, 'logic/CD'), ValidateResultUtil.succ);
        // fail
        assertValidErr({ c: 'c', d: 'd', e: 'e' }, 'logic/CD', ErrorMsg[ErrorType.ExcessProperty]('e'));
        assertValidErr({ c: 'c', e: 'e' }, 'logic/CD', ErrorMsg[ErrorType.ExcessProperty]('e'));
        assertValidErr(123, 'logic/CD', ErrorMsg[ErrorType.TypeError]('Object', 'number'));

        // B | C | D
        assert.deepStrictEqual(validator.validate({ d: 'd' }, 'logic/BCD'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c' }, 'logic/BCD'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c', d: 'd' }, 'logic/BCD'), ValidateResultUtil.succ);
        // excess
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 123, d: null }, 'logic/BCD'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ c: 123, d: 'ddd' }, 'logic/BCD'), ValidateResultUtil.succ);
        // fail
        assertValidErr({ b: 'b', c: 'c', d: 'd', e: 'e' }, 'logic/BCD', ErrorMsg[ErrorType.ExcessProperty]('e'));
        assertValidErr({ b: 'b', e: 'e' }, 'logic/BCD', ErrorMsg[ErrorType.ExcessProperty]('e'));

        // A & B | C & D
        assert.deepStrictEqual(validator.validate({ a: 'aaa', b: 'bb' }, 'logic/ABCD'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ c: 'c', d: 'd' }, 'logic/ABCD'), ValidateResultUtil.succ);
        // excess
        assert.deepStrictEqual(validator.validate({ a: 4, b: null, c: 'c', d: 'd' }, 'logic/ABCD'), ValidateResultUtil.succ);
        // fail
        assertValidErr({ a: 'a' }, 'logic/ABCD', ErrorMsg[ErrorType.UnionMembersNotMatch]([
            { errMsg: ErrorMsg[ErrorType.MissingRequiredProperty]('b') },
            { errMsg: ErrorMsg[ErrorType.MissingRequiredProperty]('c') }
        ]));
        assertValidErr({ c: 'c' }, 'logic/ABCD', ErrorMsg[ErrorType.UnionMembersNotMatch]([
            { errMsg: ErrorMsg[ErrorType.MissingRequiredProperty]('a') },
            { errMsg: ErrorMsg[ErrorType.MissingRequiredProperty]('d') }
        ]));
        assertValidErr({ a: 'a', c: 'c' }, 'logic/ABCD', ErrorMsg[ErrorType.UnionMembersNotMatch]([
            { errMsg: ErrorMsg[ErrorType.MissingRequiredProperty]('b') },
            { errMsg: ErrorMsg[ErrorType.MissingRequiredProperty]('d') }
        ]));
        assertValidErr({ a: 'a', b: 'b', e: 'e' }, 'logic/ABCD', ErrorMsg[ErrorType.ExcessProperty]('e'));

        // A | B&C | D
        assert.deepStrictEqual(validator.validate({ a: 'aaa' }, 'logic/ABCD1'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ b: 'b', c: 'c' }, 'logic/ABCD1'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ d: 'd' }, 'logic/ABCD1'), ValidateResultUtil.succ);
        // excess
        assert.deepStrictEqual(validator.validate({ a: 'a', b: 1, c: true, d: null }, 'logic/ABCD1'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ a: null, b: 1, c: true, d: 'd' }, 'logic/ABCD1'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ a: null, b: 'b', c: 'c', d: 12 }, 'logic/ABCD1'), ValidateResultUtil.succ);
        // fail
        assertValidErr({ a: 'a', e: 'e' }, 'logic/ABCD1', ErrorMsg[ErrorType.ExcessProperty]('e'));
        assertValidErr({ d: 'a', e: 'e' }, 'logic/ABCD1', ErrorMsg[ErrorType.ExcessProperty]('e'));
        assertValidErr({ b: 'b', c: 'c', e: 'e' }, 'logic/ABCD1', ErrorMsg[ErrorType.ExcessProperty]('e'));

        // A&B | B&C | C&D
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 'x' }, 'logic/ABCD2'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ b: 'x', c: 'x' }, 'logic/ABCD2'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ c: 'x', d: 'x' }, 'logic/ABCD2'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ c: 'x', d: 'x', a: 1, b: 2 }, 'logic/ABCD2'), ValidateResultUtil.succ);
        // fail
        assertValidErr({ a: 'x', c: 'x' }, 'logic/ABCD2', ErrorMsg[ErrorType.UnionMembersNotMatch]([
            { errMsg: ErrorMsg[ErrorType.MissingRequiredProperty]('b') },
            { errMsg: ErrorMsg[ErrorType.MissingRequiredProperty]('b') },
            { errMsg: ErrorMsg[ErrorType.MissingRequiredProperty]('d') },
        ]));
        assertValidErr({ b: 'x', d: 'x' }, 'logic/ABCD2', ErrorMsg[ErrorType.UnionMembersNotMatch]([
            { errMsg: ErrorMsg[ErrorType.MissingRequiredProperty]('a') },
            { errMsg: ErrorMsg[ErrorType.MissingRequiredProperty]('c') },
            { errMsg: ErrorMsg[ErrorType.MissingRequiredProperty]('c') },
        ]));
        assertValidErr({ a: 'x', d: 'x' }, 'logic/ABCD2', ErrorMsg[ErrorType.UnionMembersNotMatch]([
            { errMsg: ErrorMsg[ErrorType.MissingRequiredProperty]('b') },
            { errMsg: ErrorMsg[ErrorType.MissingRequiredProperty]('b') },
            { errMsg: ErrorMsg[ErrorType.MissingRequiredProperty]('c') },
        ]));

        // A | null
        assert.deepStrictEqual(validator.validate({ a: 'sss' }, 'logic/AOrNull'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate(null, 'logic/AOrNull'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate([{ a: 'sss' }], 'logic/AOrNullArr'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate([null], 'logic/AOrNullArr'), ValidateResultUtil.succ);
    });

    it('Intersection: Basic', function () {
        // A & B
        assert.deepStrictEqual(validator.validate({ a: 'aa', b: 'bb' }, 'logic/AB'), ValidateResultUtil.succ);
        assertValidErr({ a: 'aa', b: 'bb', c: 'cc' }, 'logic/AB', ErrorMsg[ErrorType.ExcessProperty]('c'));
        assertValidErr({ a: 'x' }, 'logic/AB', ErrorMsg[ErrorType.MissingRequiredProperty]('b'));
        assertValidErr({ a: 'x', b: 123 }, 'logic/AB', ErrorMsg[ErrorType.TypeError]('string', 'number'), ['b']);

        // (A & B) & C
        assert.deepStrictEqual(validator.validate({ a: 'a', b: 'b', c: 'c' }, 'logic/ABC'), ValidateResultUtil.succ);
        assertValidErr({ a: 'x', b: 'x' }, 'logic/ABC', ErrorMsg[ErrorType.MissingRequiredProperty]('c'));
        assertValidErr({ a: 'x', b: 'x', c: 'x', d: 1223 }, 'logic/ABC', ErrorMsg[ErrorType.ExcessProperty]('d'));
        assertValidErr({ a: 'x', b: 'x', c: 123 }, 'logic/ABC', ErrorMsg[ErrorType.TypeError]('string', 'number'), ['c']);

        // A & (B|C) & D & { [key: string]: string | number }
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 'x', d: 'x' }, 'logic/ABCD3'), ValidateResultUtil.succ)
        assert.deepStrictEqual(validator.validate({ a: 'x', c: 'x', d: 'x', e: 1, f: 'x' }, 'logic/ABCD3'), ValidateResultUtil.succ)
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 'x', c: 1, d: 'x' }, 'logic/ABCD3'), ValidateResultUtil.succ)
        assert.deepStrictEqual(validator.validate({ a: 'x', b: 1, c: 'x', d: 'x' }, 'logic/ABCD3'), ValidateResultUtil.succ)
        assertValidErr({ a: 'x', d: 'x' }, 'logic/ABCD3', ErrorMsg[ErrorType.UnionMembersNotMatch]([
            { errMsg: ErrorMsg[ErrorType.MissingRequiredProperty]('b') },
            { errMsg: ErrorMsg[ErrorType.MissingRequiredProperty]('c') },
        ]));
        assertValidErr({ a: 'x', b: true, c: 'x', d: 'x' }, 'logic/ABCD3', ErrorMsg[ErrorType.TypeError]('string | number', 'boolean'), ['b'])
    })

    it('Intersection: Conflict', function () {
        assertValidErr({ value: 'xx' }, 'logic/Conflict', ErrorMsg[ErrorType.TypeError]('number', 'string'), ['value']);
        assertValidErr({ value: 123 }, 'logic/Conflict', ErrorMsg[ErrorType.TypeError]('string', 'number'), ['value']);
    });

    it('Union: mutual exclusion', function () {
        assert.deepStrictEqual(validator.validate({ type: 'string', value: 'x' }, 'logic/Conflict2'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ type: 'number', value: 123 }, 'logic/Conflict2'), ValidateResultUtil.succ);
        assertValidErr({ type: 'string', value: 123 }, 'logic/Conflict2', ErrorMsg[ErrorType.TypeError]('string', 'number'), ['value']);
        assertValidErr({ type: 'number', value: 'x' }, 'logic/Conflict2', ErrorMsg[ErrorType.TypeError]('number', 'string'), ['value']);
        assertValidErr({}, 'logic/Conflict2', ErrorMsg[ErrorType.MissingRequiredProperty]('type'));
    })

    it('Union: indexSignature & excess check', function () {
        assert.deepStrictEqual(validator.validate({ a: 'x', b: true, c: 'x', d: 'x' }, 'logic/ABCD4'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate({ a: 'x', b: true, c: true }, 'logic/ABCD4'), ValidateResultUtil.succ);
        assertValidErr({ a: true, b: true, c: true }, 'logic/ABCD4', ErrorMsg[ErrorType.UnionMembersNotMatch]([
            { errMsg: 'Property `a`: ' + ErrorMsg[ErrorType.TypeError]('string', 'boolean') },
            { errMsg: 'Property `b`: ' + ErrorMsg[ErrorType.TypeError]('string', 'boolean') },
            { errMsg: 'Property `a`: ' + ErrorMsg[ErrorType.TypeError]('number', 'boolean') },
        ]));
        assertValidErr({ a: true, b: true, c: 1 }, 'logic/ABCD4', ErrorMsg[ErrorType.UnionMembersNotMatch]([
            { errMsg: 'Property `a`: ' + ErrorMsg[ErrorType.TypeError]('string', 'boolean') },
            { errMsg: 'Property `b`: ' + ErrorMsg[ErrorType.TypeError]('string', 'boolean') },
            { errMsg: 'Property `a`: ' + ErrorMsg[ErrorType.TypeError]('number', 'boolean') },
        ]));
        assertValidErr({ a: 1, b: 1, c: 1 }, 'logic/ABCD4', undefined);
    })

    it('Basic Intersection', function () {
        let validator = new TSBufferValidator({
            'a/a1': {
                type: SchemaType.Intersection,
                members: [
                    { id: 0, type: { type: SchemaType.String } },
                    { id: 1, type: { type: SchemaType.String } },
                ]
            },
            'a/a2': {
                type: SchemaType.Intersection,
                members: [
                    { id: 0, type: { type: SchemaType.String } },
                    { id: 1, type: { type: SchemaType.Any } },
                ]
            }
        });

        assert.deepStrictEqual(validator.validate('abc', 'a/a1'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate('abc', 'a/a2'), ValidateResultUtil.succ);
        assert.deepStrictEqual(validator.validate(123, 'a/a1').errMsg, ErrorMsg[ErrorType.TypeError]('string', 'number'));
        assert.deepStrictEqual(validator.validate(123, 'a/a2').errMsg, ErrorMsg[ErrorType.TypeError]('string', 'number'));
    });

    it('unionTypesNotMatch', function () {
        assertValidErr([1, 2, 3], 'logic/ME_Final', ErrorMsg[ErrorType.TypeError]('Object', 'Array'));
        assertValidErr({
            type: 'me2',
            value2: {
                value: [{ a: 'xx' }, { b: 'xx' }]
            },
            value1: 123,
            value3: 1234
        }, 'logic/ME_Final', undefined);
        assertValidErr({
            type: 'me2',
            value1: 123,
            value3: 1234
        }, 'logic/ME_Final', ErrorMsg[ErrorType.MissingRequiredProperty]('value2'));
    })
})