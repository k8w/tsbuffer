export interface Test1 {
  a: string;
  b: number;
  c?: boolean;
  d: {
    d1?: string;
    d2: string[];
  };
  e: Array<number[]>;
}

interface Test2 {
  a1: string;
  b1: number;
}

export interface Test3 {
  a2: boolean[];
  b2: {
    test: string;
  };
}

export default interface Test4 {
  a3: string[];
}
