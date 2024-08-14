/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


export const EXTENSION_ID = "microsoft-IsvExpTools.powerplatform-vscode";

/**
 * Name of the extension as defined in package.name.
 */
export const EXTENSION_NAME = "powerplatform-vscode";

/**
 * Name of the configuration section used to store experimental user configuration.
 */
export const SETTINGS_EXPERIMENTAL_STORE_NAME = "powerPlatform.experimental";

/**
 * Default port used to connect vscode to the browsers debug endpoint.
 */
export const SETTINGS_DEBUGGER_DEFAULT_PORT = 9222;

/**
 * Default value for the `powerPlatform.experimental.enablePcfDebuggingFeatures` flag.
 */
export const DEBUGGER_ENABLED_DEFAULT_VALUE = false;

/**
 * Name of the powerpages generator
 */
export const PORTAL_YEOMAN_GENERATOR_PACKAGE_NAME = "@microsoft/generator-powerpages";

/**
 * Name of the powerpages generator tarball
 */
export const PORTAL_YEOMAN_GENERATOR_PACKAGE_TARBALL_NAME = "microsoft-generator-powerpages";


export const SUCCESS = "Success";

// Define the schema for file extensions
export const componentTypeSchema: { [key: string]: { [key: string]: string } } = {
    'adx_webpage': {
        'html': '.copy.html',
        'js': '.custom_javascript.js',
        'css': '.custom_css.css'
    }
};

// Define the schema
export const relatedFilesSchema: { [key: string]: { [key: string]: string[] } } = {
    'adx_webpage': {
        'html': ['js', 'css'],
        'js': ['html', 'css'],
        'css': ['html', 'js']
    }
};

// Interface for related files
export interface IRelatedFiles {
    fileType: string;
    fileContent: string;
    fileName: string;
}

export const COPILOT_RELATED_FILES_FETCH_FAILED = "CopilotRelatedFilesFetchFailed";
