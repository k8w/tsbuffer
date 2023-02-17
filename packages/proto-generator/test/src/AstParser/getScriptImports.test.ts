import * as assert from 'assert';
import * as ts from "typescript";
import { AstParser } from '../../../src/AstParser';

describe('astParser.getScriptImports', function () {
    const astParser = new AstParser();

    it('import A', function () {
        let src = ts.createSourceFile(
            'xxx.ts',
            `import A from 'xxxx'`,
            ts.ScriptTarget.ES3,
            true,
            ts.ScriptKind.TS
        );

        assert.deepStrictEqual(astParser.getScriptImports(src), {
            A: {
                path: 'xxxx',
                targetName: 'default'
            }
        })
    })

    it('import { A }', function () {
        let src = ts.createSourceFile(
            'xxx.ts',
            `import {A, B} from 'asdf'`,
            ts.ScriptTarget.ES3,
            true,
            ts.ScriptKind.TS
        );

        assert.deepStrictEqual(astParser.getScriptImports(src), {
            A: {
                path: 'asdf',
                targetName: 'A'
            },
            B: {
                path: 'asdf',
                targetName: 'B'
            }
        })
    })

    it('import { A as B }', function () {
        let src = ts.createSourceFile(
            'xxx.ts',
            `import {A as B, C as D, default as E} from 'asdf'`,
            ts.ScriptTarget.ES3,
            true,
            ts.ScriptKind.TS
        );

        assert.deepStrictEqual(astParser.getScriptImports(src), {
            B: {
                path: 'asdf',
                targetName: 'A'
            },
            D: {
                path: 'asdf',
                targetName: 'C'
            },
            E: {
                path: 'asdf',
                targetName: 'default'
            },
        })
    })

    it('combination test', function () {
        let src = ts.createSourceFile(
            'xxx.ts',
            `import A, {B, C as D} from 'asdf';
            import E from 'eeee';
            import { F } from 'ffff';
            import {default as H, I} from 'oooo';
            `,
            ts.ScriptTarget.ES3,
            true,
            ts.ScriptKind.TS
        );

        assert.deepStrictEqual(astParser.getScriptImports(src), {
            A: {
                path: 'asdf',
                targetName: 'default'
            },
            B: {
                path: 'asdf',
                targetName: 'B'
            },
            D: {
                path: 'asdf',
                targetName: 'C'
            },
            E: {
                path: 'eeee',
                targetName: 'default'
            },
            F: {
                path: 'ffff',
                targetName: 'F'
            },
            H: {
                path: 'oooo',
                targetName: 'default'
            },
            I: {
                path: 'oooo',
                targetName: 'I'
            }
        })
    })
})