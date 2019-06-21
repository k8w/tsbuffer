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
- `[Value: Varint(ZigZag)]`

## 引用类型，按实际引用编码
- IndexedAccess
- Reference

## Interface
注意，可能存在多个BlockID相同的块（interface），所以不是传统的ID编码块。
```
[
    [BlockID数量: Varint],
    [BlockID: Varint, Block],
    [BlockID: Varint, Block],
    ...
]
```

### BlockID
BlockID组成方式 实际ID + 末尾1Bit
- BlockID == 0，代表 indexSignature block
- BlockID 在 1~9 代表 extend block (extendId = BlockID - 1)
- BlockID >= 10 代表property (propertyId = BlockID - 10)

### IndexSignature Block
```
[ 字段名: string, Payload ]
```

### Extend Block
- Block同interface

### Property Block
- Block即为值Payload

### 特殊说明
- type为Literal的property将不会被编码（解码时自动补回这些字段）
- extend block，如果其中没有可编码字段，将不编码该block
    - 例如extend自 `{ type: 'SomeThing' }`，虽然其中有一个字段，但由于上述规则，Literal不编码，故实际可编码字段数为0，所以将不编码这个extend block。

## MappedType
### Pick/Omit/Partial
- 同target的interface编码

### Overwrite
```
[overwrite部分编码, 原interface编码]
```

### Extends Block
- 同`encode(value, extendSchema)`

### 特别说明
- 同一字段，前序编码后，后续不再重复编码。

## Literal
- 不需要编码 0字节

## Number
采用类似Protobuf的编码方式
- uint: Varint
- int: Varint(ZigZag)
- int32/uint32/float32: 32位定长
- int64/uint64/double: 64位定长
- bigint: `[byteLength: varint, bytes]`

## Omit/Pick/Partial
- 同其target的interface，编码ID亦一致

## Overwrite
- `[overwrite interface ID块, target interface ID块]`
- 以上ID块，均同interface
- 字段出现在overwriteID块的情况
    - 字段在overwrite schema中有定义
    - 字段属于indexSignature，而overwrite中有定义indexSignature
- 其它情况下，字段出现在targetID块
- ID即为 target 和 overwrite 它们各自的ID

## String
- UTF8编码
- `[byteLength: varint, buffer]`

## Tuple
- 同 `Array`
- `[数组长度: varint, Payload1, Payload2, ...]`

## Intersection / Union
- ID编码块
- 如果2个ID内部有共同的字段，那么在前序ID中一旦编码，后续ID不再重复编码
```
[
    ID数量: varint,
    [ID1, Payload1],
    [ID2, Payload2],
    ...
]
```

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