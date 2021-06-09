/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

export interface ITelemetryData {
    eventName: string;
    properties?: Record<string, string>;
    measurements?: Record<string, number>;
}

export interface IAutoCompleteTelemetryData extends ITelemetryData {
    eventName: 'autoComplete';
    properties: {
        'server': 'yaml' | 'html';
        'keyForCompletion'?: string;
        'tagForCompletion'?: string;
        'success'?: 'true' | 'false';
    };
    measurements: {
        'manifestParseTimeMs'?: number;
        'liquidParseTimeMs'?: number;
        'countOfAutoCompleteResults'?: number;
    };
}
