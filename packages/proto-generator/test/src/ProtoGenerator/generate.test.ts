import * as assert from 'assert';
import * as path from "path";
import { ProtoGenerator } from '../../../src/ProtoGenerator';

describe('ProtoGenerator.generate', function () {
    it('specific filter', async function () {
        let generator = new ProtoGenerator({
            baseDir: path.resolve(__dirname)
        });

        let schemas = await generator.generate('sources/Student.ts');
        process.chdir(path.resolve(__dirname, '../../'));
        let schemas2 = await generator.generate('sources/Student.ts');

        // 无关pwd的事
        assert.deepStrictEqual(JSON.stringify(schemas, null, 2), JSON.stringify(schemas2, null, 2));

        let rightAnswer = {
            "sources/Student/default": {
                "type": "Reference",
                "target": "sources/Student/Student"
            },
            "sources/Student/Student": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "name",
                        "type": {
                            "type": "String"
                        }
                    },
                    {
                        "id": 1,
                        "name": "age",
                        "type": {
                            "type": "Number"
                        }
                    },
                    {
                        "id": 2,
                        "name": "class",
                        "type": {
                            "type": "Array",
                            "elementType": {
                                "type": "String"
                            }
                        }
                    },
                    {
                        "id": 3,
                        "name": "sex",
                        "type": {
                            "type": "IndexedAccess",
                            "index": "sex",
                            "objectType": {
                                "type": "Reference",
                                "target": "sources/NSPerson/default.Person"
                            }
                        }
                    }
                ]
            },
            "sources/Student/Unused1": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "value",
                        "type": {
                            "type": "String"
                        }
                    }
                ]
            },
            "sources/NSPerson/default.Person": {
                "type": "Reference",
                "target": "sources/NSPerson/NSPerson.Person"
            },
            "sources/NSPerson/NSPerson.Person": {
                "type": "Union",
                "members": [
                    {
                        "id": 0,
                        "type": {
                            "type": "Reference",
                            "target": "sources/NSPerson/NSPerson.Male"
                        }
                    },
                    {
                        "id": 1,
                        "type": {
                            "type": "Reference",
                            "target": "sources/NSPerson/NSPerson.Female"
                        }
                    }
                ]
            },
            "sources/NSPerson/NSPerson.Male": {
                "type": "Interface",
                "extends": [
                    {
                        id: 0,
                        type: {
                            "type": "Reference",
                            "target": "sources/Animal/default"
                        }
                    }
                ],
                "properties": [
                    {
                        "id": 0,
                        "name": "maleXXX",
                        "type": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "value",
                                    "type": {
                                        "type": "String"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "id": 1,
                        "name": "sex",
                        "type": {
                            "type": "Literal",
                            "literal": "m"
                        }
                    }
                ]
            },
            "sources/NSPerson/NSPerson.Female": {
                "type": "Interface",
                "extends": [
                    {
                        id: 0,
                        type: {
                            "type": "Reference",
                            "target": "sources/Animal/default"
                        }
                    }
                ],
                "properties": [
                    {
                        "id": 0,
                        "name": "femaleXXX",
                        "type": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "value",
                                    "type": {
                                        "type": "String"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "id": 1,
                        "name": "sex",
                        "type": {
                            "type": "Literal",
                            "literal": "f"
                        }
                    }
                ]
            },
            "sources/Animal/default": {
                "type": "Reference",
                "target": "sources/Animal/Animal"
            },
            "sources/Animal/Animal": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "name",
                        "type": {
                            "type": "String"
                        }
                    },
                    {
                        "id": 1,
                        "name": "age",
                        "type": {
                            "type": "Number"
                        },
                        "optional": true
                    }
                ]
            }
        };

        assert.deepStrictEqual(schemas, rightAnswer)
    })

    it('dts', async function () {
        let generator = new ProtoGenerator({
            baseDir: path.resolve(__dirname)
        });

        let schemas = await generator.generate('sources/Student.d.ts');
        process.chdir(path.resolve(__dirname, '../../'));
        let schemas2 = await generator.generate('sources/Student.d.ts');

        // 无关pwd的事
        assert.deepStrictEqual(JSON.stringify(schemas, null, 2), JSON.stringify(schemas2, null, 2));

        let rightAnswer = {
            "sources/Student/default": {
                "type": "Reference",
                "target": "sources/Student/Student"
            },
            "sources/Student/Student": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "name",
                        "type": {
                            "type": "String"
                        }
                    },
                    {
                        "id": 1,
                        "name": "age",
                        "type": {
                            "type": "Number"
                        }
                    },
                    {
                        "id": 2,
                        "name": "class",
                        "type": {
                            "type": "Array",
                            "elementType": {
                                "type": "String"
                            }
                        }
                    },
                    {
                        "id": 3,
                        "name": "sex",
                        "type": {
                            "type": "IndexedAccess",
                            "index": "sex",
                            "objectType": {
                                "type": "Reference",
                                "target": "sources/NSPerson/default.Person"
                            }
                        }
                    }
                ]
            },
            "sources/Student/Unused1": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "value",
                        "type": {
                            "type": "String"
                        }
                    }
                ]
            },
            "sources/NSPerson/default.Person": {
                "type": "Reference",
                "target": "sources/NSPerson/NSPerson.Person"
            },
            "sources/NSPerson/NSPerson.Person": {
                "type": "Union",
                "members": [
                    {
                        "id": 0,
                        "type": {
                            "type": "Reference",
                            "target": "sources/NSPerson/NSPerson.Male"
                        }
                    },
                    {
                        "id": 1,
                        "type": {
                            "type": "Reference",
                            "target": "sources/NSPerson/NSPerson.Female"
                        }
                    }
                ]
            },
            "sources/NSPerson/NSPerson.Male": {
                "type": "Interface",
                "extends": [
                    {
                        id: 0,
                        type: {
                            "type": "Reference",
                            "target": "sources/Animal/default"
                        }
                    }
                ],
                "properties": [
                    {
                        "id": 0,
                        "name": "maleXXX",
                        "type": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "value",
                                    "type": {
                                        "type": "String"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "id": 1,
                        "name": "sex",
                        "type": {
                            "type": "Literal",
                            "literal": "m"
                        }
                    }
                ]
            },
            "sources/NSPerson/NSPerson.Female": {
                "type": "Interface",
                "extends": [
                    {
                        id: 0,
                        type: {
                            "type": "Reference",
                            "target": "sources/Animal/default"
                        }
                    }
                ],
                "properties": [
                    {
                        "id": 0,
                        "name": "femaleXXX",
                        "type": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "value",
                                    "type": {
                                        "type": "String"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "id": 1,
                        "name": "sex",
                        "type": {
                            "type": "Literal",
                            "literal": "f"
                        }
                    }
                ]
            },
            "sources/Animal/default": {
                "type": "Reference",
                "target": "sources/Animal/Animal"
            },
            "sources/Animal/Animal": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "name",
                        "type": {
                            "type": "String"
                        }
                    },
                    {
                        "id": 1,
                        "name": "age",
                        "type": {
                            "type": "Number"
                        },
                        "optional": true
                    }
                ]
            }
        };

        assert.deepStrictEqual(schemas, rightAnswer)
    })

    it('node_modules', async function () {
        let oriCwd = process.cwd();
        process.chdir(path.resolve(path.resolve(__dirname, 'sources', 'nodeModule')))
        let generator = new ProtoGenerator({
            baseDir: path.resolve(__dirname, 'sources', 'nodeModule')
        });

        let schemas = await generator.generate('Test.ts');
        process.chdir(oriCwd);

        assert.deepStrictEqual(schemas, {
            'Test/Test': {
                type: 'Interface',
                extends: [
                    {
                        id: 0,
                        type: {
                            type: 'Reference',
                            target: 'node_modules/test-nm/index/TestNodeModule'
                        }
                    }
                ]
            },
            'node_modules/test-nm/index/TestNodeModule': {
                type: 'Interface',
                properties: [{
                    id: 0,
                    name: 'base',
                    type: { type: 'String' }
                }]
            }
        })
    })

    // it('custom astCache', async function () {
    //     let generator = new ProtoGenerator({
    //         baseDir: path.resolve(__dirname, 'sources', 'nodeModule'),
    //         resolveModule: (importPath) => {
    //             console.log('asdfasdf', importPath);
    //             if (importPath === 'test-nm') {
    //                 return '##aabbcc';
    //             }
    //             else {
    //                 throw new Error('NO!')
    //             }
    //         },
    //         astCache: {
    //             '##aabbcc': {
    //                 'TestNodeModule': {
    //                     isExport: true,
    //                     schema: {
    //                         type: SchemaType.Interface,
    //                         properties: [{
    //                             id: 0,
    //                             name: 'aaaaa',
    //                             type: {
    //                                 type: SchemaType.String
    //                             }
    //                         }]
    //                     }
    //                 }
    //             }
    //         }
    //     });

    //     let schemas = await generator.generate('Test.ts');

    //     assert.deepStrictEqual(schemas, {
    //         'Test/Test': {
    //             type: 'Interface',
    //             extends: [
    //                 {
    //                     id: 0,
    //                     type: {
    //                         type: 'Reference',
    //                         target: '##aabbcc/TestNodeModule'
    //                     }
    //                 }
    //             ]
    //         },
    //         '##aabbcc/TestNodeModule': {
    //             type: 'Interface',
    //             properties: [{
    //                 id: 0,
    //                 name: 'aaaaa',
    //                 type: {
    //                     type: 'String'
    //                 }
    //             }]
    //         }
    //     })
    // })

    it('customSchemaIds', async function () {
        let generator = new ProtoGenerator({
            baseDir: path.resolve(__dirname, 'sources', 'nodeModule'),
            customSchemaIds: ['test-nm/TestNodeModule']
        });

        let schemas = await generator.generate('Test.ts');

        assert.deepStrictEqual(schemas, {
            'Test/Test': {
                type: 'Interface',
                extends: [
                    {
                        id: 0,
                        type: {
                            type: 'Reference',
                            target: '?test-nm/TestNodeModule'
                        }
                    }
                ]
            }
        })
    })

    it('empty', async function () {
        let generator = new ProtoGenerator({
            baseDir: path.resolve(__dirname)
        });

        let schemas = await generator.generate('sources/empty.d.ts');
        assert.deepStrictEqual(schemas, {});
    })

    it('NonNullable', async function () {
        let generator = new ProtoGenerator({
            baseDir: path.resolve(__dirname)
        });

        let schemas = await generator.generate('sources/NonNullable.ts');
        assert.deepStrictEqual(schemas, {
            "sources/NonNullable/Wrapper": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "value1",
                        "type": {
                            "type": "String"
                        },
                        "optional": true
                    },
                    {
                        "id": 1,
                        "name": "value2",
                        "type": {
                            "type": "Union",
                            "members": [
                                {
                                    "id": 0,
                                    "type": {
                                        "type": "Literal",
                                        "literal": null
                                    }
                                },
                                {
                                    "id": 1,
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 2,
                                    "type": {
                                        "type": "Literal",
                                        literal: undefined
                                    }
                                }
                            ]
                        }
                    }
                ]
            },
            "sources/NonNullable/Value3": {
                "type": "Union",
                "members": [
                    {
                        "id": 0,
                        "type": {
                            "type": "String"
                        }
                    },
                    {
                        "id": 1,
                        "type": {
                            "type": "Literal",
                            "literal": null
                        }
                    },
                    {
                        "id": 2,
                        "type": {
                            "type": "Literal",
                            literal: undefined
                        }
                    }
                ]
            },
            "sources/NonNullable/NonNullable1": {
                "type": "NonNullable",
                "target": {
                    "type": "IndexedAccess",
                    "index": "value1",
                    "objectType": {
                        "type": "Reference",
                        "target": "sources/NonNullable/Wrapper"
                    }
                }
            },
            "sources/NonNullable/NonNullable2": {
                "type": "NonNullable",
                "target": {
                    "type": "IndexedAccess",
                    "index": "value2",
                    "objectType": {
                        "type": "Reference",
                        "target": "sources/NonNullable/Wrapper"
                    }
                }
            },
            "sources/NonNullable/NonNullable3": {
                "type": "NonNullable",
                "target": {
                    "type": "Reference",
                    "target": "sources/NonNullable/Value3"
                }
            }
        });
    })

    it('Keyof', async function () {
        let generator = new ProtoGenerator({
            baseDir: path.resolve(__dirname)
        });

        let schemas = await generator.generate('sources/Keyof.ts');
        assert.deepStrictEqual(schemas, {
            "sources/Keyof/Obj1": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "aa",
                        "type": {
                            "type": "String"
                        }
                    },
                    {
                        "id": 1,
                        "name": "bb",
                        "type": {
                            "type": "Number"
                        }
                    },
                    {
                        "id": 2,
                        "name": "cc",
                        "type": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "c1",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 1,
                                    "name": "c2",
                                    "type": {
                                        "type": "Array",
                                        "elementType": {
                                            "type": "Boolean"
                                        }
                                    }
                                },
                                {
                                    "id": 2,
                                    "name": "c3",
                                    "type": {
                                        "type": "Boolean"
                                    }
                                }
                            ]
                        }
                    }
                ]
            },
            "sources/Keyof/Obj2": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "bb",
                        "type": {
                            "type": "String"
                        }
                    },
                    {
                        "id": 1,
                        "name": "cc",
                        "type": {
                            "type": "Array",
                            "elementType": {
                                "type": "Any"
                            }
                        }
                    },
                    {
                        "id": 2,
                        "name": "dd",
                        "type": {
                            "type": "String"
                        }
                    }
                ]
            },
            "sources/Keyof/key1": {
                "type": "Keyof",
                "target": {
                    "type": "Reference",
                    "target": "sources/Keyof/Obj1"
                }
            },
            "sources/Keyof/key2": {
                "type": "Keyof",
                "target": {
                    "type": "Reference",
                    "target": "sources/Keyof/Obj2"
                }
            },
            "sources/Keyof/key3": {
                "type": "Union",
                "members": [
                    {
                        "id": 0,
                        "type": {
                            "type": "Literal",
                            "literal": "bb"
                        }
                    },
                    {
                        "id": 1,
                        "type": {
                            "type": "Literal",
                            "literal": "cc"
                        }
                    }
                ]
            },
            "sources/Keyof/keyUnion": {
                "type": "Union",
                "members": [
                    {
                        "id": 0,
                        "type": {
                            "type": "Reference",
                            "target": "sources/Keyof/key1"
                        }
                    },
                    {
                        "id": 1,
                        "type": {
                            "type": "Reference",
                            "target": "sources/Keyof/key2"
                        }
                    }
                ]
            },
            "sources/Keyof/keyIntersection": {
                "type": "Intersection",
                "members": [
                    {
                        "id": 0,
                        "type": {
                            "type": "Reference",
                            "target": "sources/Keyof/key1"
                        }
                    },
                    {
                        "id": 1,
                        "type": {
                            "type": "Reference",
                            "target": "sources/Keyof/key2"
                        }
                    }
                ]
            },
            "sources/Keyof/Pick1": {
                "target": {
                    "type": "Reference",
                    "target": "sources/Keyof/Obj1"
                },
                "keys": [
                    "bb",
                    "cc"
                ],
                "type": "Pick"
            },
            "sources/Keyof/Pick2": {
                "target": {
                    "type": "Reference",
                    "target": "sources/Keyof/Obj2"
                },
                "keys": [
                    "bb",
                    "cc"
                ],
                "type": "Pick"
            },
            "sources/Keyof/Omit3": {
                "target": {
                    "type": "Reference",
                    "target": "sources/Keyof/Obj1"
                },
                "keys": [
                    "bb",
                    "cc"
                ],
                "type": "Omit"
            }
        });
    })

    it('ExtendMappedType', async function () {
        let generator = new ProtoGenerator({
            baseDir: path.resolve(__dirname)
        });

        let schemas = await generator.generate('sources/ExtendMappedType.ts');
        assert.deepStrictEqual(schemas, {
            "sources/ExtendMappedType/A": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "common1",
                        "type": {
                            "type": "String"
                        }
                    },
                    {
                        "id": 1,
                        "name": "common2",
                        "type": {
                            "type": "String"
                        }
                    },
                    {
                        "id": 2,
                        "name": "a1",
                        "type": {
                            "type": "String"
                        }
                    },
                    {
                        "id": 3,
                        "name": "a2",
                        "type": {
                            "type": "String"
                        }
                    }
                ]
            },
            "sources/ExtendMappedType/B": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "common1",
                        "type": {
                            "type": "String"
                        }
                    },
                    {
                        "id": 1,
                        "name": "common2",
                        "type": {
                            "type": "String"
                        }
                    },
                    {
                        "id": 2,
                        "name": "b1",
                        "type": {
                            "type": "String"
                        }
                    },
                    {
                        "id": 3,
                        "name": "b2",
                        "type": {
                            "type": "String"
                        }
                    }
                ]
            },
            "sources/ExtendMappedType/C1": {
                "type": "Interface",
                "extends": [
                    {
                        "id": 0,
                        "type": {
                            "target": {
                                "type": "Reference",
                                "target": "sources/ExtendMappedType/A"
                            },
                            "keys": [
                                "common1",
                                "common2"
                            ],
                            "type": "Pick"
                        }
                    }
                ]
            },
            "sources/ExtendMappedType/C2": {
                "type": "Interface",
                "extends": [
                    {
                        "id": 0,
                        "type": {
                            "target": {
                                "type": "Intersection",
                                "members": [
                                    {
                                        "id": 0,
                                        "type": {
                                            "type": "Reference",
                                            "target": "sources/ExtendMappedType/A"
                                        }
                                    },
                                    {
                                        "id": 1,
                                        "type": {
                                            "type": "Reference",
                                            "target": "sources/ExtendMappedType/B"
                                        }
                                    }
                                ]
                            },
                            "keys": [
                                "a1",
                                "common2"
                            ],
                            "type": "Pick"
                        }
                    }
                ],
                "properties": [
                    {
                        "id": 0,
                        "name": "c",
                        "type": {
                            "type": "String"
                        }
                    }
                ]
            },
            "sources/ExtendMappedType/C3": {
                "type": "Interface",
                "extends": [
                    {
                        "id": 0,
                        "type": {
                            "target": {
                                "type": "Union",
                                "members": [
                                    {
                                        "id": 0,
                                        "type": {
                                            "type": "Reference",
                                            "target": "sources/ExtendMappedType/A"
                                        }
                                    },
                                    {
                                        "id": 1,
                                        "type": {
                                            "type": "Reference",
                                            "target": "sources/ExtendMappedType/B"
                                        }
                                    }
                                ]
                            },
                            "keys": [
                                "common1",
                                "common2"
                            ],
                            "type": "Pick"
                        }
                    }
                ],
                "properties": [
                    {
                        "id": 0,
                        "name": "c",
                        "type": {
                            "type": "String"
                        }
                    }
                ]
            }
        });
    })

    it('EnumAsLiteral', async function () {
        let generator = new ProtoGenerator({
            baseDir: path.resolve(__dirname)
        });

        let schemas = await generator.generate('sources/EnumAsLiteral.ts');
        assert.deepStrictEqual(schemas, {
            "sources/EnumAsLiteral/A": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "type",
                        "type": {
                            "type": "Literal",
                            "literal": 0
                        }
                    }
                ]
            },
            "sources/SimpleEnum/TestEnum": {
                "type": "Enum",
                "members": [
                    {
                        "id": 0,
                        "value": 0
                    },
                    {
                        "id": 1,
                        "value": 1
                    },
                    {
                        "id": 2,
                        "value": 2
                    },
                    {
                        "id": 3,
                        "value": 100
                    },
                    {
                        "id": 4,
                        "value": 101
                    },
                    {
                        "id": 5,
                        "value": 102
                    },
                    {
                        "id": 6,
                        "value": "GGG"
                    },
                    {
                        "id": 7,
                        "value": "HHH"
                    }
                ]
            },
            "sources/EnumAsLiteral/C": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "type",
                        "type": {
                            "type": "Literal",
                            "literal": 2
                        }
                    }
                ]
            },
            "sources/EnumAsLiteral/D": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "type",
                        "type": {
                            "type": "Literal",
                            "literal": 100
                        }
                    }
                ]
            },
            "sources/EnumAsLiteral/G": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "type",
                        "type": {
                            "type": "Literal",
                            "literal": "GGG"
                        }
                    }
                ]
            },
            "sources/EnumAsLiteral/H": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "type",
                        "type": {
                            "type": "Literal",
                            "literal": "HHH"
                        }
                    }
                ]
            }
        });
    })
})