import { Overwrite } from "k8w-extend-native";

export interface Base {
    name: string,
    orders?: number[],
    sex?: {
        value: 'm' | 'f'
    }
}

export type key1 = 'name' | 'orders';
export type key2_A = 'a' | 'b' | 'name' | 'orders';
export type key2_B = 'c' | 'd' | 'name' | 'orders';
export type key2 = key2_A & key2_B;
export interface ObjKey3 {
    name: string,
    orders: string
}
export type key3 = keyof ObjKey3;

export type Pick1 = Pick<Base, 'name'>;
export type Pick2 = Pick<Base, 'name' | 'orders'>;
export type Pick2_1 = Pick<Base, key1>;
export type Pick2_2 = Pick<Base, key2>;
export type Pick2_3 = Pick<Base, keyof ObjKey3>;
export type Pick2_4 = Pick<Base, key3>;
export type Pick3 = Pick<Pick2, 'orders'>;

export type Partial1 = Partial<Base>;
export type Partial2 = Partial<Pick2>;

export type Omit1 = Omit<Base, 'sex'>;
export type Omit2 = Omit<Pick2, 'orders'>;
export type Omit3 = Omit<Omit1, 'name'>;
export type Omit4_1 = Omit<Base, key1>;
export type Omit4_2 = Omit<Base, key2>;
export type Omit4_3 = Omit<Base, keyof ObjKey3>;
export type Omit4_4 = Omit<Base, key3>;


export type Overwrite1 = Overwrite<Base, {
    sex: 'm' | 'f';
    other: string
}>;
export type Overwrite2 = Overwrite<Pick<Base, 'name' | 'sex'>, {
    sex: 'm' | 'f';
    other: string
}>

// indexSignature
export interface Base1 {
    a: string,
    b: number,
    [key: string]: string | number
}

export type IPick = Pick<Base1, 'a' | 'c'>;
export type IPartial = Partial<Base1>;
export type IOmit = Omit<Base1, 'b' | 'c'>;
export type IOverwrite1 = Overwrite<Base1, {
    a: number,
    b: string
}>
export type IOverwrite2 = Overwrite<Base1, {
    b: string
    [key: string]: string
}>

export interface A {
    type: 'A',
    common: string,
    valueA: string,
    common1?: string,
    common2?: string,
}
export interface B {
    type: 'B',
    common: string,
    valueB: string,
    common1?: string,
    common2?: string,
}
export type AB = A | B;
export type PickAB = Pick<AB, 'type' | 'common'>;
export type OmitAB = Omit<AB, 'common' | 'common1'>;
// only common
export type NestedAB = Pick<Omit<Pick<AB, 'type' | 'common' | 'common1'>, 'common1' | 'type'>, 'common'>
export type PartialAB = Partial<AB>;
export type PartialPick = Partial<PickAB>;
export type PickPartial = Pick<PartialAB, 'type'>;

export type PickIntersection1 = Pick<{ a: string, b: string } & { c: string, d: string }, 'a' | 'c'>;
export type OmitIntersection1 = Omit<{ a: string, b: string } & { c: string, d: string }, 'b' | 'd'>;
export type PickIntersection2 = Pick<({ type: 'a', value: { a: string } } | { type: 'b', value: { b: string } }) & { meta: string }, 'type' | 'value'>;
export type OmitIntersection2 = Omit<({ type: 'a', value: { a: string } } | { type: 'b', value: { b: string } }) & { meta: string }, 'meta'>;

export interface Wrapper {
    time: Date,
    value1?: string,
    value2: null | string | undefined,
    value4?: {
        a?: {
            b?: string | null
        } | null
    } | null
}
export type Value3 = string | null | undefined;
export type NonNullable1 = NonNullable<Wrapper['value1']>;
export type NonNullable2 = NonNullable<Wrapper['value2']>;
export type NonNullable3 = NonNullable<Value3>;
export type NonNullable4 = NonNullable<Wrapper['value4']>;

export interface ExtendPick2 extends Pick2 {
    xxx: string
}
export interface ExtendOmit2 extends Omit2 {
    xxx: string
}