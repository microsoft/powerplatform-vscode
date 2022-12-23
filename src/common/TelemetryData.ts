/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

 /**
  * This type is used in the contract of telemetry/event notifications sent from language servers to the language clients.
 */
export interface ITelemetryData {
    eventName: string;
    properties?: Record<string, string>;
    measurements?: Record<string, number>;
}

export interface IAutoCompleteTelemetryData extends ITelemetryData {
    eventName: 'AutoComplete';
    properties: {
        'server': 'yaml' | 'html';
        'keyForCompletion'?: string;
        'tagForCompletion'?: string;
        'success'?: 'true' | 'false';
    };
    measurements: {
        'manifestParseTimeMs'?: number;
        'liquidAutoCompleteTimeMs'?: number;
        'countOfAutoCompleteResults'?: number;
    };
}
