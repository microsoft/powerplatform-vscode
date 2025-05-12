/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { IActiveFileParams } from "./copilot/model";


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

export const TRUE = "True";

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
export interface UserPrompt {
    displayText: string;
    code: string;
}
export interface IApiRequestParams {
    userPrompt: UserPrompt[];
    activeFileParams: IActiveFileParams;
    orgID: string;
    apiToken: string;
    sessionID: string;
    entityName: string;
    entityColumns: string[];
    aibEndpoint: string | null;
    geoName: string | null;
    crossGeoDataMovementEnabledPPACFlag?: boolean;
    relatedFiles?: IRelatedFiles[];
}

export interface IEnvInfo {
    orgUrl: string;
    envDisplayName: string;
}

export const VSCODE_EXTENSION_COPILOT_CONTEXT_RELATED_FILES_FETCH_FAILED = "VSCodeExtensionCopilotContextRelatedFilesFetchFailed";
export const ADX_WEBPAGE = 'adx_webpage'
export const HTML_FILE_EXTENSION = '.html';
export const UTF8_ENCODING = 'utf8';
export const EDGE_TOOLS_EXTENSION_ID = 'ms-edgedevtools.vscode-edge-devtools';
export const ADX_WEBSITE_RECORDS_API_PATH = 'api/data/v9.2/adx_websites?$select=*&$expand=owninguser($select=systemuserid,fullname)';
export const POWERPAGES_SITE_RECORDS_API_PATH = 'api/data/v9.2/powerpagesites?$select=*&$expand=owninguser($select=systemuserid,fullname)';
export const POWERPAGES_SITE_SETTINGS_API_PATH = 'api/data/v9.2/mspp_sitesettings';
export const APP_MODULES_PATH = 'api/data/v9.2/appmodules';
export const ADX_WEBSITE_RECORDS_FETCH_FAILED = 'AdxWebsiteRecordsFetchFailed';
export const POWERPAGES_SITE_RECORDS_FETCH_FAILED = 'PowerPagesSiteRecordsFetchFailed';
export const POWERPAGES_SITE_SETTINGS_FETCH_FAILED = 'PowerPagesSiteSettingsFetchFailed';
export const CODE_SITE_SETTING_NAME = 'CodeSite/Enabled';
export const APP_MODULES_FETCH_FAILED = 'AppModulesFetchFailed';
export const GET_ALL_WEBSITES_FAILED = 'GetAllWebsitesFailed';
export const WEBSITE_YML = 'website.yml';
export const POWERPAGES_SITE_FOLDER = ".powerpages-site";
