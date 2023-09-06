/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export interface IProDevCopilotTelemetryData {
    eventName: string,
    durationInMills?: number,
    exception?: Error,
    copilotSessionId: string,
    orgId?: string,
    FeedbackId?: string
    error?: Error,
    dataverseEntity?: string,
    feedbackType?: string,
    responseStatus?: number,
    codeLineCount?: number,
    geoName?: string,
    aibEndpoint?: string,
    orgUrl?: string,
}