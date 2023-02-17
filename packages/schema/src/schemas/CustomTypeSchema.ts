/**
 * Custom type, used for custom validate / encode / decode methods.
 */
export interface CustomTypeSchema {
  type: 'Custom';

  /** Custom validate method */
  validate: (value: any) =>
    | {
        isSucc: true;
        errMsg?: undefined;
      }
    | {
        isSucc: false;
        errMsg: string;
      };

  /**
   * Custom encode method.
   * It is ensured that the method is called after validated successfully.
   */
  encode?: (value: any) => Uint8Array;

  /**
   * Custom decode method.
   * After decode, it would validate again.
   */
  decode?: (buf: Uint8Array) => any;

  /**
   * Custom encodeJSON method.
   * It is ensured that the method is called after validated successfully.
   */
  encodeJSON?: (value: any) => any;

  /**
   * Custom decodeJSON method.
   * After decode, it would validate again.
   */
  decodeJSON?: (json: any) => any;
}
