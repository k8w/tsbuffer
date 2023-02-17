import {
  EncodeIdUtil,
  TSBufferProtoGenerator,
} from '@tsbuffer/proto-generator';
import { TSBufferProto } from '@tsbuffer/schema';
import 'colors';
import * as fs from 'fs';
import * as glob from 'glob';
import 'k8w-extend-native';
import * as minimist from 'minimist';
import 'node-json-color-stringify';
import * as path from 'path';
import { TSBuffer } from 'tsbuffer';
import { i18n } from './i18n/i18n';

const colorJson = (json: any) => {
  return (JSON as any).colorStringify(json, null, 2) as string;
};

const version = '__TSBUFFER_CLI_VERSION__';
const args = minimist.default(process.argv);
const verbose: boolean | undefined = args.verbose || args.v;

// 进入主流程
main();

async function main() {
  // Version
  if (args._.length === 2 && (args.version || args.v)) {
    console.log('TSBuffer ' + version);
  }
  // Help
  else if (args.h || args.help) {
    showHelp();
  }
  // Proto
  else if (args._[2] === 'proto') {
    await proto(
      args.input || args.i,
      args.output || args.o,
      args.compatible || args.c,
      args.ugly || args.u,
      args.new
    );
  }
  // Encode
  else if (args._[2] === 'encode') {
    encode(
      args.input || args.i,
      args._[3],
      args.output || args.o,
      args.proto || args.p,
      args.schema || args.s
    );
  }
  // Decode
  else if (args._[2] === 'decode') {
    decode(
      args.proto || args.p,
      args.schema || args.s,
      args.input || args.i,
      args._[3],
      args.output || args.o
    );
  }
  // Validate
  else if (args._[2] === 'validate') {
    validate(
      args.proto || args.p,
      args.schema || args.s,
      args.input || args.i,
      args._[3]
    );
  }
  // Show
  else if (args._[2] === 'show') {
    showBin();
  }
  // Error
  // No Command
  else if (args._.length === 2) {
    showLogo();
    console.log(formatStr(i18n.welcome, { version: version }).green);
    console.log('\n' + i18n.example);
    console.log('\n' + i18n.helpGuide.yellow);
  } else {
    error(i18n.errCmd);
  }

  process.exit(0);
}

function showLogo() {
  console.log(
    `
88888888888 .d8888b.  888888b.             .d888  .d888                           
    888    d88P  Y88b 888  "88b           d88P"  d88P"                  
    888    Y88b.      888  .88P           888    888                    
    888     "Y888b.   8888888K.  888  888 888888 888888 .d88b.  888d888 
    888        "Y88b. 888  "Y88b 888  888 888    888   d8P  Y8b 888P"   
    888          "888 888    888 888  888 888    888   88888888 888     
    888    Y88b  d88P 888   d88P Y88b 888 888    888   Y8b.     888     
    888     "Y8888P"  8888888P"   "Y88888 888    888    "Y8888  888     
------------------------------------------------------------------------
`.green
  );
}

function showHelp() {
  showLogo();
  console.log(formatStr(i18n.welcome, { version: version }).green);
  console.log('\n' + i18n.help);
  console.log('\n' + i18n.example);
}

async function proto(
  input?: string | string[],
  output?: string,
  compatible?: string,
  ugly?: boolean,
  newMode?: boolean
) {
  // 解析输入
  if (!input) {
    throw error(i18n.missingParam, { param: '--file' });
  }
  let fileList: string[] = [];
  if (!Array.isArray(input)) {
    input = [input];
  }
  input.forEach((v) => {
    // 文件夹 直接视为通配符
    if (fs.existsSync(v) && fs.statSync(v).isDirectory()) {
      v = path.join(v, '**/*.ts');
    }
    fileList = fileList.concat(glob.sync(v));
  });
  fileList = fileList.distinct();

  // compatible 默认同output
  const oldProtoPath = compatible || output;
  let oldProto: TSBufferProto | undefined;
  if (!newMode && oldProtoPath) {
    // 打开OldFile
    let oldFile: string | undefined;
    try {
      oldFile = fs.readFileSync(oldProtoPath).toString();
    } catch {
      if (compatible) {
        throw error(i18n.fileOpenError, { file: path.resolve(oldProtoPath) });
      }
    }

    if (oldFile) {
      // Parse TS
      if (oldProtoPath.endsWith('.ts')) {
        const match = oldFile.match(
          /^\s*export\s+const\s+proto\s*=\s*(\{[\s\S]+\});?\s*/
        );
        if (match) {
          try {
            oldProto = JSON.parse(match[1]);
          } catch (e) {
            throw error(i18n.protoParsedError, {
              innerError: (e as Error).message,
            });
          }
        } else {
          console.error(`Not invalid proto ts file: ${oldProtoPath}`);
          throw error(i18n.protoParsedError);
        }
      }
      // Parse JSON
      else {
        try {
          oldProto = JSON.parse(oldFile);
        } catch {
          throw error(i18n.protoParsedError, {
            file: path.resolve(oldProtoPath),
          });
        }
      }
    }
  }

  let canOptimizeByNew = false;
  EncodeIdUtil.onGenCanOptimized = () => {
    canOptimizeByNew = true;
  };
  const proto = await new TSBufferProtoGenerator({ verbose: verbose }).generate(
    fileList,
    {
      compatibleResult: oldProto,
    }
  );

  if (output) {
    if (canOptimizeByNew) {
      console.warn(i18n.canOptimizeByNew);
    }

    const json = ugly ? JSON.stringify(proto) : JSON.stringify(proto, null, 2);
    // Output TS
    if (output.endsWith('.ts')) {
      fs.writeFileSync(output, `export const proto = ${json};`);
    }
    // Output JSON
    else {
      fs.writeFileSync(output, json);
    }
    console.log(
      formatStr(i18n.protoSucc, { output: path.resolve(output) }).green
    );
  } else {
    console.log(colorJson(proto));
  }
}

function encode(
  input?: string,
  exp?: string,
  output?: string,
  proto?: string,
  schemaId?: string
) {
  const parsedProto = parseProtoAndSchema(proto, schemaId);

  // #region 解析Input Value
  let inputValue: any;
  if (input) {
    let fileContent: string;
    try {
      fileContent = fs.readFileSync(input).toString();
    } catch {
      throw error(i18n.fileOpenError, { file: path.resolve(input) });
    }
    try {
      inputValue = eval(fileContent);
    } catch {
      throw error(i18n.jsParsedError, { file: path.resolve(input) });
    }
  } else if (exp) {
    try {
      inputValue = eval(`()=>(${exp})`)();
    } catch (e) {
      if (verbose) {
        console.log('exp', exp);
        console.error(e);
      }
      throw error(i18n.expParsedError);
    }
  } else {
    throw error(i18n.missingParam, {
      param: `--input ${i18n.or} [expression]`,
    });
  }
  // #endregion

  verbose && console.log('inputValue', inputValue);
  const opEncode = new TSBuffer(parsedProto.proto).encode(
    inputValue,
    parsedProto.schemaId
  );
  if (!opEncode.isSucc) {
    return error('编码失败。\n    ' + opEncode.errMsg);
  }

  console.log('编码长度：' + opEncode.buf.byteLength);
  if (output) {
    fs.writeFileSync(output, opEncode.buf);
    console.log(
      formatStr(i18n.encodeSucc, { output: path.resolve(output) }).green
    );
  } else {
    console.log(buf2Hex(opEncode.buf).yellow);
  }
}

function decode(
  protoPath?: string,
  schemaId?: string,
  input?: string,
  binStr?: string,
  output?: string
) {
  const parsedProto = parseProtoAndSchema(protoPath, schemaId);
  let inputBuf: Buffer;

  if (input) {
    try {
      inputBuf = fs.readFileSync(input);
    } catch (e) {
      verbose && console.error(e);
      throw error(i18n.fileOpenError, { file: path.resolve(input) });
    }
  } else if (binStr) {
    inputBuf = hex2Bin(binStr);
  } else {
    throw error(i18n.missingParam, { param: `--input ${i18n.or} [binstr]` });
  }

  let decodedValue: any;
  try {
    decodedValue = new TSBuffer(parsedProto.proto).decode(
      new Uint8Array(inputBuf),
      parsedProto.schemaId
    );
  } catch (e) {
    throw error('解码失败:\n    ' + (e as Error).message);
  }

  if (output) {
    fs.writeFileSync(output, JSON.stringify(decodedValue, null, 2));
    console.log(formatStr(i18n.decodeSucc, { output: output }).green);
  } else {
    console.log(colorJson(decodedValue));
  }
}

function validate(
  proto?: string,
  schemaId?: string,
  input?: string,
  expression?: string
) {
  const parsedProto = parseProtoAndSchema(proto, schemaId);

  // #region 解析Input Value
  let inputValue: any;
  if (input) {
    let fileContent: string;
    try {
      fileContent = fs.readFileSync(input).toString();
    } catch {
      throw error(i18n.fileOpenError, { file: path.resolve(input) });
    }
    try {
      inputValue = eval(fileContent);
    } catch {
      throw error(i18n.jsParsedError, { file: path.resolve(input) });
    }
  } else if (expression) {
    try {
      inputValue = eval(`()=>(${expression})`)();
    } catch (e) {
      if (verbose) {
        console.log('exp', expression);
        console.error(e);
      }
      throw error(i18n.expParsedError);
    }
  } else {
    throw error(i18n.missingParam, {
      param: `--input ${i18n.or} [expression]`,
    });
  }
  // #endregion

  const vRes = new TSBuffer(parsedProto.proto).validate(
    inputValue,
    parsedProto.schemaId
  );
  if (vRes.isSucc) {
    console.log(i18n.validateSucc.green);
  } else {
    error(i18n.validateFail, { msg: vRes.errMsg });
  }
}

function error(str: string, data?: { [key: string]: string }) {
  if (data) {
    str = formatStr(str, data);
  }
  console.error(i18n.error.bgRed.white, str.red);
  process.exit(-1);
}

function formatStr(str: string, data: { [key: string]: string }) {
  for (const key in data) {
    while (str.indexOf(key) > -1) {
      str = str.replace(`\${${key}}`, data[key]);
    }
  }
  return str;
}

function buf2Hex(buf: Uint8Array): string {
  const arr: string[] = [];
  buf.forEach((v) => {
    let char = v.toString(16).toUpperCase();
    if (char.length === 1) {
      char = '0' + char;
    }
    arr.push(char);
  });
  return arr.join(' ');
}

function hex2Bin(hexStr: string): Buffer {
  return Buffer.from(
    new Uint8Array(
      hexStr
        .trim()
        .split(/\s+/)
        .map((v) => parseInt('0x' + v))
    )
  );
}

function showBin() {
  if (args._.length < 4) {
    throw error(i18n.missingParam, { param: '<file>' });
  }
  let buf: Uint8Array;
  try {
    buf = new Uint8Array(fs.readFileSync(args._[3]));
    console.log('编码长度：' + buf.byteLength);
  } catch (e) {
    verbose && console.error(e);
    throw error(i18n.fileOpenError, { file: path.resolve(args._[3]) });
  }
  console.log(buf2Hex(buf).yellow);
}

function parseProtoAndSchema(
  proto: string | undefined,
  schemaId: string | undefined
) {
  // #region 解析Proto
  if (!proto) {
    error(i18n.missingParam, { param: '--proto' });
    throw new Error();
  }
  if (!schemaId) {
    error(i18n.missingParam, { param: '--schema' });
    throw new Error();
  }
  let protoContent: string;
  try {
    protoContent = fs.readFileSync(proto).toString();
  } catch {
    throw error(i18n.fileOpenError, { file: path.resolve(proto) });
  }
  let protoJson: TSBufferProto;
  try {
    protoJson = JSON.parse(protoContent);
    return { proto: protoJson, schemaId: schemaId };
  } catch {
    throw error(i18n.protoParsedError, { file: path.resolve(proto) });
  }
  // #endregion
}
