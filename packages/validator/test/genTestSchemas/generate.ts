import { TSBufferProtoGenerator } from '@tsbuffer/proto-generator';
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';

async function main() {
  let generator = new TSBufferProtoGenerator({
    baseDir: path.resolve(__dirname, 'source'),
  });

  let files = glob.sync('**/*.ts', {
    cwd: path.resolve(__dirname, 'source'),
  });
  console.log('Files: ', files);

  let result = await generator.generate(files);

  fs.writeFileSync(
    path.resolve(__dirname, 'output.json'),
    JSON.stringify(result, null, 2)
  );

  console.log(JSON.stringify(result, null, 2));
}
main();
