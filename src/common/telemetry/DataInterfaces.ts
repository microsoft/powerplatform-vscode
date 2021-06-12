/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

export interface ITelemetryEvent {
    name: string;
    properties?: Record<string, string>;
    measurements?: Record<string, number>;
}

export interface ITelemetryErrorEvent {
    name: string;
    properties?: Record<string, string>;
    measurements?: Record<string, number>;
    errorProps?: string[];
}

export interface ITelemetryExceptionData {
    error: Error;
    properties?: Record<string, string>;
    measurements?: Record<string, number>;
}


// ** These next interfaces are our strong-typed events that should be utilized in order to ensure consistent schema when used in multiple places in the codebase **

export interface IAutoCompleteEvent extends ITelemetryEvent {
    name: 'AutoComplete';
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

export interface IStartCommandEvent extends ITelemetryEvent {
    name: 'StartCommand';
    properties: {
        'commandId': string;
    };
}
