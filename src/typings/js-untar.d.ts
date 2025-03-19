/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

declare module 'js-untar' {
    export interface FileEntry {
      size: number;
      blob: Blob;
      name: string;
      readAsString: () => string;
    }

    function untar(buffer: ArrayBuffer): Promise<FileEntry[]>;
    export default untar;
  }
