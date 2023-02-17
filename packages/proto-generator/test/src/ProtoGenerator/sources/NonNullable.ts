export interface Wrapper {
    value1?: string,
    value2: null | string | undefined
}
export type Value3 = string | null | undefined;
export type NonNullable1 = NonNullable<Wrapper['value1']>;
export type NonNullable2 = NonNullable<Wrapper['value2']>;
export type NonNullable3 = NonNullable<Value3>;