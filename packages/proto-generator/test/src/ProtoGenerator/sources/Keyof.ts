export type Obj1 = {
    aa: string,
    bb: number,
    cc: {
        c1: string,
        c2: boolean[],
        c3: boolean
    }
};

export interface Obj2 {
    bb: string,
    cc: any[],
    dd: string
}

export type key1 = keyof Obj1;
export type key2 = keyof Obj2;
export type key3 = 'bb' | 'cc';
export type keyUnion = key1 | key2;
export type keyIntersection = key1 & key2;

export type Pick1 = Pick<Obj1, 'bb' | 'cc'>;
export type Pick2 = Pick<Obj2, key3>;
export type Omit3 = Omit<Obj1, keyIntersection>;