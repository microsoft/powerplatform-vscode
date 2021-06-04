/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { URL } from 'url';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const lineByLine = require('n-readlines');

export function getEditedLineContent(rowIndex: number, fileUrl: URL): string {
    const liner = new lineByLine(fileUrl);
    let line = liner.next();
    let lineNumber = 0;
    let userEditedLine = '';

    while (line) {
        if (lineNumber == rowIndex) {
            userEditedLine = line.toString('ascii');
            break;
        }
        line = liner.next();
        lineNumber++;
    }
    return userEditedLine;
}
