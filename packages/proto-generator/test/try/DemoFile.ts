
export default interface Test1 {
    a: string,
    b: number
}

export interface Tes_t2 {
    c: string,
    d: {
        d1: string,
        d2?: boolean
    }
}

// asdgasdgasdg


interface T啊est3 {
    e: boolean;
    f?: number;
}

/**
 * asdgasdg
 * asdg
 * asdg
 * as
 * dgas
 * dg
 */

const a = 1;
let b = 234;
function test214123() {
    console.log('asdg')
};

console.log('asdgasdg')

async function test() {

}

new Promise(rs => { }).then(() => { })

export namespace Ns1 {
    export type tttt = any;
    interface asdfasdf {
        a: string,
        b: number
    }
    export namespace Ns2 {
        export type Tany = any;
    }
}

export type V1 = string | null | undefined;
export interface V2 {
    value1?: string;
    value2?: string | null;
}
export interface TestNew {
    time: Date,
    value: NonNullable<V1>,
    value1: NonNullable<V2['value1']>,
    value2: NonNullable<V2['value2']>
}
