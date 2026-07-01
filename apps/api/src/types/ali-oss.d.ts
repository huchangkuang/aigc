declare module 'ali-oss' {
  export default class OSS {
    constructor(options: Record<string, unknown>);
    put(name: string, file: Buffer, options?: Record<string, unknown>): Promise<unknown>;
    delete(name: string, options?: Record<string, unknown>): Promise<unknown>;
    signatureUrl(name: string, options?: { expires?: number }): string;
  }
}
