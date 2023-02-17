import { ReferenceTypeSchema, SchemaType, TSBufferSchema } from '@tsbuffer/schema';
import { PrePickOmitSchema } from './AstParser';

export class SchemaUtil {
    /**
     * 解析一个Schema引用到的其它类型
     * @param schema 
     */
    static getUsedReferences(schemas: TSBufferSchema | TSBufferSchema[]): ReferenceTypeSchema[] {
        if (!Array.isArray(schemas)) {
            schemas = [schemas];
        }

        let output: ReferenceTypeSchema[] = [];

        for (const schema of schemas) {
            switch (schema.type) {
                case SchemaType.Array:
                    output = output.concat(this.getUsedReferences(schema.elementType));
                    break;
                case SchemaType.Tuple:
                    output = output.concat(this.getUsedReferences(schema.elementTypes));
                    break;
                case SchemaType.Interface:
                    if (schema.extends) {
                        output = output.concat(this.getUsedReferences(schema.extends.map(v => v.type)));
                    }
                    if (schema.properties) {
                        output = output.concat(this.getUsedReferences(schema.properties.map(v => v.type)));
                    }
                    if (schema.indexSignature) {
                        output = output.concat(this.getUsedReferences(schema.indexSignature.type));
                    }
                    break;
                case SchemaType.IndexedAccess:
                    output = output.concat(this.getUsedReferences(schema.objectType));
                    break;
                case SchemaType.Reference:
                    output.push(schema);
                    break;
                case SchemaType.Union:
                case SchemaType.Intersection:
                    output = output.concat(this.getUsedReferences(schema.members.map(v => v.type)));
                    break;
                case SchemaType.Pick:
                case SchemaType.Omit:
                    output = output.concat(this.getUsedReferences(schema.target));
                    if ((schema as PrePickOmitSchema).pre?.key) {
                        output = output.concat(this.getUsedReferences((schema as PrePickOmitSchema).pre.key));
                    }
                    break;
                case SchemaType.Partial:
                case SchemaType.NonNullable:
                case SchemaType.Keyof:
                    output = output.concat(this.getUsedReferences(schema.target));
                    break;
                case SchemaType.Overwrite:
                    output = output.concat(this.getUsedReferences(schema.target));
                    output = output.concat(this.getUsedReferences(schema.overwrite));
                    break;
                default:
                    break;
            }
        }

        return output;
    }
}