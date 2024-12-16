/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ITelemetry } from "../../../../OneDSLoggerTelemetry/telemetry/ITelemetry";
import * as vscode from 'vscode';
import { IIntelligenceAPIEndpointInformation } from "../../../../services/Interfaces";
import { EditableFileSystemProvider } from "../../../../utilities/EditableFileSystemProvider";
import { IEnvInfo } from "../../../../constants";

export interface PowerPagesParsedJson {
    powerpagesite: PowerPagesSite[];
    powerpagecomponent: PowerPagesComponent[];
    powerpagesitelanguage: PowerPagesSiteLanguage[];
}

export interface IFileUpload {
    fileName: string;
    entityId: string;
    fileContent: string;
    entityName: string;
    columnName: string;
}
export interface IURLParams {
    entityName?: string;
    entityId?: string;
    query?: string;
    apiVersion?: string;
    additionalPathTokens?: string[];
}

export interface PowerPagesSiteEntity {
    powerpagesiteid?: string | null;
    content: string;
    name: string;
}

export interface PowerPagesSite extends PowerPagesSiteEntity {
    datamodelversion: string;
}

export interface PowerPagesSiteLanguage extends PowerPagesSiteEntity {
    powerpagesitelanguageid: string;
    displayname: string;
    languagecode: string;
    lcid: string;
}

export enum PowerPagesComponentType {
    PublishingState = '1',
    WebPage = '2',
    WebFile = '3',
    WebLinkSet = '4',
    WebLink = '5',
    PageTemplate = '6',
    ContentSnippet = '7',
    WebTemplate = '8',
    SiteSettings = '9',
    WebPageAccessControlRule = '10',
    WebRole = '11',
    WebsiteAccess = '12',
    SiteMarker = '13',
    BasicForm = '15',
    BasicFormMetadata = '16',
    List = '17',
    TablePermission = '18',
    AdvancedForm = '19',
    AdvancedFormStep = '20',
    AdvancedFormMetadata = '21',
    PollPlacement = '24',
    AdPlacement = '26',
    BotConsumer = '27',
    ColumnPermissionProfile = '28',
    ColumnPermission = '29',
    Redirect = '30',
    PublishingStateTransitionRule = '31',
    Shortcut = '32',
    PowerAutomate = '33',
}

export interface PowerPagesComponent extends PowerPagesSiteEntity {
    powerpagecomponentid: string;
    powerpagecomponenttype: PowerPagesComponentType;
    powerpagesitelanguageid?: string | null;
    filecontent?: string;
    filename?: string;
}

export interface ICreateSiteOptions {
    intelligenceAPIEndpointInfo: IIntelligenceAPIEndpointInformation;
    intelligenceApiToken: string;
    userPrompt: string;
    sessionId: string;
    stream: vscode.ChatResponseStream;
    telemetry: ITelemetry;
    orgId: string;
    envId: string;
    userId: string;
    extensionContext: vscode.ExtensionContext;
    contentProvider: EditableFileSystemProvider;
}

export interface IPreviewSitePagesContentOptions {
    // siteName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sitePages: any[];
    stream: vscode.ChatResponseStream;
    extensionContext: vscode.ExtensionContext;
    telemetry: ITelemetry;
    sessionId: string;
    orgId: string;
    envId: string;
    userId: string;
    contentProvider: EditableFileSystemProvider;
}

export interface ISiteInputState {
    siteName: string;
    envName: string;
    OrgUrl: string;
    domainName: string;
    title: string;
    step: number;
    totalSteps: number;
}

export interface ICreateSiteCommandArgs {
    siteName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sitePages: any[];
    sitePagesList: string[];
    envList: IEnvInfo[];
    contentProvider: EditableFileSystemProvider;
    telemetry: ITelemetry;
    isCreateSiteInputsReceived: boolean;
}

export type Page = PageDataDetails & {
    pageKey: string;
    pageName: string;
    pageSummary: string;
    pageType?: string;
};

export type PageDataDetails = {
    includesForm?: boolean;
    includesList?: boolean;
    suggestedColumns?: string;
};

export type Website = {
    siteName: string;
    pages: Page[];
    siteDescription?: string;
};
