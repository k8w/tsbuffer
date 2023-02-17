export interface A {
    common1: string;
    common2: string;
    a1: string,
    a2: string
}
export interface B {
    common1: string;
    common2: string;
    b1: string,
    b2: string
}
export interface C1 extends Pick<A, 'common1' | 'common2'> { }
export interface C2 extends Pick<A & B, 'a1' | 'common2'> { c: string }
export interface C3 extends Pick<A | B, 'common1' | 'common2'> { c: string }