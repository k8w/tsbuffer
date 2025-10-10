import { SchemaType, TSBufferSchema } from "tsbuffer-schema"
import { TSBufferValidator } from "tsbuffer-validator"

export enum JsonCompatibleResult {
  Yes = "Yes",
  No = "No",
  Pending = "Pending",
}
export class CoderUtil {
  static checkJsonCompatible(
    schema: TSBufferSchema,
    type: "encode" | "decode",
    protoHelper: TSBufferValidator["protoHelper"]
  ): JsonCompatibleResult {
    let schemaInfo: TSBufferSchema & {
      isJsonEncodable?: JsonCompatibleResult
      isJsonDecodable?: JsonCompatibleResult
    } = schema
    const key = type === "encode" ? "isJsonEncodable" : "isJsonDecodable"

    // 缓存的 3 种状态：已有缓存 / 无缓存 / 正在计算中（嵌套）
    // 已有缓存：直接用
    // 无缓存：重新算
    // 正在计算中：等待和复用同一份计算结果

    let result: JsonCompatibleResult | undefined = schemaInfo[key]
    // 缓存
    if (result) {
      return result
    }

    // 没有缓存，计算之
    schemaInfo[key] = JsonCompatibleResult.Pending
    switch (schema.type) {
      case SchemaType.Array:
        result = this.checkJsonCompatible(schema.elementType, type, protoHelper)
        break
      case SchemaType.Tuple:
        result = this._isChildrenJsonCompatible(schema.elementTypes, type, protoHelper)
        break
      case SchemaType.Interface:
        let flatSchema = protoHelper.getFlatInterfaceSchema(schema)
        result = this._isChildrenJsonCompatible(
          [
            ...flatSchema.properties.map(v => v.type),
            ...(flatSchema.indexSignature ? [flatSchema.indexSignature.type] : []),
          ],
          type,
          protoHelper
        )
        break
      case SchemaType.IndexedAccess:
      case SchemaType.Reference: {
        let parsed = protoHelper.parseReference(schema)
        result = this.checkJsonCompatible(parsed, type, protoHelper)
        break
      }
      case SchemaType.Union:
      case SchemaType.Intersection:
        result = this._isChildrenJsonCompatible(
          schema.members.map(v => v.type),
          type,
          protoHelper
        )
        break
      case SchemaType.NonNullable:
        result = this.checkJsonCompatible(schema.target, type, protoHelper)
        break
      case SchemaType.Pick:
      case SchemaType.Partial:
      case SchemaType.Omit:
      case SchemaType.Overwrite: {
        let parsed = protoHelper.parseMappedType(schema)
        if (parsed.type === SchemaType.Interface) {
          let flatSchema = protoHelper.getFlatInterfaceSchema(schema)
          result = this._isChildrenJsonCompatible(
            [
              ...flatSchema.properties.map(v => v.type),
              ...(flatSchema.indexSignature ? [flatSchema.indexSignature.type] : []),
            ],
            type,
            protoHelper
          )
        } else if (parsed.type === SchemaType.Union || parsed.type === SchemaType.Intersection) {
          result = this._isChildrenJsonCompatible(
            parsed.members.map(v => v.type),
            type,
            protoHelper
          )
        } else {
          // @ts-expect-error
          throw new Error(`不应该走到这里` + parsed.type)
        }
        break
      }
      case SchemaType.Custom:
      case SchemaType.Date:
      case SchemaType.Buffer:
        result = JsonCompatibleResult.No
        break
      default:
        result = JsonCompatibleResult.Yes
        break
    }

    // 保存结果到缓存
    schemaInfo[key] = result

    return result!
  }

  private static _isChildrenJsonCompatible(
    childrenSchemas: TSBufferSchema[],
    type: "encode" | "decode",
    protoHelper: TSBufferValidator["protoHelper"]
  ) {
    const results = childrenSchemas.map(v => this.checkJsonCompatible(v, type, protoHelper))
    if (results.some(v => v === JsonCompatibleResult.No)) {
      return JsonCompatibleResult.No
    } else if (results.some(v => v === JsonCompatibleResult.Pending)) {
      return JsonCompatibleResult.Pending
    } else {
      return JsonCompatibleResult.Yes
    }
  }
}
