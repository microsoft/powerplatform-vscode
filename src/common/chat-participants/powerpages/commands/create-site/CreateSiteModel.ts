/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

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
