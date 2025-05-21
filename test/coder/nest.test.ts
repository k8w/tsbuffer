import * as assert from "assert"
import { TSBuffer } from "../../src/index"
import { TSBufferProtoGenerator } from "tsbuffer-proto-generator"

describe("Nest", function () {
  it("Array", async function () {
    let proto = await new TSBufferProtoGenerator({
      readFile: () => `
                export type b = number[];
                export type c = string[];
                export type d = string[][];
            `,
    }).generate("a.ts")
    let tsb = new TSBuffer(proto)

    ;[[], [1, 2, 3]].forEach(v => {
      assert.deepStrictEqual(tsb.decode(tsb.encode(v, "a/b").buf!, "a/b").value, v)
    })

    ;[[], ["a/b", "c"]].forEach(v => {
      assert.deepStrictEqual(tsb.decode(tsb.encode(v, "a/c").buf!, "a/c").value, v)
    })

    ;[[], [["a"], ["b", "b"], ["c", "c", "c"]]].forEach(v => {
      assert.deepStrictEqual(tsb.decode(tsb.encode(v, "a/d").buf!, "a/d").value, v)
    })
  })

  it("Tuple", async function () {
    let proto = await new TSBufferProtoGenerator({
      readFile: () => `
                export type b = [number, number, string];
                export type c = [number, string, string?, number?, true?];
            `,
    }).generate("a.ts")
    let tsb = new TSBuffer(proto)

    ;[
      [1, 0, "asdg"],
      [-123, 123.456, ""],
    ].forEach(v => {
      assert.deepStrictEqual(tsb.decode(tsb.encode(v, "a/b").buf!, "a/b").value, v)
    })

    ;[
      [123, "asbc"],
      [123, "asdg", "sgdasdg"],
      [123.124, "asdg", "asdg", 412],
    ].forEach(v => {
      assert.deepStrictEqual(tsb.decode(tsb.encode(v, "a/c").buf!, "a/c").value, v)
    })

    ;[[123.124, "asdg", "asdg", 412, true]].forEach(v => {
      assert.deepStrictEqual(tsb.decode(tsb.encode(v, "a/c").buf!, "a/c").value, v)
    })

    assert.deepStrictEqual(
      tsb.decode(tsb.encode([123.124, "asdg", undefined, undefined], "a/c").buf!, "a/c").value,
      [123.124, "asdg"]
    )
    assert.deepStrictEqual(
      tsb.decode(tsb.encode([123.124, "asdg", undefined, 123, undefined], "a/c").buf!, "a/c").value,
      [123.124, "asdg", undefined, 123]
    )
    assert.equal(
      tsb.encode([123.124, "asdg", undefined, undefined], "a/c").buf!.length,
      tsb.encode([123.124, "asdg"], "a/c").buf!.length
    )
  })

  it("Cycle Reference in interface", async function () {
    let proto = await new TSBufferProtoGenerator({
      readFile: () => `
                export type Node = {
                    name: string,
                    children: Node[]
                }
            `,
    }).generate("a.ts")
    let tsb = new TSBuffer(proto)

    type Node = {
      name: string
      children: Node[]
    }
    let node1: Node = { name: "111", children: [] }
    let node2: Node = {
      name: "222",
      children: [
        { name: "222-1", children: [] },
        { name: "222-2", children: [] },
      ],
    }
    let root: Node = { name: "root", children: [node1, node2] }

    assert.deepStrictEqual(tsb.decode(tsb.encode(root, "a/Node").buf!, "a/Node").value, root)
  })
})
