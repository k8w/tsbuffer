import assert from "assert";
import path from "path";
import { ProtoGenerator } from '../../../src/ProtoGenerator';

describe('Remark', function () {
    it('preserveRemark', async function () {
        let generator = new ProtoGenerator({
            baseDir: path.resolve(__dirname, 'sources'),
            keepComment: true
        });

        let proto = await generator.generate('Remark.ts');
        assert.deepStrictEqual(proto, {
            "Remark/ReqPtlName": {
                "type": "Interface",
                "extends": [
                    {
                        "id": 0,
                        "type": {
                            "type": "Reference",
                            "target": "Remark/BaseRequest"
                        }
                    }
                ],
                "properties": [
                    {
                        "id": 0,
                        "name": "a",
                        "type": {
                            "type": "Number",
                            "comment": "Field A"
                        }
                    },
                    {
                        "id": 1,
                        "name": "b",
                        "type": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "b1",
                                    "type": {
                                        "type": "String",
                                        "comment": "Field B.B1"
                                    }
                                }
                            ],
                            "comment": "Field B"
                        }
                    },
                    {
                        "id": 2,
                        "name": "c",
                        "type": {
                            "type": "Array",
                            "elementType": {
                                "type": "Reference",
                                "target": "Remark/CCC"
                            },
                            "comment": "Array of CCC"
                        }
                    },
                    {
                        "id": 3,
                        "name": "d",
                        "type": {
                            "type": "Reference",
                            "target": "Remark/DDD"
                        }
                    },
                    {
                        "id": 4,
                        "name": "e",
                        "type": {
                            "type": "Reference",
                            "target": "Remark/EEE"
                        }
                    }
                ],
                "comment": "这是我的第一条测试协议"
            },
            "Remark/BaseRequest": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "sso",
                        "type": {
                            "type": "String",
                            "comment": "SSO Token"
                        },
                        "optional": true
                    }
                ]
            },
            "Remark/CCC": {
                "type": "Interface",
                "properties": [
                    {
                        "id": 0,
                        "name": "valueC",
                        "type": {
                            "type": "String",
                            "comment": "valueC ahahaha"
                        }
                    }
                ],
                "comment": "a good CCC"
            },
            "Remark/DDD": {
                "type": "Union",
                "members": [
                    {
                        "id": 0,
                        "type": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "type",
                                    "type": {
                                        "type": "Literal",
                                        "literal": "A"
                                    }
                                },
                                {
                                    "id": 1,
                                    "name": "valueA",
                                    "type": {
                                        "type": "String"
                                    }
                                }
                            ],
                            "comment": "情况 A"
                        }
                    },
                    {
                        "id": 1,
                        "type": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "type",
                                    "type": {
                                        "type": "Literal",
                                        "literal": "B"
                                    }
                                },
                                {
                                    "id": 1,
                                    "name": "valueB",
                                    "type": {
                                        "type": "Number"
                                    }
                                }
                            ],
                            "comment": "情况 B"
                        }
                    },
                    {
                        "id": 2,
                        "type": {
                            "type": "Array",
                            "elementType": {
                                "type": "String",
                                "comment": "其它情况"
                            },
                            "comment": "其它情况"
                        }
                    }
                ],
                "comment": "这样的情况"
            },
            "Remark/EEE": {
                "type": "Union",
                "members": [
                    {
                        "id": 0,
                        "type": {
                            "type": "Literal",
                            "literal": "AAA"
                        }
                    },
                    {
                        "id": 1,
                        "type": {
                            "type": "Literal",
                            "literal": "BBB"
                        }
                    },
                    {
                        "id": 2,
                        "type": {
                            "type": "Literal",
                            "literal": "CCC"
                        }
                    }
                ],
                "comment": "EE哈哈哈哈"
            },
            "Remark/ReqUsingType": {
                "type": "Interface",
                "comment": "这应该是可见的注释\nAAA\nBBB\nCCC"
            }
        })
    })
})