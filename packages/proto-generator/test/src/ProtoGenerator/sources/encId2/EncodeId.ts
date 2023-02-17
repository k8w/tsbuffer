export interface Test1 {
  f0?: string;
  f2: boolean[];
  f3: {
    f30: number[];
    f31: string;
    f32: any;
  };
  f4: A | B | A;
  f5: A & B & A;
}

type A = any;
type B = any;

export interface EA {
  a: string;
}

export interface EB {
  b: string;
}

export interface Extend1 extends EB, EA {
  value: string;
}
