import 'k8w-extend-native';
import * as path from "path";
import { ProtoGenerator } from '../../../src/ProtoGenerator';

(async function main() {
    let generator = new ProtoGenerator({
        baseDir: path.resolve(__dirname)
    });
    let schemas = await generator.generate(['sources/Student.ts']);
    console.log(JSON.stringify(schemas, null, 2))
})();