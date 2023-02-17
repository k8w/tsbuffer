import 'k8w-extend-native';
import { ProtoGenerator } from '../../src/ProtoGenerator';
import * as path from 'path';

new ProtoGenerator({
  baseDir: path.resolve(__dirname, '../src/ProtoGenerator'),
  verbose: true,
})
  .generate(['sources/Student.ts'])
  .then((v) => {
    console.log(JSON.stringify(v, null, 2));
  });
