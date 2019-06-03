Schema编码方式
---

# 术语定义

## Payload
一个完整的编码块，在已知Schema的情况下，无需知道Payload的长度，即可从起点位置解析整个块，主要分以下几类：
    - 定长：知道Schema即确认Payload长度
    - 长度限定： [byteLength: Varint, content]
    - Varint
    - 其它

## ID编码块
- 一个编码块由多个部分组成
- 每个部分由编码ID来区分
- ID确认后，编码顺序无所谓
- ID与Schema对应
- 用于Interface、Tuple等类型
```
[
    [字段数量: Varint],
    [ID1: Varint, Payload1],
    [ID2: Varint, Payload1],
    ...
]
```

# Schema编码规则

## Any/NonPrimitive
- `[byteLength: varint, JSON字符串: string]`

## Array
- `[数组长度: varint, Payload1, Payload2, ...]`

## Boolean
- `[1字节]`

## Buffer
- `[byteLength: varint, Buffer]`

## Enum
- `[Value: Varint]`

## 引用类型，按实际引用编码
- IndexedAccess
- Reference

## Interface
- `[property: ID编码块, [indexSignature: [字段名: string, Payload]]`

## Literal
- 不需要编码 0字节

## Number
采用类似Protobuf的编码方式
- uint: Varint
- int: ZigZag and Varint
- int32/uint32/float32: 32位定长
- int64/uint64/double: 64位定长
- bigint: `[byteLength: varint, bytes]`

## Omit/Pick/Partial
- 同其target的interface，编码ID亦一致

## Overwrite
- `[targetID块, overwriteID块]`
- 字段出现在overwriteID块的情况
    - 字段在overwrite schema中有定义
    - 字段属于indexSignature，而overwrite中有定义indexSignature
- 其它情况下，字段出现在targetID块
- ID即为 target 和 overwrite 它们各自的ID

## String
- UTF8编码
- `[byteLength: varint, buffer]`

## Tuple
- `[数组长度: varint, Payload1, Payload2, ...]`

## Intersection / Union
- 特殊的ID编码块
- 特殊点
    - 如果2个ID内部有共同的字段，那么在前序ID中一旦编码，后续ID不再重复编码

# BufferWrite Operation

- varint: varint编码
- string: utf8
- buffer: buffer
- int32: Int32定长补码编码
<!-- - int64: Int64定长补码编码 -->
- uint32: Uint32定长原码编码
<!-- - uint64: Uint64定长原码编码 -->
- bigint: 暂不支持
- float: float 32位补码编码
- double: double 64位补码编码
- boolean: 1或0