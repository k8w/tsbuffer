import TSTypeId from "../src/TSTypeId";
import * as fs from "fs";
import * as path from "path";

const allTypes = Object.keys(TSTypeId).filter(v => !/^\d+$/.test(v));

const fileModel = `import BaseSchema from '../BaseSchema';

export default interface {TypeName}TypeSchema extends BaseSchema {
    type: '{TypeName}';
}`

for (let type of allTypes) {
    let content = fileModel.replace(/\{TypeName\}/g, type);
    let filepath = path.resolve(__dirname, '../src/schemas/' + type + 'TypeSchema' + '.ts');
    fs.writeFileSync(filepath, content);
    console.log('done', filepath)
}

let schemaContent = allTypes.map(type => `import ${type}TypeSchema from "./schemas/${type}TypeSchema";`).join('\n')
    + `\n\ntype TSTypeSchema = ` + allTypes.map(v => v + 'TypeSchema').join('\n\t| ')
    + `;\nexport default TSTypeSchema;`;
fs.writeFileSync(path.resolve(__dirname, '../src/TSTypeSchema.ts'), schemaContent);