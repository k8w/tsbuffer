import { EB } from './ext';

export interface Test1 {
  f0?: string;
  f2: boolean[];
  f3: {
    f30: number[];
    f32: string;
    f33: boolean;
  };
  f4: B | C;
  f5: C & B;
}

type A = any;
type B = any;
type C = any;

export interface EA {
  a: string;
}

export interface EC {
  c: string;
}

export interface Extend1 extends EB, EC, EA {
  value: string;
}
