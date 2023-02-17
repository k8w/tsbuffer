import * as ts from "typescript";

let src = ts.createSourceFile(
    'test.ts',
    `
export namespace MyName {
    export interface MyInter{
        a: string,
        b: {aa: boolean}
    }
}
    `,
    ts.ScriptTarget.ES3,
    true,
    ts.ScriptKind.TS
);

src.forEachChild(v => {
    if (v.kind === ts.SyntaxKind.ModuleDeclaration) {
        console.log(v.flags, v.flags & ts.NodeFlags.Namespace)
    }
})

namespace SDF {

}
export default SDF;