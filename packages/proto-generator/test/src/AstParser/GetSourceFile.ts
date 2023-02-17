import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

export default function GetSourceFile(filename: string) {
    return ts.createSourceFile(
        filename,
        fs.readFileSync(path.resolve(__dirname, 'sourceFiles', filename)).toString(),
        ts.ScriptTarget.ES3,
        true,
        ts.ScriptKind.TS
    )
}

export function CreateSource(source: string) {
    return ts.createSourceFile(
        'xxx.ts',
        source,
        ts.ScriptTarget.ES3,
        true,
        ts.ScriptKind.TS
    );
}