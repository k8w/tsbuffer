import { IndexedAccessTypeSchema, InterfaceTypeSchema, IntersectionTypeSchema, UnionTypeSchema } from '@tsbuffer/schema';
import * as assert from 'assert';
import { AstParser } from '../../../src/AstParser';
import { CreateSource } from './GetSourceFile';

describe('astParser.node2schema', function () {
    const astParser = new AstParser();

    it('AnyType-any', function () {
        let src = CreateSource(`type Test = any;`);
        let nodes = astParser.getFlattenNodes(src);
        let schema = astParser.node2schema(nodes['Test'].node, {});
        assert.deepStrictEqual(schema, {
            type: 'Any'
        })
    });

    it('AnyType-unknown', function () {
        let src = CreateSource(`type Test = unknown;`);
        let nodes = astParser.getFlattenNodes(src);
        let schema = astParser.node2schema(nodes['Test'].node, {});
        assert.deepStrictEqual(schema, {
            type: 'Any'
        })
    });

    it('BufferType', function () {
        [
            'ArrayBuffer',
            'Int8Array',
            'Int16Array',
            'Int32Array',
            'BigInt64Array',
            'Uint8Array',
            'Uint16Array',
            'Uint32Array',
            'BigUint64Array',
            'Float32Array',
            'Float64Array',
        ].forEach(v => {
            let src = CreateSource(`type Test = ${v};`);
            let nodes = astParser.getFlattenNodes(src);
            let schema = astParser.node2schema(nodes['Test'].node, {});
            if (v === 'ArrayBuffer') {
                assert.deepStrictEqual(schema, {
                    type: 'Buffer'
                })
            }
            else {
                assert.deepStrictEqual(schema, {
                    type: 'Buffer',
                    arrayType: v
                })
            }
        })
    });

    it('BooleanType', function () {
        let src = CreateSource(`type Test = boolean;`);
        let nodes = astParser.getFlattenNodes(src);
        let schema = astParser.node2schema(nodes['Test'].node, {});
        assert.deepStrictEqual(schema, {
            type: 'Boolean'
        })
    });

    it('ObjectType', function () {
        let src = CreateSource(`type Test = object;`);
        let nodes = astParser.getFlattenNodes(src);
        let schema = astParser.node2schema(nodes['Test'].node, {});
        assert.deepStrictEqual(schema, {
            type: 'Object'
        })
    });

    it('NumberType: number', function () {
        let src = CreateSource(`type Test = number;`);
        let nodes = astParser.getFlattenNodes(src);
        let schema = astParser.node2schema(nodes['Test'].node, {});
        assert.deepStrictEqual(schema, {
            type: 'Number'
        })
    })

    it('NumberType: ScalarValueType', function () {
        ['int', 'uint', 'double', 'bigint', 'bigint64', 'biguint64'].forEach(v => {
            let src = CreateSource(`type Test = ${v};`);
            let nodes = astParser.getFlattenNodes(src);
            let schema = astParser.node2schema(nodes['Test'].node, {});
            assert.deepStrictEqual(schema, {
                type: 'Number',
                scalarType: v
            })
        })
    })

    it('StringType', function () {
        let src = CreateSource(`type Test = string;`);
        let nodes = astParser.getFlattenNodes(src);
        let schema = astParser.node2schema(nodes['Test'].node, {});
        assert.deepStrictEqual(schema, {
            type: 'String'
        })
    })

    it('ArrayType: string[]', function () {
        let src = CreateSource(`type Test = string[];`);
        let nodes = astParser.getFlattenNodes(src);
        let schema = astParser.node2schema(nodes['Test'].node, {});
        assert.deepStrictEqual(schema, {
            type: 'Array',
            elementType: {
                type: 'String'
            }
        })
    })

    it('ArrayType: Array<uint>', function () {
        let src = CreateSource(`type Test = Array<uint>;`);
        let nodes = astParser.getFlattenNodes(src);
        let schema = astParser.node2schema(nodes['Test'].node, {});
        assert.deepStrictEqual(schema, {
            type: 'Array',
            elementType: {
                type: 'Number',
                scalarType: 'uint'
            }
        })
    })

    it('TupleType', function () {
        let src = CreateSource(`type Test = [number,  boolean[], Array<string[]>, [number, number]]`);
        assert.deepStrictEqual(astParser.node2schema(
            astParser.getFlattenNodes(src)['Test'].node, {}
        ), {
            type: 'Tuple',
            elementTypes: [
                { type: 'Number' },
                {
                    type: 'Array',
                    elementType: {
                        type: 'Boolean'
                    }
                },
                {
                    type: 'Array',
                    elementType: {
                        type: 'Array',
                        elementType: {
                            type: 'String'
                        }
                    }
                },
                {
                    type: 'Tuple',
                    elementTypes: [
                        { type: 'Number' },
                        { type: 'Number' }
                    ]
                }
            ]
        })

        src = CreateSource(`type Test = [number, any, string?, boolean?]`);
        assert.deepStrictEqual(astParser.node2schema(
            astParser.getFlattenNodes(src)['Test'].node, {}
        ), {
            type: 'Tuple',
            elementTypes: [
                { type: 'Number' },
                { type: 'Any' },
                { type: 'String' },
                { type: 'Boolean' },
            ],
            optionalStartIndex: 2
        })
    })

    it('LiteralType: String', function () {
        let src = CreateSource(`type Test = 'Hahaha';
        type Test1 = "haha111";`);
        let nodes = astParser.getFlattenNodes(src);

        assert.deepStrictEqual(astParser.node2schema(nodes['Test'].node, {}), {
            type: 'Literal',
            literal: 'Hahaha'
        })
        assert.deepStrictEqual(astParser.node2schema(nodes['Test1'].node, {}), {
            type: 'Literal',
            literal: 'haha111'
        })
    })

    it('LiteralType: Number', function () {
        let src = CreateSource(`type Test = 123;
        type Test1 = 1.234;
        type Test2 = 1e23`);
        let nodes = astParser.getFlattenNodes(src);

        assert.deepStrictEqual(astParser.node2schema(nodes['Test'].node, {}), {
            type: 'Literal',
            literal: 123
        })
        assert.deepStrictEqual(astParser.node2schema(nodes['Test1'].node, {}), {
            type: 'Literal',
            literal: 1.234
        })
        assert.deepStrictEqual(astParser.node2schema(nodes['Test2'].node, {}), {
            type: 'Literal',
            literal: 1e23
        })
    })

    it('LiteralType: Boolean', function () {
        let src = CreateSource(`type Test = true;
        type Test1 = false;`);
        let nodes = astParser.getFlattenNodes(src);

        assert.deepStrictEqual(astParser.node2schema(nodes['Test'].node, {}), {
            type: 'Literal',
            literal: true
        })
        assert.deepStrictEqual(astParser.node2schema(nodes['Test1'].node, {}), {
            type: 'Literal',
            literal: false
        })
    })

    it('LiteralType: null/undefined', function () {
        let src = CreateSource(`type Test = null;
        type Test1 = undefined;`);
        let nodes = astParser.getFlattenNodes(src);

        assert.deepStrictEqual(astParser.node2schema(nodes['Test'].node, {}), {
            type: 'Literal',
            literal: null
        })
        assert.deepStrictEqual(astParser.node2schema(nodes['Test1'].node, {}), {
            type: 'Literal',
            literal: undefined
        })
    })

    it('EnumType', function () {
        let src = CreateSource(`
enum Test1 { a,b,c}
enum Test2 {a='AA',b='BB',c='CC'}
enum Test3 {a=1,b,c,d=100,e,f,g=-100,g1,g2}
        `);
        let nodes = astParser.getFlattenNodes(src);

        assert.deepStrictEqual(astParser.node2schema(nodes['Test1'].node, {}), {
            type: 'Enum',
            members: [
                { id: 0, name: 'a', value: 0 },
                { id: 1, name: 'b', value: 1 },
                { id: 2, name: 'c', value: 2 },
            ]
        });
        assert.deepStrictEqual(astParser.node2schema(nodes['Test2'].node, {}), {
            type: 'Enum',
            members: [
                { id: 0, name: 'a', value: 'AA' },
                { id: 1, name: 'b', value: 'BB' },
                { id: 2, name: 'c', value: 'CC' },
            ]
        });
        assert.deepStrictEqual(astParser.node2schema(nodes['Test3'].node, {}), {
            type: 'Enum',
            members: [
                { id: 0, name: 'a', value: 1 },
                { id: 1, name: 'b', value: 2 },
                { id: 2, name: 'c', value: 3 },
                { id: 3, name: 'd', value: 100 },
                { id: 4, name: 'e', value: 101 },
                { id: 5, name: 'f', value: 102 },
                { id: 6, name: 'g', value: -100 },
                { id: 7, name: 'g1', value: -99 },
                { id: 8, name: 'g2', value: -98 },
            ]
        });
    })

    it('ReferenceType', function () {
        let src = CreateSource(`
        import A, {B, C as D} from 'abcd';
        import { E } from './eee';
        type TestA = A;
        type TestAA = A.A;
        type TestB = B;
        type TestD = D;
        type TestDD = D.D;
        type TestE = E;
        type Inside = TestA;
        type Inside2 = TestA.TestB;
        `);
        let imports = astParser.getScriptImports(src);
        let nodes = astParser.getFlattenNodes(src);

        assert.deepStrictEqual(astParser.node2schema(nodes['TestA'].node, imports), {
            type: 'Reference',
            target: 'abcd/default'
        });
        assert.deepStrictEqual(astParser.node2schema(nodes['TestAA'].node, imports), {
            type: 'Reference',
            target: 'abcd/default.A'
        });
        assert.deepStrictEqual(astParser.node2schema(nodes['TestB'].node, imports), {
            type: 'Reference',
            target: 'abcd/B'
        });
        assert.deepStrictEqual(astParser.node2schema(nodes['TestD'].node, imports), {
            type: 'Reference',
            target: 'abcd/C'
        });
        assert.deepStrictEqual(astParser.node2schema(nodes['TestDD'].node, imports), {
            type: 'Reference',
            target: 'abcd/C.D'
        });
        assert.deepStrictEqual(astParser.node2schema(nodes['TestE'].node, imports), {
            type: 'Reference',
            target: './eee/E'
        });
        assert.deepStrictEqual(astParser.node2schema(nodes['Inside'].node, imports), {
            type: 'Reference',
            target: 'TestA'
        });
        assert.deepStrictEqual(astParser.node2schema(nodes['Inside2'].node, imports), {
            type: 'Reference',
            target: 'TestA.TestB'
        });
    })

    it('InterfaceType: interface', function () {
        let src = CreateSource(`
        import Ptl, {Req,FuckReq} from 'proto';

        export interface XXPtl extends Ptl {

        }

        interface BaseReq extends Req, FuckReq{
            url: string
        }

        export interface XXReq extends BaseReq{
            a: string,
            b?: number,
            c: {
                c1: {value: string}[],
                c2: [number, boolean]
            }
        }

        interface Empty{};

        type Empty2 = {};
        `);
        let imports = astParser.getScriptImports(src);
        let nodes = astParser.getFlattenNodes(src);

        assert.deepStrictEqual(astParser.node2schema(nodes['XXPtl'].node, imports), {
            type: 'Interface',
            extends: [{
                id: 0,
                type: {
                    type: 'Reference',
                    target: 'proto/default'
                }
            }]
        });

        assert.deepStrictEqual(astParser.node2schema(nodes['BaseReq'].node, imports), {
            type: 'Interface',
            extends: [
                {
                    id: 0,
                    type: {
                        type: 'Reference',
                        target: 'proto/Req'
                    }
                },
                {
                    id: 1,
                    type: {
                        type: 'Reference',
                        target: 'proto/FuckReq'
                    }
                }
            ],
            properties: [{
                id: 0,
                name: 'url',
                type: {
                    type: 'String'
                }
            }]
        });

        assert.deepStrictEqual(astParser.node2schema(nodes['XXReq'].node, imports), {
            type: 'Interface',
            extends: [{
                id: 0,
                type: {
                    type: 'Reference',
                    target: 'BaseReq'
                }
            }],
            properties: [{
                id: 0,
                name: 'a',
                type: {
                    type: 'String'
                }
            }, {
                id: 1,
                name: 'b',
                optional: true,
                type: {
                    type: 'Number'
                }
            }, {
                id: 2,
                name: 'c',
                type: {
                    type: 'Interface',
                    properties: [{
                        id: 0,
                        name: 'c1',
                        type: {
                            type: 'Array',
                            elementType: {
                                type: 'Interface',
                                properties: [{
                                    id: 0,
                                    name: 'value',
                                    type: {
                                        type: 'String'
                                    }
                                }]
                            }
                        }
                    }, {
                        id: 1,
                        name: 'c2',
                        type: {
                            type: 'Tuple',
                            elementTypes: [{
                                type: 'Number'
                            }, {
                                type: 'Boolean'
                            }]
                        }
                    }]
                }
            }]
        });

        assert.deepStrictEqual(astParser.node2schema(nodes['Empty'].node, imports), {
            type: 'Interface'
        });

        assert.deepStrictEqual(astParser.node2schema(nodes['Empty2'].node, imports), {
            type: 'Interface'
        });
    })

    it('InterfaceType: TypeLiteral', function () {
        let src = CreateSource(`
        type Test = {
            a: string,
            b?: {
                value: string
            }
        };
        `);
        let imports = astParser.getScriptImports(src);
        let nodes = astParser.getFlattenNodes(src);

        assert.deepStrictEqual(astParser.node2schema(nodes['Test'].node, imports), {
            type: 'Interface',
            properties: [{
                id: 0,
                name: 'a',
                type: {
                    type: 'String'
                }
            }, {
                id: 1,
                name: 'b',
                optional: true,
                type: {
                    type: 'Interface',
                    properties: [{
                        id: 0,
                        name: 'value',
                        type: {
                            type: 'String'
                        }
                    }]
                }
            }]
        });
    })

    it('Interface: IndexSignature', function () {
        let src = CreateSource(`
        type Test = {
            [key: string]: number;
        }

        interface Test2 {
            a: {valueA: string},
            b?: {valueB: string},
            [key: string]: {valueA?: string, valueB?: string}
        }
        `);
        let imports = astParser.getScriptImports(src);
        let nodes = astParser.getFlattenNodes(src);

        assert.deepStrictEqual(astParser.node2schema(nodes['Test'].node, imports), <InterfaceTypeSchema>{
            type: 'Interface',
            indexSignature: {
                keyType: 'String',
                type: {
                    type: 'Number'
                }
            }
        });

        assert.deepStrictEqual(astParser.node2schema(nodes['Test2'].node, imports), <InterfaceTypeSchema>{
            type: 'Interface',
            properties: [{
                id: 0,
                name: 'a',
                type: {
                    type: 'Interface',
                    properties: [{
                        id: 0,
                        name: 'valueA',
                        type: {
                            type: 'String'
                        }
                    }]
                }
            }, {
                id: 1,
                name: 'b',
                optional: true,
                type: {
                    type: 'Interface',
                    properties: [{
                        id: 0,
                        name: 'valueB',
                        type: {
                            type: 'String'
                        }
                    }]
                }
            }],
            indexSignature: {
                keyType: 'String',
                type: {
                    type: 'Interface',
                    properties: [{
                        id: 0,
                        name: 'valueA',
                        optional: true,
                        type: {
                            type: 'String'
                        }
                    }, {
                        id: 1,
                        name: 'valueB',
                        optional: true,
                        type: {
                            type: 'String'
                        }
                    }]
                }
            }
        });
    });

    it('IndexAccessType', function () {
        let src = CreateSource(`
        type Test1 = A['B'];
        type Test2 = A['B']['C'];
        type Test3 = {a:string}['a'];
        `);
        let imports = astParser.getScriptImports(src);
        let nodes = astParser.getFlattenNodes(src);

        assert.deepStrictEqual(astParser.node2schema(nodes['Test1'].node, imports), <IndexedAccessTypeSchema>{
            type: 'IndexedAccess',
            objectType: {
                type: 'Reference',
                target: 'A'
            },
            index: 'B'
        });

        assert.deepStrictEqual(astParser.node2schema(nodes['Test2'].node, imports), <IndexedAccessTypeSchema>{
            type: 'IndexedAccess',
            objectType: {
                type: 'IndexedAccess',
                objectType: {
                    type: 'Reference',
                    target: 'A'
                },
                index: 'B'
            },
            index: 'C'
        });

        assert.deepStrictEqual(astParser.node2schema(nodes['Test3'].node, imports), <IndexedAccessTypeSchema>{
            type: 'IndexedAccess',
            objectType: {
                type: 'Interface',
                properties: [{
                    id: 0,
                    name: 'a',
                    type: {
                        type: 'String'
                    }
                }]
            },
            index: 'a'
        });
    })

    it('UnionType', function () {
        let src = CreateSource(`
        type Test1 = A | B;
        type Test2 = string | number | boolean;
        `);
        let imports = astParser.getScriptImports(src);
        let nodes = astParser.getFlattenNodes(src);

        assert.deepStrictEqual(astParser.node2schema(nodes['Test1'].node, imports), <UnionTypeSchema>{
            type: 'Union',
            members: [
                {
                    id: 0,
                    type: {
                        type: 'Reference',
                        target: 'A'
                    }
                },
                {
                    id: 1,
                    type: {
                        type: 'Reference',
                        target: 'B'
                    }
                }
            ]
        });

        assert.deepStrictEqual(astParser.node2schema(nodes['Test2'].node, imports), <UnionTypeSchema>{
            type: 'Union',
            members: [
                {
                    id: 0,
                    type: {
                        type: 'String'
                    }
                },
                {
                    id: 1,
                    type: {
                        type: 'Number'
                    }
                },
                {
                    id: 2,
                    type: {
                        type: 'Boolean'
                    }
                }
            ]
        });
    })

    it('IntersectionType', function () {
        let src = CreateSource(`
        type Test1 = A & B;
        type Test2 = string & number & boolean;
        `);
        let imports = astParser.getScriptImports(src);
        let nodes = astParser.getFlattenNodes(src);

        assert.deepStrictEqual(astParser.node2schema(nodes['Test1'].node, imports), <IntersectionTypeSchema>{
            type: 'Intersection',
            members: [
                {
                    id: 0,
                    type: {
                        type: 'Reference',
                        target: 'A'
                    }
                },
                {
                    id: 1,
                    type: {
                        type: 'Reference',
                        target: 'B'
                    }
                }
            ]
        });

        assert.deepStrictEqual(astParser.node2schema(nodes['Test2'].node, imports), <IntersectionTypeSchema>{
            type: 'Intersection',
            members: [
                {
                    id: 0,
                    type: {
                        type: 'String'
                    }
                },
                {
                    id: 1,
                    type: {
                        type: 'Number'
                    }
                },
                {
                    id: 2,
                    type: {
                        type: 'Boolean'
                    }
                }
            ]
        });
    })

    it('UnionType & IntersectionType', function () {
        let src = CreateSource(`
        type Test1 = A & B | C & D;
        type Test2 = (A | B) & (C | D);
        `);
        let imports = astParser.getScriptImports(src);
        let nodes = astParser.getFlattenNodes(src);

        assert.deepStrictEqual(astParser.node2schema(nodes['Test1'].node, imports), {
            type: 'Union',
            members: [
                {
                    id: 0,
                    type: {
                        type: 'Intersection',
                        members: [{
                            id: 0,
                            type: {
                                type: 'Reference',
                                target: 'A'
                            }
                        }, {
                            id: 1,
                            type: {
                                type: 'Reference',
                                target: 'B'
                            }
                        }]
                    }
                },
                {
                    id: 1,
                    type: {
                        type: 'Intersection',
                        members: [{
                            id: 0,
                            type: {
                                type: 'Reference',
                                target: 'C'
                            }
                        }, {
                            id: 1,
                            type: {
                                type: 'Reference',
                                target: 'D'
                            }
                        }]
                    }
                }
            ]
        });

        assert.deepStrictEqual(astParser.node2schema(nodes['Test2'].node, imports), {
            type: 'Intersection',
            members: [
                {
                    id: 0,
                    type: {
                        type: 'Union',
                        members: [{
                            id: 0,
                            type: {
                                type: 'Reference',
                                target: 'A'
                            }
                        }, {
                            id: 1,
                            type: {
                                type: 'Reference',
                                target: 'B'
                            }
                        }]
                    }
                },
                {
                    id: 1,
                    type: {
                        type: 'Union',
                        members: [{
                            id: 0,
                            type: {
                                type: 'Reference',
                                target: 'C'
                            }
                        }, {
                            id: 1,
                            type: {
                                type: 'Reference',
                                target: 'D'
                            }
                        }]
                    }
                }
            ]
        });
    })

    it('PickType & OmitType', function () {
        ['Pick', 'Omit'].forEach(v => {
            let src = CreateSource(`
                type Test1 = ${v}<AA, 'a'|'b'|'c'>;
                type Test2 = ${v}<{}, ('a'|'b'|'c') & ('b'|'c'|'d');
            `);
            let imports = astParser.getScriptImports(src);
            let nodes = astParser.getFlattenNodes(src);

            assert.deepStrictEqual(astParser.node2schema(nodes['Test1'].node, imports), {
                type: v,
                target: {
                    type: 'Reference',
                    target: 'AA'
                },
                keys: [],
                pre: {
                    key: {
                        members: [
                            {
                                id: 0,
                                type: {
                                    literal: 'a',
                                    type: 'Literal'
                                }
                            },
                            {
                                id: 1,
                                type: {
                                    literal: 'b',
                                    type: 'Literal'
                                }
                            },
                            {
                                id: 2,
                                type: {
                                    literal: 'c',
                                    type: 'Literal'
                                }
                            }
                        ],
                        type: 'Union'
                    }
                }
            });

            assert.deepStrictEqual(astParser.node2schema(nodes['Test2'].node, imports), {
                type: v,
                target: {
                    type: 'Interface'
                },
                keys: [],
                pre: {
                    key: {
                        members: [
                            {
                                id: 0,
                                type: {
                                    members: [
                                        {
                                            id: 0,
                                            type: {
                                                literal: 'a',
                                                type: 'Literal'
                                            }
                                        },
                                        {
                                            id: 1,
                                            type: {
                                                literal: 'b',
                                                type: 'Literal'
                                            }
                                        },
                                        {
                                            id: 2,
                                            type: {
                                                literal: 'c',
                                                type: 'Literal'
                                            }
                                        }
                                    ],
                                    type: 'Union'
                                }
                            },
                            {
                                id: 1,
                                type: {
                                    members: [
                                        {
                                            id: 0,
                                            type: {
                                                literal: 'b',
                                                type: 'Literal'
                                            }
                                        },
                                        {
                                            id: 1,
                                            type: {
                                                literal: 'c',
                                                type: 'Literal'
                                            }
                                        },
                                        {
                                            id: 2,
                                            type: {
                                                literal: 'd',
                                                type: 'Literal'
                                            }
                                        }
                                    ],
                                    type: 'Union'
                                }
                            }
                        ],
                        type: 'Intersection'
                    }
                }
            });
        });
    })

    it('getKeys', function () {
        let src = CreateSource(`
        type Test1 = Pick<AA, 'a'|'b'|'c'>;
        type keys = 'd' | 'e' | 'f';
        type Test2 = Pick<AA, keys>;
        interface Obj {
            a: string,
            a1: number,
            b: boolean
        }
        type key2 = keyof Obj;
        type Test3 = Pick<AA, key2>;
        type Test4 = Pick<AA, keyof Obj>;
        type Test5 = Pick<AA, 'xx' | 'xxx' | keyof Obj>;
        `);
        let imports = astParser.getScriptImports(src);
        let nodes = astParser.getFlattenNodes(src);

        let node1 = astParser.node2schema(nodes['Test1'].node, imports);
        let node2 = astParser.node2schema(nodes['Test2'].node, imports);
        let node3 = astParser.node2schema(nodes['Test3'].node, imports);
        let node4 = astParser.node2schema(nodes['Test4'].node, imports);

        console.log('1', node1);
        console.log('2', node2);
        console.log('3', node3);
        console.log('4', node4);

        // asser4.deepStrictEqual(astParser.node2schema(nodes['Test1'].node, imports), {
        //     type: v,
        //     target: {
        //         type: 'Reference',
        //         target: 'AA'
        //     },
        //     keys: ['a', 'b', 'c']
        // });

        // assert.deepStrictEqual(astParser.node2schema(nodes['Test2'].node, imports), {
        //     type: v,
        //     target: {
        //         type: 'Interface'
        //     },
        //     keys: ['b', 'c']
        // });
    })

    it('PartialType', function () {
        let src = CreateSource(`
        type Test1 = Partial<AA>;
        type Test2 = Partial<{}>;
        `);
        let imports = astParser.getScriptImports(src);
        let nodes = astParser.getFlattenNodes(src);

        assert.deepStrictEqual(astParser.node2schema(nodes['Test1'].node, imports), {
            type: 'Partial',
            target: {
                type: 'Reference',
                target: 'AA'
            }
        });

        assert.deepStrictEqual(astParser.node2schema(nodes['Test2'].node, imports), {
            type: 'Partial',
            target: {
                type: 'Interface'
            }
        });
    })

    it('Overwrite', function () {
        let src = CreateSource(`
        import {Overwrite} from 'k8w-extend-native';
        type Test1 = Overwrite<AA, {a: string}>;
        `);
        let imports = astParser.getScriptImports(src);
        let nodes = astParser.getFlattenNodes(src);

        assert.deepStrictEqual(astParser.node2schema(nodes['Test1'].node, imports), {
            type: 'Overwrite',
            target: {
                type: 'Reference',
                target: 'AA'
            },
            overwrite: {
                type: 'Interface',
                properties: [{
                    id: 0,
                    name: 'a',
                    type: {
                        type: 'String'
                    }
                }]
            }
        });
    })

    it('Overwrite InterfaceReference', function () {
        let src = CreateSource(`
        type Test1 = Overwrite<Pick<AA, 'a'|'b'>, Omit<BB, 'b'|'c'>>;
        `);
        let imports = astParser.getScriptImports(src);
        let nodes = astParser.getFlattenNodes(src);

        assert.deepStrictEqual(astParser.node2schema(nodes['Test1'].node, imports), {
            type: 'Overwrite',
            target: {
                type: 'Pick',
                target: {
                    type: 'Reference',
                    target: 'AA'
                },
                keys: [],
                pre: {
                    key: {
                        members: [
                            {
                                id: 0,
                                type: {
                                    literal: 'a',
                                    type: 'Literal'
                                }
                            },
                            {
                                id: 1,
                                type: {
                                    literal: 'b',
                                    type: 'Literal'
                                }
                            }
                        ],
                        type: 'Union'
                    }
                }
            },
            overwrite: {
                type: 'Omit',
                target: {
                    type: 'Reference',
                    target: 'BB'
                },
                keys: [],
                pre: {
                    key: {
                        members: [
                            {
                                id: 0,
                                type: {
                                    literal: 'b',
                                    type: 'Literal'
                                }
                            },
                            {
                                id: 1,
                                type: {
                                    literal: 'c',
                                    type: 'Literal'
                                }
                            }
                        ],
                        type: 'Union'
                    }
                }
            }
        });
    })

    it('{value: boolean|null}', function () {
        let src = CreateSource(`export type Test5 = {value: boolean|null};`);
        let imports = astParser.getScriptImports(src);
        let nodes = astParser.getFlattenNodes(src);

        assert.deepStrictEqual(astParser.node2schema(nodes['Test5'].node, imports), {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "value",
                    "type": {
                        "type": "Union",
                        "members": [
                            {
                                "id": 0,
                                "type": {
                                    "type": "Boolean"
                                }
                            },
                            {
                                "id": 1,
                                "type": {
                                    "type": "Literal",
                                    "literal": null
                                }
                            }
                        ]
                    }
                }
            ]
        });
        // assert.deepStrictEqual(Object.entries(res).map(v => ({
        //     name: v[0],
        //     isExport: v[1].isExport
        // })), [
        //     {
        //         name: 'NSTest.Test',
        //         isExport: false
        //     },
        //     {
        //         name: 'default.Test',
        //         isExport: true
        //     },
        // ])
    })

    it('Date', function () {
        let src = CreateSource(`type Test = Date;`);
        let nodes = astParser.getFlattenNodes(src);
        let schema = astParser.node2schema(nodes['Test'].node, {});
        assert.deepStrictEqual(schema, {
            type: 'Date'
        })
    })

    it('NonNullable', function () {
        let src = CreateSource(`
export type V1 = string | null | undefined;
export interface V2 {
    value1?: string;
    value2?: string | null;
}
export interface NonNullableWrapper {
    value: NonNullable<V1>,
    value1: NonNullable<V2['value1']>,
    value2: NonNullable<V2['value2']>
}
        `);
        let imports = astParser.getScriptImports(src);
        let nodes = astParser.getFlattenNodes(src);

        assert.deepStrictEqual(astParser.node2schema(nodes['NonNullableWrapper'].node, imports), {
            type: 'Interface',
            "properties": [
                {
                    "id": 0,
                    "name": "value",
                    "type": {
                        "type": "NonNullable",
                        "target": {
                            "type": "Reference",
                            "target": "V1"
                        }
                    }
                },
                {
                    "id": 1,
                    "name": "value1",
                    "type": {
                        "type": "NonNullable",
                        "target": {
                            "type": "IndexedAccess",
                            "index": "value1",
                            "objectType": {
                                "type": "Reference",
                                "target": "V2"
                            }
                        }
                    }
                },
                {
                    "id": 2,
                    "name": "value2",
                    "type": {
                        "type": "NonNullable",
                        "target": {
                            "type": "IndexedAccess",
                            "index": "value2",
                            "objectType": {
                                "type": "Reference",
                                "target": "V2"
                            }
                        }
                    }
                }
            ]
        });
    })

    it('Keyof', function () {
        let src = CreateSource(`
export interface Obj {
    aaa: string;
    bbb: number;
    ccc?: boolean;
}
export type keys = keyof Obj;
}
        `);
        let imports = astParser.getScriptImports(src);
        let nodes = astParser.getFlattenNodes(src);

        assert.deepStrictEqual(astParser.node2schema(nodes['keys'].node, imports), {
            type: 'Keyof',
            target: {
                type: 'Reference',
                target: 'Obj'
            }
        });
    })
})