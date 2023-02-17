import * as ts from 'typescript';
import * as fs from 'fs';

let src = ts.createSourceFile(
  'DemoFile.ts',
  fs.readFileSync('DemoFile.ts').toString(),
  ts.ScriptTarget.ES3,
  true,
  ts.ScriptKind.TS
);

src.forEachChild((node) => {
  // 先过滤出有名字的和import
  if ((node as any).name && ((node as any).name as any).escapedText) {
    console.log(`顶级 ${(node as any).name.text}`);
  } else if (node.kind === ts.SyntaxKind.ImportDeclaration) {
  }
});

// console.log(src.kind);
