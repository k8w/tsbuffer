# TSBuffer CLI Tools

EN / [中文](README_CN.md)

CLI utilities for [TSBuffer](https://npmjs.com/tsbuffer)

# Install

```
npm i -g tsbuffer-cli
```

## Usage

### Generate proto

```
tsbuffer proto -i **/*.ts -o proto.json
```

### Encode Test

```
tsbuffer encode -p proto.json -s a/b/c/TypeName "{value: 1}"
tsbuffer encode -p proto.json -s a/b/c/TypeName "{value: 1}" -o buf.bin
```

### Decode Test

```
tsbuffer decode -p proto.json -s a/b/c/TypeName "01 0A 01"
tsbuffer decode -p proto.json -s a/b/c/TypeName -i buf.bin -o output.js
```

### Validate Test

```
tsbuffer validate -p proto.json -s a/b/c/TypeName "{value: 1}"
tsbuffer validate -p proto.json -s a/b/c/TypeName -i xxx.js
```

### Show buffer

```
tsbuffer show buf.bin
```

## CLI Reference

```
tsbuffer proto <options>                Generate proto file
    -i, --input <file>                  Input TS file (support glob expression)
                                        It would generate all exported types
    -o, --output <file>                 Output file (or print to CLI)
    -c, --compatible <file>             Compatible mode, compatible to old proto (=output by default)
    -n, --new                           Generate fresh new proto (no compatible)
    -u, --ugly                          Output as ugly JSON (no indent and smaller)
    -v, --verbose                       Show debug info

tsbuffer encode <options> [exp]         Encode a JS expression or a file (content is JS expression)
    [exp]                               Expression to encode (e.g. "123" "new Uint8Array([1,2,3])")
    -p, --proto <file>                  Proto file to use
    -s, --schema <id>                   SchemaID (filePath/TypeName)
    -i, --input <file>                  Input file path, alternative to [exp]
    -o, --output <file>                 Output file path (or print to CLI)
    -v, --verbose                       Show debug info

tsbuffer decode <options> [binstr]      Decode buffer
    [binstr]                            Buffer to decode, hex string, like "0F A2 E3"
    -p, --proto <file>                  Proto file
    -s, --schema <id>                   SchemaID (filePath/TypeName)
    -i, --input <file>                  Input file path, alternative to [binstr]
    -o, --output <file>                 Output file path (or print to CLI)
    -v, --verbose                       Show debug info

tsbuffer validate <options> [exp]       Validate if a JS expression is valid to a schema
    [exp]                               Expression to validate (e.g. "123" "new Uint8Array([1,2,3])")
    -p, --proto <file>                  Proto file to use
    -s, --schema <id>                   SchemaID (filePath/TypeName)
    -i, --input <file>                  Input file path, alternative to [exp]

tsbuffer show <file>                    Show a binary file as hex string
```
