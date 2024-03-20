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
    responseStatus?: string,
    codeLineCount?: string,
    geoName?: string,
    aibEndpoint?: string,
    orgUrl?: string,
    tokenSize?: string
    isSuggestedPrompt?: string;
    subScenario?: string;
}
