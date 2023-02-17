export type ArrStr = string[];
export type ArrObj = { value: string }[];
export type ArrArr = ArrObj[];
export type UnionArr = (string | number)[];

export type Tuple1 = [number, string, number | undefined];
export type Tuple2 = [{ value: string }, string?, [boolean?, boolean?]?];
