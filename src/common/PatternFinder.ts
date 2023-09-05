/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import {
    WorkspaceFolder
} from 'vscode-languageserver/node';
import { URL } from 'url';
import * as path from 'path';
import * as fs from 'fs';
import { glob } from 'glob';

export function workspaceContainsPattern(pattern: string, workspaceRootFolders: WorkspaceFolder[] | null): boolean {
    return workspaceRootFolders?.some(workspaceRootFolder => {
        return glob.sync(pattern, { cwd: workspaceRootFolder.uri }).length
    }) || false
}
