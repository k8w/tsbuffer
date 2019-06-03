TS Buffer Encode
---

# 编码方式

id | PayLoad

- 先measureLength
- 再writeBuffer
- 递归

interface流程
- 先递归遍历所有字段，计算buffer总长度
- 初始化buffer
- 按顺序writeBuffer

## 值

- 基本类型
    - boolean = 1 Byte
    - number = Size 4 Byte (可配，最大)
        - int8, int16, int32, int64, uint8 ...
        - 或Variant（由配置决定）
    - string
        - Variant
- 数组
    - Size 2 Byte （可配）
    - 值 值 值
- 条件逻辑
    - 如果是AND逻辑，值
    - 如果是OR逻辑，INDEX（满足的是第几个逻辑），1Byte（可配）
- interface
- Buffer
    - Size 4Byte（可配，最大）
    - 值