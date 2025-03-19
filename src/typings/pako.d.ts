/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

declare module 'pako' {
    export function inflate(data: Uint8Array | ArrayBuffer): Uint8Array;
    export function deflate(data: Uint8Array | string): Uint8Array;
    export function gzip(data: Uint8Array | string, options?: any): Uint8Array;
    export function ungzip(data: Uint8Array | ArrayBuffer): Uint8Array;

    export interface DeflateOptions {
      level?: number;
      windowBits?: number;
      memLevel?: number;
      strategy?: number;
      dictionary?: any;
      raw?: boolean;
      to?: string;
    }

    export interface InflateOptions {
      windowBits?: number;
      raw?: boolean;
      to?: string;
    }
  }
