import { SchemaType, TSBufferSchema } from 'tsbuffer-schema';
import { TSBufferValidator } from 'tsbuffer-validator';

export class CoderUtil {
    static isJsonCompatible(schema: TSBufferSchema, type: 'encode' | 'decode', protoHelper: TSBufferValidator['protoHelper']): boolean {
        let schemaInfo: TSBufferSchema & { isJsonEncodable?: boolean, isJsonDecodable?: boolean } = schema;
        const key = type === 'encode' ? 'isJsonEncodable' : 'isJsonDecodable';

        if (schemaInfo[key] === undefined) {
            switch (schema.type) {
                case SchemaType.Array:
                    schemaInfo[key] = this.isJsonCompatible(schema.elementType, type, protoHelper);
                    break;
                case SchemaType.Tuple:
                    schemaInfo[key] = schema.elementTypes.every(v => this.isJsonCompatible(v, type, protoHelper));
                    break;
                case SchemaType.Interface:
                    let flatSchema = protoHelper.getFlatInterfaceSchema(schema);
                    schemaInfo[key] = flatSchema.properties.every(v => this.isJsonCompatible(v.type, type, protoHelper));
                    if (flatSchema.indexSignature) {
                        schemaInfo[key] = schemaInfo[key] && this.isJsonCompatible(flatSchema.indexSignature.type, type, protoHelper);
                    }
                    break;
                case SchemaType.IndexedAccess:
                case SchemaType.Reference: {
                    let parsed = protoHelper.parseReference(schema);
                    schemaInfo[key] = this.isJsonCompatible(parsed, type, protoHelper);
                    break;
                }
                case SchemaType.Union:
                case SchemaType.Intersection:
                    schemaInfo[key] = schema.members.every(v => this.isJsonCompatible(v.type, type, protoHelper));
                    break;
                case SchemaType.NonNullable:
                    schemaInfo[key] = this.isJsonCompatible(schema.target, type, protoHelper);
                    break;
                case SchemaType.Pick:
                case SchemaType.Partial:
                case SchemaType.Omit:
                case SchemaType.Overwrite: {
                    let parsed = protoHelper.parseMappedType(schema);
                    schemaInfo[key] = this.isJsonCompatible(parsed, type, protoHelper);
                    break;
                }
                case SchemaType.Custom:
                case SchemaType.Date:
                case SchemaType.Buffer:
                    schemaInfo[key] = false;
                    break;
                default:
                    schemaInfo[key] = true;
                    break;
            }
        }

        return schemaInfo[key]!;
    }
}