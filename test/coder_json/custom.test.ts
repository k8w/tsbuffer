import assert from "assert"
import { SchemaType } from "tsbuffer-schema"
import { TSBuffer } from "../../src/index"

describe("CustomType", function () {
  const tsb = new TSBuffer({
    "a/b": {
      type: SchemaType.Interface,
      properties: [
        {
          id: 0,
          name: "_id",
          type: {
            type: SchemaType.Reference,
            target: "?bson/ObjectId",
          },
        },
        {
          id: 1,
          name: "value",
          type: { type: SchemaType.String },
        },
      ],
    },
    "?bson/ObjectId": {
      type: SchemaType.Custom,
      validate: value => {
        if (typeof value === "string" && value.length === 24) {
          return { isSucc: true }
        } else {
          return { isSucc: false, errMsg: "Invalid ObjectId" }
        }
      },
      encode: (value: string) => {
        return new Uint8Array(
          Array.from({ length: 12 }, (_, i) => Number.parseInt("0x" + value.substr(i * 2, 2)))
        )
      },
      decode: (buf: Uint8Array) => {
        return Array.from(buf, v => {
          let str = v.toString(16)
          if (str.length === 1) {
            str = "0" + str
          }
          return str
        }).join("")
      },
      encodeJSON: v => v,
      decodeJSON: v => v,
    },
  })

  it("succ", function () {
    let objId = "61531914435b997af15dc382"

    // encode
    let resEncode = tsb.encodeJSON(
      {
        _id: objId,
        value: "ABC",
      },
      "a/b"
    )
    assert.strictEqual(resEncode.isSucc, true)

    // decode
    let resDecode = tsb.decodeJSON(JSON.parse(JSON.stringify(resEncode.json!)), "a/b")
    assert.deepStrictEqual(resDecode.value, {
      _id: objId,
      value: "ABC",
    })
  })

  it("failed", function () {
    let resEncode = tsb.encodeJSON(
      {
        _id: "XXX",
        value: "ABC",
      },
      "a/b"
    )
    assert.strictEqual(resEncode.errMsg, "Property `_id`: Invalid ObjectId")
  })
})
