/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { SERVER_LOGICS_FOLDER_PATTERN } from './Constants';

/**
 * Checks if a file is a server logic file based on path and extension
 * @param filePath - The file path to check
 * @returns True if the file is in a server-logics folder and has .js extension
 */
export function isServerLogicFile(filePath: string): boolean {
    return SERVER_LOGICS_FOLDER_PATTERN.test(filePath) && filePath.endsWith('.js');
}
