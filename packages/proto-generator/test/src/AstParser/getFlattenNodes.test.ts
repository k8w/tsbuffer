import * as assert from 'assert';
import { AstParser } from '../../../src/AstParser';
import GetSourceFile from './GetSourceFile';
import * as ts from "typescript";

describe('astParser.getFlattenNodes', function () {
    const astParser = new AstParser();
    it('normal', function () {
        let res = astParser.getFlattenNodes(GetSourceFile('normal.ts'), true);
        assert.deepStrictEqual(Object.entries(res).map(v => ({
            name: v[0],
            isExport: v[1].isExport
        })), [
            {
                name: 'Test1',
                isExport: true
            },
            {
                name: 'Test2',
                isExport: false
            },
            {
                name: 'Test3',
                isExport: true
            },
            {
                name: 'Test4',
                isExport: false
            },
            {
                name: 'default',
                isExport: true
            }
        ]);
    })

    it('normal top non export', function () {
        let res = astParser.getFlattenNodes(GetSourceFile('normal.ts'), false);
        assert.deepStrictEqual(Object.entries(res).map(v => ({
            name: v[0],
            isExport: v[1].isExport
        })), [
            {
                name: 'Test1',
                isExport: false
            },
            {
                name: 'Test2',
                isExport: false
            },
            {
                name: 'Test3',
                isExport: false
            },
            {
                name: 'Test4',
                isExport: false
            },
        ]);
    })

    it('export default', function () {
        let src = ts.createSourceFile(
            'xxx.ts',
            `
interface TestName {}
export default TestName;
            `,
            ts.ScriptTarget.ES3,
            true,
            ts.ScriptKind.TS
        );

        let res = astParser.getFlattenNodes(src, true);
        assert.deepStrictEqual(Object.entries(res).map(v => ({
            name: v[0],
            isExport: v[1].isExport
        })), [
            {
                name: 'TestName',
                isExport: false
            },
            {
                name: 'default',
                isExport: true
            }
        ])
    })

    it('export { XXX }', function () {
        let src = ts.createSourceFile(
            'xxx.ts',
            `
interface TestName {}
export { TestName };
                `,
            ts.ScriptTarget.ES3,
            true,
            ts.ScriptKind.TS
        );

        let res = astParser.getFlattenNodes(src, true);
        assert.deepStrictEqual(Object.entries(res).map(v => ({
            name: v[0],
            isExport: v[1].isExport
        })), [
            {
                name: 'TestName',
                isExport: true
            }
        ])
    })

    it('export { A as B }', function () {
        let src = ts.createSourceFile(
            'xxx.ts',
            `
    interface TestName {}
    export { TestName as FuckU };
                `,
            ts.ScriptTarget.ES3,
            true,
            ts.ScriptKind.TS
        );

        let res = astParser.getFlattenNodes(src, true);
        assert.deepStrictEqual(Object.entries(res).map(v => ({
            name: v[0],
            isExport: v[1].isExport
        })), [
            {
                name: 'TestName',
                isExport: false
            },
            {
                name: 'FuckU',
                isExport: true
            }
        ])
    })

    it('complex test', function () {
        let src = ts.createSourceFile(
            'xxx.ts',
            `
// TEST 1234
import XXX from 'xxx';
import * as XX from 'asdgasdg';

const ASDT = {a:'111'};

interface Internal1{
    v1: string,
    v2?: {
        value: string
    }
}

export interface Outside1 extends Internal1 {
    value1: string,
    value2?: string[]
}

interface Out3{}

export namespace TestNS {
    interface In1{}
    export interface Out1{}
    export {In1 as Out2}
}

export default Internal1;

export {Out3};
                `,
            ts.ScriptTarget.ES3,
            true,
            ts.ScriptKind.TS
        );

        let res = astParser.getFlattenNodes(src, true);
        assert.deepStrictEqual(Object.entries(res).map(v => ({
            name: v[0],
            isExport: v[1].isExport
        })), [
            {
                name: 'Internal1',
                isExport: false
            },
            {
                name: 'Outside1',
                isExport: true
            },
            {
                name: 'Out3',
                isExport: true
            },
            {
                name: 'TestNS.In1',
                isExport: false
            },

            {
                name: 'TestNS.Out1',
                isExport: true
            },
            {
                name: 'TestNS.Out2',
                isExport: true
            },
            {
                name: 'default',
                isExport: true
            }
        ])
    })

    it('export default interface', function () {
        let src = ts.createSourceFile(
            '',
            `interface Test1{}
            export interface Test2{}
            export default interface Test3 {}`,
            ts.ScriptTarget.ES3,
            true,
            ts.ScriptKind.TS
        );

        let res = astParser.getFlattenNodes(src, true);
        assert.deepStrictEqual(Object.entries(res).map(v => ({
            name: v[0],
            isExport: v[1].isExport
        })), [
            {
                name: 'Test1',
                isExport: false
            },
            {
                name: 'Test2',
                isExport: true
            },
            {
                name: 'Test3',
                isExport: false
            },
            {
                name: 'default',
                isExport: true
            }
        ])
    })

    it('export default NS', function () {
        let src = ts.createSourceFile(
            '',
            `namespace NSTest {
                export type Test = string;
            }
            export default NSTest`,
            ts.ScriptTarget.ES3,
            true,
            ts.ScriptKind.TS
        );

        let res = astParser.getFlattenNodes(src, true);
        assert.deepStrictEqual(Object.entries(res).map(v => ({
            name: v[0],
            isExport: v[1].isExport
        })), [
            {
                name: 'NSTest.Test',
                isExport: false
            },
            {
                name: 'default.Test',
                isExport: true
            },
        ])
    })
})