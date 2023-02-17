import {
  ArrayTypeSchema,
  BooleanTypeSchema,
  BufferTypeSchema,
  EnumTypeSchema,
  InterfaceReference,
  InterfaceTypeSchema,
  IntersectionTypeSchema,
  LiteralTypeSchema,
  NonNullableTypeSchema,
  NumberTypeSchema,
  ObjectTypeSchema,
  OmitTypeSchema,
  OverwriteTypeSchema,
  PartialTypeSchema,
  PickTypeSchema,
  SchemaType,
  StringTypeSchema,
  TSBufferProto,
  TSBufferSchema,
  TupleTypeSchema,
  TypeReference,
  UnionTypeSchema,
} from '@tsbuffer/schema';
import { ErrorType, stringify } from './ErrorMsg';
import { FlatInterfaceTypeSchema, ProtoHelper } from './ProtoHelper';
import {
  ValidateResult,
  ValidateResultError,
  ValidateResultUtil,
} from './ValidateResultUtil';

/**
 * 单次validate的选项，会向下透传
 * @public
 */
export interface ValidateOptions extends TSBufferValidatorOptions {
  /**
   * Common properties from Union/Intersection type
   * ( In case of they are treated as excess property and lead to validation error )
   */
  unionProperties?: string[];

  /** @internal prune and output to this object */
  prune?: ValidatePruneOptions;
}

export interface ValidatePruneOptions {
  // this value prune output
  output?: any;
  // update parent prune output
  parent?: {
    value: any;
    key: string | number;
  };
}

/** @public */
export interface TSBufferValidatorOptions {
  /**
   * 检查interface中是否包含Schema之外的字段
   *
   * 例1：
   * ```
   * type AB = { a: string, b: string };
   * let ab: AB = { a: 'x', b: 'x', c: 'x' }
   * ```
   * 字段 `c` 为 excess property，当 `excessPropertyChecks` 启用时将会报错。
   *
   * 例2：
   * ```
   * type AB = { a: string} | { b: string };
   * let ab: AB = { a: 'x', b: 'x', c: 'x' }
   * ```
   * 字段 `c` 为 excess property，当 `excessPropertyChecks` 启用时将会报错。
   *
   * 默认：`true`
   */
  excessPropertyChecks: boolean;

  /**
   * 同 `tsconfig.json` 中的 `strictNullChecks`
   * 是否使用严格等于去判定 `undefined` 和 `null`
   * @defaultValue false
   */
  strictNullChecks: boolean;

  /**
   * Clone the proto, don't change this if you don't know what it is.
   * @defaultValue true
   */
  cloneProto?: boolean;
}

const typedArrays = {
  Int8Array: Int8Array,
  Int16Array: Int16Array,
  Int32Array: Int32Array,
  BigInt64Array:
    typeof BigInt64Array !== 'undefined' ? BigInt64Array : undefined,
  Uint8Array: Uint8Array,
  Uint16Array: Uint16Array,
  Uint32Array: Uint32Array,
  BigUint64Array:
    typeof BigUint64Array !== 'undefined' ? BigUint64Array : undefined,
  Float32Array: Float32Array,
  Float64Array: Float64Array,
};

/**
 * TSBuffer Schema Validator
 * @public
 */
export class TSBufferValidator<Proto extends TSBufferProto = TSBufferProto> {
  /**
   * Default options
   */
  options: TSBufferValidatorOptions = {
    excessPropertyChecks: true,
    strictNullChecks: false,
    cloneProto: true,
  };

  proto: Proto;

  readonly protoHelper: ProtoHelper;

  constructor(proto: Proto, options?: Partial<TSBufferValidatorOptions>) {
    if (options) {
      this.options = {
        ...this.options,
        ...options,
      };
    }

    this.proto = this.options.cloneProto ? Object.merge({}, proto) : proto;

    this.protoHelper = new ProtoHelper(this.proto);
  }

  /**
   * Validate whether the value is valid to the schema
   * @param value - Value to be validated.
   * @param schemaId - Schema or schema ID.
   * For example, the schema ID for type `Test` in `a/b.ts` may be `a/b/Test`.
   */
  validate(
    value: any,
    schemaOrId: keyof Proto | TSBufferSchema,
    options?: Partial<ValidateOptions>
  ): ValidateOutput {
    let schema: TSBufferSchema;
    let schemaId: string | undefined;

    // Get schema
    if (typeof schemaOrId === 'string') {
      schemaId = schemaOrId;
      schema = this.proto[schemaId];
      if (!schema) {
        throw new Error(`Cannot find schema: ${schemaId}`);
      }
    } else {
      schema = schemaOrId as TSBufferSchema;
    }

    // Merge default options
    return this._validate(value, schema, {
      ...options,
      excessPropertyChecks:
        options?.excessPropertyChecks ?? this.options.excessPropertyChecks,
      strictNullChecks:
        options?.strictNullChecks ?? this.options.strictNullChecks,
    });
  }

  private _validate(
    value: any,
    schema: TSBufferSchema,
    options: ValidateOptions
  ) {
    let vRes: ValidateResult;

    // Validate
    switch (schema.type) {
      case SchemaType.Boolean:
        vRes = this._validateBooleanType(value, schema);
        break;
      case SchemaType.Number:
        vRes = this._validateNumberType(value, schema);
        break;
      case SchemaType.String:
        vRes = this._validateStringType(value, schema);
        break;
      case SchemaType.Array:
        vRes = this._validateArrayType(value, schema, options);
        break;
      case SchemaType.Tuple:
        vRes = this._validateTupleType(value, schema, options);
        break;
      case SchemaType.Enum:
        vRes = this._validateEnumType(value, schema);
        break;
      case SchemaType.Any:
        vRes = this._validateAnyType(value);
        break;
      case SchemaType.Literal:
        vRes = this._validateLiteralType(
          value,
          schema,
          options?.strictNullChecks ?? this.options.strictNullChecks
        );
        break;
      case SchemaType.Object:
        vRes = this._validateObjectType(value, schema);
        break;
      case SchemaType.Interface:
        vRes = this._validateInterfaceType(value, schema, options);
        break;
      case SchemaType.Buffer:
        vRes = this._validateBufferType(value, schema);
        break;
      case SchemaType.IndexedAccess:
      case SchemaType.Reference:
      case SchemaType.Keyof:
        vRes = this._validateReferenceType(value, schema, options);
        break;
      case SchemaType.Union:
        vRes = this._validateUnionType(value, schema, options);
        break;
      case SchemaType.Intersection:
        vRes = this._validateIntersectionType(value, schema, options);
        break;
      case SchemaType.Pick:
      case SchemaType.Omit:
      case SchemaType.Partial:
      case SchemaType.Overwrite:
        vRes = this._validateMappedType(value, schema, options);
        break;
      case SchemaType.Date:
        vRes = this._validateDateType(value);
        break;
      case SchemaType.NonNullable:
        vRes = this._validateNonNullableType(value, schema, options);
        break;
      case SchemaType.Custom:
        const res = schema.validate(value);
        vRes = res.isSucc
          ? ValidateResultUtil.succ
          : ValidateResultUtil.error(ErrorType.CustomError, res.errMsg);
        break;
      // 错误的type
      default:
        // @ts-expect-error
        throw new Error(`Unsupported schema type: ${schema.type}`);
    }

    // prune
    if (options?.prune) {
      // don't need prune, return original value
      if (options.prune.output === undefined) {
        options.prune.output = value;
      }
      // output to parent
      if (options.prune.parent) {
        options.prune.parent.value[options.prune.parent.key] =
          options.prune.output;
      }
    }

    return vRes;
  }

  /**
   * 修剪 Object，移除 Schema 中未定义的 Key
   * 需要确保 value 类型合法
   * @param value - value to be validated
   * @param schemaOrId -Schema or schema ID.
   * @returns Validate result and pruned value. if validate failed, `pruneOutput` would be undefined.
   */
  prune<T>(
    value: T,
    schemaOrId: string | TSBufferSchema,
    options?: Partial<ValidateOptions>
  ): PruneOutput<T> {
    const schema: TSBufferSchema =
      typeof schemaOrId === 'string' ? this.proto[schemaOrId] : schemaOrId;
    if (!schema) {
      throw new Error('Cannot find schema: ' + schemaOrId);
    }

    const prune: ValidateOptions['prune'] = {};
    const vRes = this._validate(value, schema, {
      ...options,
      prune: prune,
      excessPropertyChecks: false,
      strictNullChecks:
        options?.strictNullChecks ?? this.options.strictNullChecks,
    }) as PruneOutput<T>;
    if (vRes.isSucc) {
      vRes.pruneOutput = prune.output;
    }

    return vRes;
  }

  private _validateBooleanType(
    value: any,
    schema: BooleanTypeSchema
  ): ValidateResult {
    const type = this._getTypeof(value);
    if (type === 'boolean') {
      return ValidateResultUtil.succ;
    } else {
      return ValidateResultUtil.error(ErrorType.TypeError, 'boolean', type);
    }
  }

  private _validateNumberType(
    value: any,
    schema: NumberTypeSchema
  ): ValidateResult {
    // 默认为double
    const scalarType = schema.scalarType || 'double';

    // Wrong Type
    const type = this._getTypeof(value);
    const rightType = scalarType.indexOf('big') > -1 ? 'bigint' : 'number';
    if (type !== rightType) {
      return ValidateResultUtil.error(ErrorType.TypeError, rightType, type);
    }

    // scalarType类型检测
    // 整形却为小数
    if (
      scalarType !== 'double' &&
      type === 'number' &&
      !Number.isInteger(value)
    ) {
      return ValidateResultUtil.error(
        ErrorType.InvalidScalarType,
        value,
        scalarType
      );
    }
    // 无符号整形却为负数
    if (scalarType.indexOf('uint') > -1 && value < 0) {
      return ValidateResultUtil.error(
        ErrorType.InvalidScalarType,
        value,
        scalarType
      );
    }

    return ValidateResultUtil.succ;
  }

  private _validateStringType(
    value: any,
    schema: StringTypeSchema
  ): ValidateResult {
    const type = this._getTypeof(value);
    return type === 'string'
      ? ValidateResultUtil.succ
      : ValidateResultUtil.error(ErrorType.TypeError, 'string', type);
  }

  private _validateArrayType(
    value: any,
    schema: ArrayTypeSchema,
    options: ValidateOptions
  ): ValidateResult {
    // is Array type
    const type = this._getTypeof(value);
    if (type !== SchemaType.Array) {
      return ValidateResultUtil.error(
        ErrorType.TypeError,
        SchemaType.Array,
        type
      );
    }

    // prune output
    const prune = options.prune;
    if (prune) {
      prune.output = Array.from({ length: value.length });
    }

    // validate elementType
    for (let i = 0; i < value.length; ++i) {
      const elemValidateResult = this._validate(value[i], schema.elementType, {
        ...options,
        prune: prune?.output
          ? {
              parent: {
                value: prune.output,
                key: i,
              },
            }
          : undefined,
      });

      if (!elemValidateResult.isSucc) {
        return ValidateResultUtil.innerError(
          '' + i,
          value[i],
          schema.elementType,
          elemValidateResult
        );
      }
    }

    return ValidateResultUtil.succ;
  }

  private _validateTupleType(
    value: any,
    schema: TupleTypeSchema,
    options: ValidateOptions
  ): ValidateResult {
    // is Array type
    const type = this._getTypeof(value);
    if (type !== SchemaType.Array) {
      return ValidateResultUtil.error(
        ErrorType.TypeError,
        SchemaType.Array,
        type
      );
    }

    const prune = options.prune;

    // validate length
    // excessPropertyChecks 与 prune互斥
    if (
      !prune &&
      options.excessPropertyChecks &&
      value.length > schema.elementTypes.length
    ) {
      return ValidateResultUtil.error(
        ErrorType.TupleOverLength,
        value.length,
        schema.elementTypes.length
      );
    }

    // prune output
    if (prune) {
      prune.output = Array.from({
        length: Math.min(value.length, schema.elementTypes.length),
      });
    }

    // validate elementType
    for (let i = 0; i < schema.elementTypes.length; ++i) {
      // MissingRequiredProperty: NotOptional && is undefined
      if (
        value[i] === undefined ||
        (value[i] === null && !options.strictNullChecks)
      ) {
        const canBeNull = this._canBeNull(schema.elementTypes[i]);
        const canBeUndefined =
          (schema.optionalStartIndex !== undefined &&
            i >= schema.optionalStartIndex) ||
          this._canBeUndefined(schema.elementTypes[i]);
        const isOptional =
          canBeUndefined || (!options.strictNullChecks && canBeNull);
        // skip undefined property
        if (isOptional) {
          // Prune null & undefined->null
          if (prune?.output) {
            if (
              (value[i] === null && canBeNull) ||
              (value[i] === undefined && !canBeUndefined && canBeNull)
            ) {
              prune.output[i] = null;
            }
          }

          continue;
        } else {
          return ValidateResultUtil.error(ErrorType.MissingRequiredProperty, i);
        }
      }

      // element type check
      const elemValidateResult = this._validate(
        value[i],
        schema.elementTypes[i],
        {
          prune: prune?.output
            ? {
                parent: {
                  value: prune.output,
                  key: i,
                },
              }
            : undefined,
          strictNullChecks: options.strictNullChecks,
          excessPropertyChecks: options.excessPropertyChecks,
        }
      );
      if (!elemValidateResult.isSucc) {
        return ValidateResultUtil.innerError(
          '' + i,
          value[i],
          schema.elementTypes[i],
          elemValidateResult
        );
      }
    }

    return ValidateResultUtil.succ;
  }

  private _canBeUndefined(schema: TSBufferSchema): boolean {
    if (schema.type === SchemaType.Union) {
      return schema.members.some((v) => this._canBeUndefined(v.type));
    }

    if (schema.type === SchemaType.Literal && schema.literal === undefined) {
      return true;
    }

    return false;
  }

  private _canBeNull(schema: TSBufferSchema): boolean {
    if (schema.type === SchemaType.Union) {
      return schema.members.some((v) => this._canBeNull(v.type));
    }

    if (schema.type === SchemaType.Literal && schema.literal === null) {
      return true;
    }

    return false;
  }

  private _validateEnumType(
    value: any,
    schema: EnumTypeSchema
  ): ValidateResult {
    // must be string or number
    const type = this._getTypeof(value);
    if (type !== 'string' && type !== 'number') {
      return ValidateResultUtil.error(
        ErrorType.TypeError,
        'string | number',
        type
      );
    }

    // 有值与预设相同
    if (schema.members.some((v) => v.value === value)) {
      return ValidateResultUtil.succ;
    } else {
      return ValidateResultUtil.error(ErrorType.InvalidEnumValue, value);
    }
  }

  private _validateAnyType(value: any): ValidateResult {
    return ValidateResultUtil.succ;
  }

  private _validateLiteralType(
    value: any,
    schema: LiteralTypeSchema,
    strictNullChecks: boolean
  ): ValidateResult {
    // 非strictNullChecks严格模式，null undefined同等对待
    if (
      !strictNullChecks &&
      (schema.literal === null || schema.literal === undefined)
    ) {
      return value === null || value === undefined
        ? ValidateResultUtil.succ
        : ValidateResultUtil.error(
            ErrorType.InvalidLiteralValue,
            schema.literal,
            value
          );
    }

    return value === schema.literal
      ? ValidateResultUtil.succ
      : ValidateResultUtil.error(
          ErrorType.InvalidLiteralValue,
          schema.literal,
          value
        );
  }

  private _validateObjectType(
    value: any,
    schema: ObjectTypeSchema
  ): ValidateResult {
    const type = this._getTypeof(value);
    return type === 'Object' || type === 'Array'
      ? ValidateResultUtil.succ
      : ValidateResultUtil.error(ErrorType.TypeError, 'Object', type);
  }

  private _validateInterfaceType(
    value: any,
    schema: InterfaceTypeSchema | InterfaceReference,
    options: ValidateOptions
  ): ValidateResult {
    const type = this._getTypeof(value);
    if (type !== 'Object') {
      return ValidateResultUtil.error(ErrorType.TypeError, 'Object', type);
    }

    // 先展平
    let flatSchema = this.protoHelper.getFlatInterfaceSchema(schema);

    // From union or intersecton type
    if (options.unionProperties) {
      flatSchema = this.protoHelper.applyUnionProperties(
        flatSchema,
        options.unionProperties
      );
    }

    return this._validateFlatInterface(value, flatSchema, options);
  }

  private _validateMappedType(
    value: any,
    schema:
      | PickTypeSchema
      | OmitTypeSchema
      | PartialTypeSchema
      | OverwriteTypeSchema,
    options: ValidateOptions
  ): ValidateResult {
    const parsed = this.protoHelper.parseMappedType(schema);
    if (parsed.type === SchemaType.Interface) {
      return this._validateInterfaceType(value, schema, options);
    } else if (parsed.type === SchemaType.Union) {
      return this._validateUnionType(value, parsed, options);
    } else if (parsed.type === SchemaType.Intersection) {
      return this._validateIntersectionType(value, parsed, options);
    }

    // @ts-expect-error
    throw new Error(`Invalid ${schema.type} target type: ${parsed.type}`);
  }

  private _validateFlatInterface(
    value: any,
    schema: FlatInterfaceTypeSchema,
    options: ValidateOptions
  ) {
    // interfaceSignature强制了key必须是数字的情况
    if (
      schema.indexSignature &&
      schema.indexSignature.keyType === SchemaType.Number
    ) {
      for (const key in value) {
        if (!this._isNumberKey(key)) {
          return ValidateResultUtil.error(ErrorType.InvalidNumberKey, key);
        }
      }
    }

    const prune = options.prune;
    if (prune) {
      prune.output = {};
    }

    // Excess property check (与prune互斥)
    if (!prune && options.excessPropertyChecks && !schema.indexSignature) {
      const validProperties = schema.properties.map((v) => v.name);
      const firstExcessProperty = Object.keys(value).find(
        (v) => validProperties.indexOf(v) === -1
      );
      if (firstExcessProperty) {
        return ValidateResultUtil.error(
          ErrorType.ExcessProperty,
          firstExcessProperty
        );
      }
    }

    // 校验properties
    if (schema.properties) {
      for (const property of schema.properties) {
        // MissingRequiredProperty: is undefined && !isOptional
        if (
          value[property.name] === undefined ||
          (value[property.name] === null && !options.strictNullChecks)
        ) {
          const canBeNull = this._canBeNull(property.type);
          const canBeUndefined =
            property.optional || this._canBeUndefined(property.type);
          const isOptional =
            canBeUndefined || (!options.strictNullChecks && canBeNull);
          // skip undefined optional property
          if (isOptional) {
            // Prune null & undefined->null
            if (prune?.output) {
              if (
                (value[property.name] === null && canBeNull) ||
                (value[property.name] === undefined &&
                  !canBeUndefined &&
                  canBeNull)
              ) {
                prune.output[property.name] = null;
              }
            }

            continue;
          } else {
            return ValidateResultUtil.error(
              ErrorType.MissingRequiredProperty,
              property.name
            );
          }
        }

        // property本身验证
        const vRes = this._validate(value[property.name], property.type, {
          prune:
            prune?.output && property.id > -1
              ? {
                  parent: {
                    value: prune.output,
                    key: property.name,
                  },
                }
              : undefined,
          strictNullChecks: options.strictNullChecks,
          excessPropertyChecks: options.excessPropertyChecks,
        });
        if (!vRes.isSucc) {
          return ValidateResultUtil.innerError(
            property.name,
            value[property.name],
            property.type,
            vRes
          );
        }
      }
    }

    // 检测indexSignature
    if (schema.indexSignature) {
      for (const key in value) {
        // only prune is (property is pruned already)
        // let memberPrune: ValidatePruneOptions | undefined = schema.properties.some(v => v.name === key) ? undefined : {};

        // validate each field
        const vRes = this._validate(value[key], schema.indexSignature.type, {
          prune: prune?.output
            ? {
                parent: {
                  value: prune.output,
                  key: key,
                },
              }
            : undefined,
          strictNullChecks: options.strictNullChecks,
          excessPropertyChecks: options.excessPropertyChecks,
        });
        if (!vRes.isSucc) {
          return ValidateResultUtil.innerError(
            key,
            value[key],
            schema.indexSignature.type,
            vRes
          );
        }
      }
    }

    return ValidateResultUtil.succ;
  }

  private _validateBufferType(
    value: any,
    schema: BufferTypeSchema
  ): ValidateResult {
    const type = this._getTypeof(value);
    if (type !== 'Object') {
      return ValidateResultUtil.error(
        ErrorType.TypeError,
        schema.arrayType || 'ArrayBuffer',
        type
      );
    } else if (schema.arrayType) {
      const typeArrayClass = typedArrays[schema.arrayType];
      if (!typeArrayClass) {
        throw new Error(`Error TypedArray type: ${schema.arrayType}`);
      }
      return value instanceof typeArrayClass
        ? ValidateResultUtil.succ
        : ValidateResultUtil.error(
            ErrorType.TypeError,
            schema.arrayType,
            value?.constructor?.name
          );
    } else {
      return value instanceof ArrayBuffer
        ? ValidateResultUtil.succ
        : ValidateResultUtil.error(
            ErrorType.TypeError,
            'ArrayBuffer',
            value?.constructor?.name
          );
    }
  }

  private _validateReferenceType(
    value: any,
    schema: TypeReference,
    options: ValidateOptions
  ): ValidateResult {
    return this._validate(
      value,
      this.protoHelper.parseReference(schema),
      options
    );
  }

  private _validateUnionType(
    value: any,
    schema: UnionTypeSchema,
    options: ValidateOptions
  ): ValidateResult {
    options.unionProperties =
      options.unionProperties || this.protoHelper.getUnionProperties(schema);

    let isObjectPrune = false;
    const prune = options.prune;
    if (prune && value && Object.getPrototypeOf(value) === Object.prototype) {
      isObjectPrune = true;
      prune.output = {};
    }

    // 有一成功则成功
    let isSomeSucc = false;
    const memberErrors: ValidateResultError[] = [];
    for (let i = 0; i < schema.members.length; ++i) {
      const member = schema.members[i];
      const memberType = this.protoHelper.isTypeReference(member.type)
        ? this.protoHelper.parseReference(member.type)
        : member.type;
      const memberPrune: ValidatePruneOptions | undefined = prune
        ? {}
        : undefined;
      const vRes: ValidateResult = this._validate(value, memberType, {
        ...options,
        prune: memberPrune,
      });

      if (vRes.isSucc) {
        isSomeSucc = true;

        // if prune object: must prune all members
        if (isObjectPrune) {
          prune!.output = {
            ...prune!.output,
            ...memberPrune!.output,
          };
        }
        // not prune object: stop checking after 1st member matched
        else {
          break;
        }
      } else {
        memberErrors.push(vRes);
      }
    }

    // 有一成功则成功;
    if (isSomeSucc) {
      return ValidateResultUtil.succ;
    }
    // 全部失败，则失败
    else {
      // All member error is the same, return the first
      const msg0 = memberErrors[0].errMsg;
      if (memberErrors.every((v) => v.errMsg === msg0)) {
        return memberErrors[0];
      }

      // mutual exclusion: return the only one
      const nonLiteralErrors = memberErrors.filter(
        (v) => v.error.type !== ErrorType.InvalidLiteralValue
      );
      if (nonLiteralErrors.length === 1) {
        return nonLiteralErrors[0];
      }

      // All member error without inner: show simple msg
      if (
        memberErrors.every(
          (v) =>
            !v.error.inner &&
            (v.error.type === ErrorType.TypeError ||
              v.error.type === ErrorType.InvalidLiteralValue)
        )
      ) {
        const valueType = this._getTypeof(value);
        const expectedTypes = memberErrors
          .map((v) =>
            v.error.type === ErrorType.TypeError
              ? v.error.params[0]
              : this._getTypeof(v.error.params[0])
          )
          .distinct();

        // Expected type A|B|C, actually type D
        if (expectedTypes.indexOf(valueType) === -1) {
          return ValidateResultUtil.error(
            ErrorType.TypeError,
            expectedTypes.join(' | '),
            this._getTypeof(value)
          );
        }

        // `'D'` is not matched to `'A'|'B'|'C'`
        if (valueType !== 'Object' && valueType !== SchemaType.Array) {
          const types = memberErrors
            .map((v) =>
              v.error.type === ErrorType.TypeError
                ? v.error.params[0]
                : stringify(v.error.params[0])
            )
            .distinct();
          return ValidateResultUtil.error(
            ErrorType.UnionTypesNotMatch,
            value,
            types
          );
        }
      }

      // other errors
      return ValidateResultUtil.error(
        ErrorType.UnionMembersNotMatch,
        memberErrors
      );
    }
  }

  private _validateIntersectionType(
    value: any,
    schema: IntersectionTypeSchema,
    options: ValidateOptions
  ): ValidateResult {
    options.unionProperties =
      options.unionProperties || this.protoHelper.getUnionProperties(schema);

    let isObjectPrune = false;
    const prune = options.prune;
    if (prune && value && Object.getPrototypeOf(value) === Object.prototype) {
      prune.output = {};
      isObjectPrune = true;
    }

    // 有一失败则失败
    for (let i = 0, len = schema.members.length; i < len; ++i) {
      // 验证member
      let memberType = schema.members[i].type;
      memberType = this.protoHelper.isTypeReference(memberType)
        ? this.protoHelper.parseReference(memberType)
        : memberType;
      const memberPrune: ValidatePruneOptions | undefined = prune
        ? {}
        : undefined;

      const vRes: ValidateResult = this._validate(value, memberType, {
        ...options,
        prune: memberPrune,
      });

      // 有一失败则失败
      if (!vRes.isSucc) {
        return vRes;
      }

      if (isObjectPrune) {
        prune!.output = {
          ...prune!.output,
          ...memberPrune!.output,
        };
      }
    }

    // 全成功则成功
    return ValidateResultUtil.succ;
  }

  private _validateDateType(value: any): ValidateResult {
    if (value instanceof Date) {
      return ValidateResultUtil.succ;
    } else {
      return ValidateResultUtil.error(
        ErrorType.TypeError,
        'Date',
        this._getTypeof(value)
      );
    }
  }

  private _validateNonNullableType(
    value: any,
    schema: NonNullableTypeSchema,
    options: ValidateOptions
  ): ValidateResult {
    const type = this._getTypeof(value);
    if (
      (type === 'null' || type === 'undefined') &&
      schema.target.type !== 'Any'
    ) {
      return ValidateResultUtil.error(ErrorType.TypeError, 'NonNullable', type);
    }
    return this._validate(value, schema.target, options);
  }

  private _isNumberKey(key: string): boolean {
    const int = parseInt(key);
    return !(isNaN(int) || '' + int !== key);
  }

  private _getTypeof(
    value: any
  ):
    | 'string'
    | 'number'
    | 'bigint'
    | 'boolean'
    | 'symbol'
    | 'undefined'
    | 'Object'
    | 'function'
    | 'Array'
    | 'null' {
    const type = typeof value;
    if (type === 'object') {
      if (value === null) {
        return 'null';
      } else if (Array.isArray(value)) {
        return SchemaType.Array;
      } else {
        return 'Object';
      }
    }

    return type;
  }
}

/** @public */
export type ValidateOutput =
  | { isSucc: true; errMsg?: undefined }
  | { isSucc: false; errMsg: string }; /** @public */
/** @public */
export type PruneOutput<T> =
  | { isSucc: true; pruneOutput: T; errMsg?: undefined }
  | { isSucc: false; errMsg: string; pruneOutput?: undefined };
