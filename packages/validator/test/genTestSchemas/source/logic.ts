type A = { a: string };
type B = { b: string };
type C = { c: string };
type D = { d: string };

export type AB = A & B;
export type CD = C | D;
export type ABC = (A & B) & C;
export type BCD = B | (C | D);
export type ABCD = (A & B) | (C & D);
export type ABCD1 = A | (B & C) | D;
export type ABCD2 = (A & B) | (B & C) | (C & D);
export type ABCD3 = A & (B | C) & D & { [key: string]: string | number };
export type ABCD4 = A | B | { [key: string]: number };
export type AOrNull = A | null;
export type AOrNullArr = AOrNull[];

export type Conflict = { value: string } & { value: number };
export type Conflict2 =
  | { type: 'string'; value: string }
  | { type: 'number'; value: number };

// mutual exclusion
export interface BaseME {
  common?: {
    value: string;
  };
}
export interface ME_1 extends BaseME {
  type: 'me1';
  value1: {
    value: number;
  };
}
export interface ME_2 extends BaseME {
  type: 'me2';
  value2: {
    value: [A, B, C?];
  };
}
export interface ME_3 extends BaseME {
  type: 'me3';
  value3: {
    value: AB[];
  };
}
export type ME_Final = ME_1 | ME_2 | ME_3;
