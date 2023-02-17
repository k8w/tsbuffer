import * as fs from "fs";
import 'k8w-extend-native';
import * as path from "path";
import * as ts from "typescript";
import { AstParser } from '../../src/AstParser';

let src = ts.createSourceFile(
    path.resolve(__dirname, 'DemoFile.ts'),
    fs.readFileSync(path.resolve(__dirname, 'DemoFile.ts')).toString(),
    ts.ScriptTarget.ES3,
    true,
    ts.ScriptKind.TS
);

let res = AstParser.getFlattenNodes(src);
let schema = AstParser.node2schema(res['TestNew'].node, {});
console.log(JSON.stringify(schema, null, 2))