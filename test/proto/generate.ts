import { TSBufferSchemaGenerator } from 'tsbuffer-schema-generator';

let generator = new TSBufferSchemaGenerator();

generator.generate('proto.ts').then(v => {
    console.log(JSON.stringify(v, null, 2));
})