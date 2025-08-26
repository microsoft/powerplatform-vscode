/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import path from "path";
import os from "os";


export const getDefaultCodeQLDatabasePath = (): string => {
    // Use a temporary directory for the CodeQL database
    const tempDir = os.tmpdir();
    const dbName = `codeql-database-${Date.now()}`;
    return path.join(tempDir, dbName);
};

