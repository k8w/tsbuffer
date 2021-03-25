import { TSBufferSchema, SchemaType } from "tsbuffer-schema";

/** @internal */
export class SchemaUtil {

    /** type类型是否能编码为该literal */
    static canBeLiteral(schema: TSBufferSchema, literal: any): boolean {
        if (schema.type === SchemaType.Union) {
            return schema.members.some(v => this.canBeLiteral(v.type, literal))
        }

        if (schema.type === SchemaType.Any) {
            return true;
        }

        if (schema.type === SchemaType.Literal && schema.literal === literal) {
            return true;
        }

        return false;
    }

}