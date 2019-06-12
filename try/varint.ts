import { Varint64 } from '../src/models/Varint64';

let v = Varint64.from(-1);
console.log((v as any)._uint32s);
v.zzEncode();
console.log((v as any)._uint32s);
v.zzDecode();
console.log((v as any)._uint32s);