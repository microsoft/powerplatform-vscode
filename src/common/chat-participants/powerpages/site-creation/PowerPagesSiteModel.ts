/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export type PowerPagesParsedJson = {
    powerpagecomponent: any[];
    powerpagesite: any[];
    powerpagesitelanguage: any[];
};

export interface IURLParams {
    entityName?: string;
    entityId?: string;
    query?: string;
    apiVersion?: string;
    additionalPathTokens?: string[];
  }
