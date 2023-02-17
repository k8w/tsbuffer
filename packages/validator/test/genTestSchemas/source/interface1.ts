export default interface Interface1 {
  a: string;
  b: number;
}

export interface Interface2 {
  c: boolean;
  d?: string;
}

export interface Interface2_1 {
  name: string;
  sex: 'm' | 'f';
  [key: string]: string;
}

export interface Interface2_2 {
  [key: number]: string;
}

export interface Interface3 {
  value1: Interface1;
  value2: Interface2;
}

export interface Interface4 extends Interface3 {
  value3: {
    a: string;
    b: string;
  };
  value4?: {
    c: string;
    d: string;
  };
}
