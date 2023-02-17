import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { AstParser } from '../../../src/AstParser';

describe('astParser.parseSchema', function () {
  const astParser = new AstParser();

  it('normal', function () {
    let content = fs
      .readFileSync(path.resolve(__dirname, 'sourceFiles/normal.ts'))
      .toString();
    let schema = astParser.parseScript(content);
    assert.deepStrictEqual(schema, {
      Test1: {
        isExport: true,
        schema: {
          type: 'Interface',
          properties: [
            {
              id: 0,
              name: 'a',
              type: { type: 'String' },
            },
            {
              id: 1,
              name: 'b',
              type: { type: 'Number' },
            },
            {
              id: 2,
              name: 'c',
              optional: true,
              type: { type: 'Boolean' },
            },
            {
              id: 3,
              name: 'd',
              type: {
                type: 'Interface',
                properties: [
                  {
                    id: 0,
                    name: 'd1',
                    optional: true,
                    type: { type: 'String' },
                  },
                  {
                    id: 1,
                    name: 'd2',
                    type: {
                      type: 'Array',
                      elementType: {
                        type: 'String',
                      },
                    },
                  },
                ],
              },
            },
            {
              id: 4,
              name: 'e',
              type: {
                type: 'Array',
                elementType: {
                  type: 'Array',
                  elementType: {
                    type: 'Number',
                  },
                },
              },
            },
          ],
        },
      },

      Test2: {
        isExport: false,
        schema: {
          type: 'Interface',
          properties: [
            {
              id: 0,
              name: 'a1',
              type: {
                type: 'String',
              },
            },
            {
              id: 1,
              name: 'b1',
              type: {
                type: 'Number',
              },
            },
          ],
        },
      },

      Test3: {
        isExport: true,
        schema: {
          type: 'Interface',
          properties: [
            {
              id: 0,
              name: 'a2',
              type: {
                type: 'Array',
                elementType: {
                  type: 'Boolean',
                },
              },
            },
            {
              id: 1,
              name: 'b2',
              type: {
                type: 'Interface',
                properties: [
                  {
                    id: 0,
                    name: 'test',
                    type: {
                      type: 'String',
                    },
                  },
                ],
              },
            },
          ],
        },
      },

      Test4: {
        isExport: false,
        schema: {
          type: 'Interface',
          properties: [
            {
              id: 0,
              name: 'a3',
              type: {
                type: 'Array',
                elementType: {
                  type: 'String',
                },
              },
            },
          ],
        },
      },

      default: {
        isExport: true,
        schema: {
          type: 'Reference',
          target: 'Test4',
        },
      },
    });
  });

  it('namespace', function () {
    let content = fs
      .readFileSync(path.resolve(__dirname, 'sourceFiles/namespace.ts'))
      .toString();
    let schema = astParser.parseScript(content);
    assert.deepStrictEqual(schema, {
      Test1: {
        isExport: true,
        schema: {
          type: 'Interface',
          properties: [
            {
              id: 0,
              name: 'a',
              type: { type: 'String' },
            },
            {
              id: 1,
              name: 'b',
              optional: true,
              type: {
                type: 'Array',
                elementType: {
                  type: 'Number',
                },
              },
            },
          ],
        },
      },

      Test2: {
        isExport: true,
        schema: {
          type: 'Interface',
          properties: [
            {
              id: 0,
              name: 'c',
              type: {
                type: 'Union',
                members: [
                  {
                    id: 0,
                    type: {
                      type: 'Boolean',
                    },
                  },
                  {
                    id: 1,
                    type: {
                      type: 'Interface',
                      properties: [
                        {
                          id: 0,
                          name: 'value',
                          type: {
                            type: 'Boolean',
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },

      'TestNS.NsIf1': {
        isExport: true,
        schema: {
          type: 'Interface',
          properties: [
            {
              id: 0,
              name: 'value1',
              type: {
                type: 'String',
              },
            },
          ],
        },
      },

      'TestNS.NsIf2': {
        isExport: false,
        schema: {
          type: 'Interface',
          properties: [
            {
              id: 0,
              name: 'value2',
              type: {
                type: 'Array',
                elementType: {
                  type: 'Number',
                },
              },
            },
          ],
        },
      },

      'TestNS.NsTp3': {
        isExport: true,
        schema: {
          type: 'Union',
          members: [
            {
              id: 0,
              type: {
                type: 'Reference',
                target: 'NsIf1',
              },
            },
            {
              id: 1,
              type: {
                type: 'Reference',
                target: 'NsIf2',
              },
            },
          ],
        },
      },
    });
  });

  it('export default namespace', function () {
    let schema = astParser.parseScript(
      `namespace NSTest {
                export type Test = string;
                export type Test1 = Test;
                type Test2 = string;
            }
            export default NSTest`
    );

    assert.deepStrictEqual(schema, {
      'NSTest.Test': {
        isExport: false,
        schema: {
          type: 'String',
        },
      },
      'NSTest.Test1': {
        isExport: false,
        schema: {
          type: 'Reference',
          target: 'Test',
        },
      },
      'NSTest.Test2': {
        isExport: false,
        schema: {
          type: 'String',
        },
      },
      'default.Test': {
        isExport: true,
        schema: {
          type: 'Reference',
          target: 'NSTest.Test',
        },
      },
      'default.Test1': {
        isExport: true,
        schema: {
          type: 'Reference',
          target: 'NSTest.Test1',
        },
      },
    });
  });
});
