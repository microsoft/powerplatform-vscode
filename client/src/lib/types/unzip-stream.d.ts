declare module "unzip-stream" {
    export interface ExtractOptions {
        path: string;
    }
    export function Extract(opts?: ExtractOptions): NodeJS.WritableStream;
}
