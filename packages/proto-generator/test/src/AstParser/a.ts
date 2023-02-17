interface A {
    common1: string;
    common2: string;
    a1: string,
    a2: string
}
interface B {
    common1: string;
    common2: string;
    b1: string,
    b2: string
}
interface C1 extends Pick<A, 'common1' | 'common2'> { }
interface C2 extends Pick<A & B, 'a1' | 'common2'> {
    c: string
}
interface C3 extends Pick<A | B, 'common1' | 'common2'> {
    c: string
}