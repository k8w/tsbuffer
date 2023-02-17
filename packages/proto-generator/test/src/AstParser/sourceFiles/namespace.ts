export interface Test1 {
    a: string,
    b?: number[]
}

export interface Test2 {
    c: boolean | { value: boolean }
}

export namespace TestNS {
    export interface NsIf1 {
        value1: string;
    }

    interface NsIf2 {
        value2: number[]
    }

    export type NsTp3 = NsIf1 | NsIf2;
}