/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const EDITABLE_SCHEME = 'editable';
export const ENGLISH = "English";
export const MIN_PAGES = 7;
export const MAX_PAGES = 7;
export const SITE_CREATE_INPUTS = 'New Power Pages Site';
export const ENVIRONMENT_FOR_SITE_CREATION = 'Select Environment for Site Creation';
export const SITE_NAME = 'Enter Site Name';
export const SITE_NAME_REQUIRED = 'Site Name is required';
export const CREATE_SITE_BTN_CMD = 'create-site-inputs';
export const CREATE_SITE_BTN_TITLE = 'Create Site';
export const CREATE_SITE_BTN_TOOLTIP = 'Create a new Power Pages site';

export enum PresetThemeIds {
    ORANGE = '329a43fa-5471-4678-8330-d3a0b404e9bb',
    TURQUOISE = '215708aa-2dcb-4ec1-829b-7121994ebcc3',
    BRIGHT_BLUE = '0f6ab1e0-f1d6-45a7-92d5-e07bd7bb9b6b',
    TEAL = '3e4815d4-03da-4fb4-9714-a4fe61caaba6',
    MOSS = '9fbe5118-b883-48b5-81d6-09a78fedb035',
    NEUTRAL = '146d2355-1494-404c-8ddf-a3d1a23ad57d',
    BLUE = 'df88c9ca-e24f-4eca-af9a-880e7b8559a0',
    RED_ORANGE = '0e87b0cb-83a0-4d04-8843-aa97796c4d87',
    RED = '763110f9-ad1d-4683-aa48-13d888fc5428',
    PURPLE = 'e4b7a39b-a92e-4755-9507-c5383356fb2c',
    GREEN = '2b52b31c-c600-4eb3-99c9-8ec01c2ac85e',
    GREY = 'f21551a1-7244-432f-ad88-220609e070d3',
    DARK_BLUE = '656c3ab7-eba6-4496-8de6-2e8c22310f98',
    DARK_YELLOW = '4fce2c5f-d5fc-4e47-8f0b-77be5bd05cce',
}

export const BASE_PAGE = {
    enablerating: false,
    enabletracking: false,
    excludefromsearch: false,
    hiddenfromsitemap: false,
    sharedpageconfiguration: false,
};

export const CDS_BASE_URL = 'https://org06ff0f46.crm10.dynamics.com'; // This is a placeholder URL
export const CDS_URL_PREFIX = '/api/data';
export const CDS_API_BASE_URL = `${CDS_BASE_URL}${CDS_URL_PREFIX}`;
export const CDS_API_VERSION = 'v9.2';
export const CDS_API_VERSION_9_2 = `${CDS_API_BASE_URL}/${CDS_API_VERSION}`;
