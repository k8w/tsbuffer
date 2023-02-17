/**
 * Enum for every possible `TSBufferSchema['type']`
 */
export class SchemaType {
  // #region 确定的TypeScript的类型
  static Boolean = 'Boolean' as const;
  static Number = 'Number' as const;
  static String = 'String' as const;
  static Array = 'Array' as const;
  static Tuple = 'Tuple' as const;
  static Enum = 'Enum' as const;
  static Any = 'Any' as const;
  static Literal = 'Literal' as const;
  static Object = 'Object' as const;
  static Interface = 'Interface' as const;
  static Buffer = 'Buffer' as const;
  static IndexedAccess = 'IndexedAccess' as const;
  static Reference = 'Reference' as const;
  static Keyof = 'Keyof' as const;
  static Union = 'Union' as const;
  static Intersection = 'Intersection' as const;
  static NonNullable = 'NonNullable' as const;
  static Date = 'Date' as const;
  // #endregion

  // #region 非TypeScript基本类型，临时过渡用
  static Pick = 'Pick' as const;
  static Partial = 'Partial' as const;
  static Omit = 'Omit' as const;
  static Overwrite = 'Overwrite' as const;
  // #endregion

  static Custom = 'Custom' as const;
}
