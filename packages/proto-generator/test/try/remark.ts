import 'k8w-extend-native';
import path from "path";
import { ProtoGenerator } from "../../src/ProtoGenerator";

let generator = new ProtoGenerator({
    baseDir: path.resolve(__dirname, '../src/ProtoGenerator/sources'),
    keepComment: true
});

generator.generate('Remark.ts').then(v => {
    console.log(JSON.stringify(v, null, 2));
});