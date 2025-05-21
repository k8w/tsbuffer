import { TSBuffer } from "../../src/index"

let tsb = new TSBuffer({
  a: {
    a1: {
      type: "Number",
      scalarType: "uint",
    },
    a2: {
      type: "String",
    },
    a3: {
      type: "Interface",
      properties: [
        {
          id: 0,
          name: "e1",
          type: { type: "String" },
        },
        {
          id: 1,
          name: "e2",
          type: { type: "Number" },
        },
      ],
    },
    a4: {
      type: "Interface",
      extends: [
        {
          id: 0,
          type: {
            type: "Reference",
            path: "a",
            targetName: "a3",
          },
        },
      ],
      properties: [
        {
          id: 0,
          name: "value1",
          type: { type: "String" },
        },
        {
          id: 1,
          name: "value2",
          type: {
            type: "Reference",
            path: "a",
            targetName: "a3",
          },
        },
      ],
      indexSignature: {
        keyType: "String",
        type: { type: "Any" },
      },
    },
    a5: {
      type: "Union",
      members: [
        {
          id: 0,
          type: {
            type: "Interface",
            properties: [
              {
                id: 0,
                name: "a",
                type: { type: "String" },
              },
            ],
          },
        },
        {
          id: 1,
          type: {
            type: "Interface",
            properties: [
              {
                id: 0,
                name: "b",
                type: { type: "Number" },
              },
            ],
          },
        },
      ],
    },
    a6: {
      type: "Intersection",
      members: [
        {
          id: 0,
          type: {
            type: "Interface",
            properties: [
              {
                id: 0,
                name: "a",
                type: { type: "String" },
              },
            ],
          },
        },
        {
          id: 1,
          type: {
            type: "Interface",
            properties: [
              {
                id: 0,
                name: "b",
                type: { type: "Number" },
              },
            ],
          },
        },
      ],
    },
  },
})

console.log("Union", tsb.encode({ a: "a", b: 123 }, "a", "a5"))
console.log("Intersection", tsb.encode({ a: "a", b: 123 }, "a", "a6"))

let res = tsb.encode(12345, "a", "a1")
let res1 = tsb.encode("哈哈哈abc", "a", "a2")
let v2 = {
  is1: "aaa",
  is2: [1, 2, 3],
  e1: "sss",
  e2: 222,
  value2: {
    e2: 123456,
    e1: "aaa",
  },
  value1: "Fuck you all",
}
let res2 = tsb.encode(v2, "a", "a4")
// console.log(res);
// console.log(res1);
// console.log(res2);

console.log("压缩率对比", res2.length, JSON.stringify(v2).length)

console.time("TSBuffer encode")
for (let i = 0; i < 1000000; ++i) {
  let res = tsb.encode(v2, "a", "a4")
}
console.timeEnd("TSBuffer encode")

console.time("JSON stringify")
for (let i = 0; i < 1000000; ++i) {
  let res = JSON.stringify(v2)
}
console.timeEnd("JSON stringify")
