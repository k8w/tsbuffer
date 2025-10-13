import { SchemaType, TSBufferSchema } from "tsbuffer-schema"
import { TSBufferValidator } from "tsbuffer-validator"

export class CoderUtil {
  static isJsonCompatible(
    schema: TSBufferSchema,
    type: "encode" | "decode",
    protoHelper: TSBufferValidator["protoHelper"]
  ): boolean {
    const cacheKey = type === "encode" ? "isJsonEncodable" : "isJsonDecodable"

    // 缓存优化：如果已经计算过，直接返回缓存结果
    const cachedResult = (schema as any)[cacheKey] as boolean | undefined
    if (cachedResult !== undefined) {
      return cachedResult
    }

    // 访问记录：用于检测和避免循环引用
    const visited = new Set<TSBufferSchema>()

    /**
     * 检查一组子 schema 是否都兼容 JSON。
     * 如果任何一个子 schema 不兼容，则立即返回 false。
     * @param childrenSchemas 要检查的子 schema 数组
     * @returns 如果所有子 schema 都兼容 JSON，则返回 true；否则返回 false。
     */
    const _isChildrenJsonCompatible: (childrenSchemas: TSBufferSchema[]) => boolean = (
      childrenSchemas: TSBufferSchema[]
    ) => {
      // 遍历所有子 schema
      for (const childSchema of childrenSchemas) {
        const childResult = dfs(childSchema)

        // 提前终止：如果任何一个子级返回 No，立即返回 No
        if (childResult === false) {
          return false
        }
      }

      // 所有子级都返回 Yes，或没有子级（空数组），则返回 Yes
      return true
    }

    /**
     * 深度优先搜索 (DFS) 的递归辅助函数
     * @param currentSchema 当前要检查的 schema
     * @returns Yes 表示该 schema 及其子级都兼容 JSON，No 表示发现不兼容的类型
     */
    const dfs = (currentSchema: TSBufferSchema): boolean => {
      // 循环引用处理：如果当前 schema 正在访问中，说明遇到了循环
      //    返回 Yes 表示这条路径是"安全"的（没有引入新的不兼容类型）
      if (visited.has(currentSchema)) {
        return true
      }

      // 将当前 schema 标记为正在访问
      visited.add(currentSchema)

      let result: boolean

      // 判断 schema 类型并处理
      switch (currentSchema.type) {
        case SchemaType.Array:
          result = dfs(currentSchema.elementType)
          break
        case SchemaType.Tuple:
          result = _isChildrenJsonCompatible(currentSchema.elementTypes)
          break
        case SchemaType.Interface: {
          const flatSchema = protoHelper.getFlatInterfaceSchema(currentSchema)
          result = _isChildrenJsonCompatible([
            ...flatSchema.properties.map(v => v.type),
            ...(flatSchema.indexSignature ? [flatSchema.indexSignature.type] : []),
          ])
          break
        }
        case SchemaType.IndexedAccess:
        case SchemaType.Reference: {
          const parsed = protoHelper.parseReference(currentSchema)
          result = dfs(parsed)
          break
        }
        case SchemaType.Union:
        case SchemaType.Intersection:
          result = _isChildrenJsonCompatible(currentSchema.members.map(v => v.type))
          break
        case SchemaType.NonNullable:
          result = dfs(currentSchema.target)
          break
        case SchemaType.Pick:
        case SchemaType.Partial:
        case SchemaType.Omit:
        case SchemaType.Overwrite: {
          const parsed = protoHelper.parseMappedType(currentSchema)
          if (parsed.type === SchemaType.Interface) {
            const flatSchema = protoHelper.getFlatInterfaceSchema(currentSchema)
            result = _isChildrenJsonCompatible([
              ...flatSchema.properties.map(v => v.type),
              ...(flatSchema.indexSignature ? [flatSchema.indexSignature.type] : []),
            ])
          } else if (parsed.type === SchemaType.Union || parsed.type === SchemaType.Intersection) {
            result = _isChildrenJsonCompatible(parsed.members.map(v => v.type))
          } else {
            // @ts-expect-error
            throw new Error(`不应该走到这里` + parsed.type)
          }
          break
        }
        // Base Case: 到达"叶子节点"，判断是否兼容 JSON
        case SchemaType.Custom:
        case SchemaType.Date:
        case SchemaType.Buffer:
          result = false
          break
        default:
          result = true
          break
      }

      // 访问完成后从 visited 中移除，允许其他路径重新访问
      visited.delete(currentSchema)

      return result
    }

    // 从根 schema 开始启动 DFS 遍历
    const result = dfs(schema)
    ;(schema as any)[cacheKey] = result

    return result
  }
}
