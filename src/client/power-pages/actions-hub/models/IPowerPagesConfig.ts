/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * Interface for Power Pages configuration file structure
 */
export interface IPowerPagesConfig {
    compiledPath?: string;
    siteName?: string;
}

/**
 * Interface for parsed configuration data
 */
export interface IPowerPagesConfigData {
    hasCompiledPath: boolean;
    hasSiteName: boolean;
}
