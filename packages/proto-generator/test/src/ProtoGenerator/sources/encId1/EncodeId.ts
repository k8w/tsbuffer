export interface Test1 {
    f0: string;
    f1: number;
    f2: boolean[];
}

export interface EA {
    a: string;
}

export interface EB {
    b: string;
}

export interface Extend1 extends EA, EB {
    value: string;
}