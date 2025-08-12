/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export interface IServerApiTelemetryContext {
    tenantId?: string;
    envId?: string;
    userId?: string;
    orgId?: string;
    geo?: string;
    extType?: 'desktop' | 'web';
}

let _serverApiTelemetryContext: IServerApiTelemetryContext | undefined;

export function setServerApiTelemetryContext(ctx?: IServerApiTelemetryContext) {
    _serverApiTelemetryContext = ctx;
}

export function getServerApiTelemetryContext(): IServerApiTelemetryContext | undefined {
    return _serverApiTelemetryContext;
}
