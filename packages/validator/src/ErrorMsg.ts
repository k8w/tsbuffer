/** @internal */
export enum ErrorType {
    TypeError = 'TypeError',
    InvalidScalarType = 'InvalidScalarType',
    TupleOverLength = 'TupleOverLength',
    InvalidEnumValue = 'InvalidEnumValue',
    InvalidLiteralValue = 'InvalidLiteralValue',
    MissingRequiredProperty = 'MissingRequiredProperty',
    ExcessProperty = 'ExcessProperty',
    InvalidNumberKey = 'InvalidNumberKey',
    UnionTypesNotMatch = 'UnionTypesNotMatch',
    UnionMembersNotMatch = 'UnionMembersNotMatch',
    CustomError = 'CustomError'
}

/** @internal */
export const ErrorMsg = {
    [ErrorType.TypeError]: (expect: string, actual: string) => `Expected type to be \`${expect}\`, actually \`${actual}\`.`,
    [ErrorType.InvalidScalarType]: (value: number | bigint, scalarType: string) => `\`${value}\` is not a valid \`${scalarType}\`.`,
    [ErrorType.TupleOverLength]: (valueLength: number, schemaLength: number) => `Value has ${valueLength} elements but schema allows only ${schemaLength}.`,
    [ErrorType.InvalidEnumValue]: (value: string | number) => `\`${value}\` is not a valid enum member.`,
    [ErrorType.InvalidLiteralValue]: (expected: any, actual: any) => `Expected to equals \`${stringify(expected)}\`, actually \`${stringify(actual)}\``,
    [ErrorType.MissingRequiredProperty]: (propName: string | number) => `Missing required property \`${propName}\`.`,
    [ErrorType.ExcessProperty]: (propName: string | number) => `Excess property \`${propName}\` should not exists.`,
    [ErrorType.InvalidNumberKey]: (key: string) => `\`${key}\` is not a valid key, the key here should be a \`number\`.`,

    // Union
    [ErrorType.UnionTypesNotMatch]: (value: any, types: string[]) => `\`${stringify(value)}\` is not matched to \`${types.join(' | ')}\``,
    [ErrorType.UnionMembersNotMatch]: (memberErrors: { errMsg: string }[]) => `No union member matched, detail:\n${memberErrors.map((v, i) => `  <${i}> ${v.errMsg}`).join('\n')}`,

    [ErrorType.CustomError]: (errMsg: string) => errMsg
};

/** @internal */
export function stringify(value: any) {
    if (typeof value === 'string') {
        const output = JSON.stringify(value);
        return "'" + output.substr(1, output.length - 2) + "'";
    }
    return JSON.stringify(value);
}