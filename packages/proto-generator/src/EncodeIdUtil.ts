import { EnumTypeSchema, InterfaceTypeSchema, IntersectionTypeSchema, TSBufferSchema, UnionTypeSchema } from '@tsbuffer/schema';
import { Crypto } from 'k8w-crypto';

export class EncodeIdUtil {

    /** 当 `genEncodeIds` 存在会增大编码大小的冗余时的事件  */
    static onGenCanOptimized?: () => void;

    /**
    * 将字符串映射为从0开始的自增数字，支持向后兼容
    * @param values object将视为 md5(JSON.stringify(obj))
    * @param compatible 需要向后兼容的结果集（新字段用新数字，旧字段ID不变）
    * @returns 返回的顺序必定与values传入的顺序相同
    */
    static genEncodeIds(values: (string | number | object)[], compatible?: EncodeIdItem[]): EncodeIdItem[] {
        // 新元素的起始ID，有compatible则从其下一个开始，全新模式从0开始
        let nextId = 0;
        const existKeyId: { [key: string]: number } = compatible ? compatible.reduce((prev, next) => {
            prev[next.key] = next.id;
            nextId = Math.max(nextId, next.id + 1);
            return prev;
        }, {} as { [key: string]: number }) : {};
        const output: EncodeIdItem[] = [];
        const keys = values.map(v => this.getKey(v));
        for (const key of keys) {
            const id = existKeyId[key] ?? nextId++;
            existKeyId[key] = id;
            output.push({ key: key, id: id })
        }

        // 可优化节点>=32,4096
        const uniqueKeyLength = keys.distinct().length;
        if (nextId > 32 && uniqueKeyLength <= 32 || nextId > 4096 && uniqueKeyLength <= 4096) {
            this.onGenCanOptimized?.();
        }

        return output;
    }

    static getSchemaEncodeKeys(schema: TSBufferSchema): string[] {
        switch (schema.type) {
            case 'Enum': {
                return schema.members.map(v => '' + v.value);
            }
            case 'Interface': {
                return schema.properties ? schema.properties.map(v => v.name) : [];
            }
            case 'Intersection':
            case 'Union':
                return schema.members.map(v => Crypto.md5(JSON.stringify(v.type)));
            default:
                return [];
        }
    }

    static getKey(value: string | number | object): string {
        return typeof (value) === 'object' ? Crypto.md5(JSON.stringify(value)) : '' + value;
    }

    static getSchemaEncodeIds(schema?: TSBufferSchema): EncodeIdItem[] | undefined {
        if (!schema) {
            return undefined;
        }

        switch (schema.type) {
            case 'Enum': {
                return schema.members.map(v => ({ key: EncodeIdUtil.getKey(v.value), id: v.id }));
            }
            case 'Interface': {
                return schema.properties ? schema.properties.map(v => ({ key: EncodeIdUtil.getKey(v.name), id: v.id })) : undefined;
            }
            case 'Intersection':
            case 'Union':
                return schema.members.map(v => ({ key: Crypto.md5(JSON.stringify(v.type)), id: v.id }));
            default:
                return undefined;
        }
    }

    /**
     * 获取所有是 [有编码ID] 或子项是 [有编码ID] 的Schema
     * 注意：不会去循环遍历引用
     * @param schemas 
     */
    // static getEncodeIdSchemas(schemas: TSBufferSchema | TSBufferSchema[]): {
    //     path: string,
    //     targetName: string,
    //     schema: EncodeIdSchema
    // }[] {
    //     if (!Array.isArray(schemas)) {
    //         schemas = [schemas];
    //     }

    //     let output: EncodeIdSchema[] = [];

    //     for (let schema of schemas) {
    //         switch (schema.type) {
    //             case 'Enum':
    //                 output.push(schema);
    //                 break;
    //             case 'Interface':
    //                 output.push(schema);
    //                 output
    //                 break;
    //             case 'Intersection':
    //             case 'Union':
    //                 output.push(schema);
    //                 break;
    //         }
    //     }

    //     return output;
    // }
}

export interface EncodeIdItem {
    key: string,
    id: number
}

export type EncodeIdSchema = EnumTypeSchema | InterfaceTypeSchema | IntersectionTypeSchema | UnionTypeSchema;