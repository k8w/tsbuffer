export interface InterfaceName {
    a: string,
    b: number;
    c?: boolean[];
    d?: {
        value: string,
        date: number
    }
}

export enum TestEnum {
    a,
    b,
    c,
    d = 100,
    e,
    f
}

export type TypeName = {
    value: TestEnum
}