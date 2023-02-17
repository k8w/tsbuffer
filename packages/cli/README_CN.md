TSBuffer 命令行实用工具
===

[EN](README.md) / 中文

[TSBuffer](https://npmjs.com/tsbuffer) 命令行使用工具

## 安装
```
npm i -g tsbuffer-cli
```

# 示例
### 生成Proto
```
tsbuffer proto -i **/*.ts -o proto.json
```

### 编码测试
```
tsbuffer encode -p proto.json -s a/b/c/TypeName "{value: 1}"
tsbuffer encode -p proto.json -s a/b/c/TypeName "{value: 1}" -o buf.bin 
```

### 解码测试
```
tsbuffer decode -p proto.json -s a/b/c/TypeName "01 0A 01"
tsbuffer decode -p proto.json -s a/b/c/TypeName -i buf.bin
```

### 类型验证
```
tsbuffer validate -p proto.json -s a/b/c/TypeName "{value: 1}"
tsbuffer validate -p proto.json -s a/b/c/TypeName -i value.js
```

### 显示二进制文件
```
tsbuffer show buf.bin
```

## 命令行参数说明
```
tsbuffer proto <options>                生成Proto文件
    -i, --input <file>                  用来生成Proto的TS文件（glob表达式）
                                        将导出所有export的类型
    -o, --output <file>                 输出的文件路径，不指定将直接输出到命令行
    -c, --compatible <file>             兼容模式：要兼容的旧Proto文件的路径（默认同output）
    -n, --new                           不兼容旧版，生成全新的Proto文件
    -u, --ugly                          输出为可读性较差但体积更小压缩格式
    -v, --verbose                       显示调试信息

tsbuffer encode <options> [exp]         编码JS表达式
    [exp]                               要编码的值（JS表达式，例如"123" "new Uint8Array([1,2,3])"）
    -p, --proto <file>                  编码要使用的Proto文件
    -s, --schema <id>                   编码要使用的SchemaID
    -i, --input <file>                  输入为文件，不可与[exp]同用（文件内容为JS表达式）
    -o, --output <file>                 输出的文件路径，不指定将直接输出到命令行
    -v, --verbose                       显示调试信息
                                        
tsbuffer decode <options> [binstr]      解码二进制数据
    [binstr]                            要解码的二进制数据的字符串表示，如"0F A2 E3 F2 D9"
    -p, --proto <file>                  解码要使用的Proto文件
    -s, --schema <id>                   解码要使用的SchemaID
    -i, --input <file>                  输入为文件，不可与[binstr]同用
    -o, --output <file>                 输出的文件路径，不指定将直接输出到命令行
    -v, --verbose                       显示调试信息

tsbuffer validate <options> [exp]       验证JSON数据
    [exp]                               要验证的值（JS表达式，例如"123" "new Uint8Array([1,2,3])"）
    -p, --proto <file>                  验证要使用的Proto文件
    -s, --schema <id>                   验证要使用的SchemaID
    -i, --input <file>                  输入为文件，不可与[exp]同用（文件内容为JS表达式）

tsbuffer show <file>                    打印二进制文件内容
```