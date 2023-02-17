/**
 * 这是我的第一条测试协议
 * @method POST
 * @url a/b/c/Name
 */
export interface ReqPtlName extends BaseRequest {
    /**
     * Field A
     */
    a: number;
    /** Field B */
    b: {
        /**
         * Field B.B1
         */
        b1: string
    }
    /**
     * Array of CCC
     */
    c: CCC[],

    d: DDD,
    e: EEE
}

export interface BaseRequest {
    /** SSO Token */
    sso?: string;
}

/**
 * a good CCC
 */
export interface CCC {
    /** valueC ahahaha */
    valueC: string;
}

/** 这样的情况 */
type DDD =
    /** 情况 A */
    { type: 'A', valueA: string } |
    /** 情况 B */
    { type: 'B', valueB: number } |
    /** 其它情况 */
    string[];

/** EE哈哈哈哈 */
type EEE = 'AAA' | 'BBB' | 'CCC';

/**
 * 这应该是可见的注释
 * AAA
 * BBB
 * CCC
 */
export type ReqUsingType = {}