/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { BulkheadRejectedError, bulkhead, retry, handleWhen, ExponentialBackoff, wrap } from 'cockatiel';
import fetch, { RequestInfo, RequestInit } from "node-fetch";
import {
    MAX_CONCURRENT_REQUEST_COUNT,
    MAX_CONCURRENT_REQUEST_QUEUE_COUNT,
    RETRY_MAX_ATTEMPTS,
    RETRY_INITIAL_DELAY_MS,
    RETRY_MAX_DELAY_MS
} from '../common/constants';
import WebExtensionContext from "../WebExtensionContext";
import { webExtensionTelemetryEventNames } from '../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents';
import { ERROR_CONSTANTS } from '../../../common/ErrorConstants';

export class ConcurrencyHandler {
    private _bulkhead = bulkhead(MAX_CONCURRENT_REQUEST_COUNT, MAX_CONCURRENT_REQUEST_QUEUE_COUNT);

    private _retryPolicy = retry(
        handleWhen((err) => !(err instanceof BulkheadRejectedError)),
        {
            maxAttempts: RETRY_MAX_ATTEMPTS,
            backoff: new ExponentialBackoff({
                initialDelay: RETRY_INITIAL_DELAY_MS,
                maxDelay: RETRY_MAX_DELAY_MS
            })
        }
    );

    private _wrappedPolicy = wrap(this._retryPolicy, this._bulkhead);

    public async handleRequest(
        requestInfo: RequestInfo,
        requestInit?: RequestInit,
        onUnauthorized?: () => Promise<string>
    ) {
        let retryCount = 0;

        try {
            return await this._wrappedPolicy.execute(async (context) => {
                if (context.attempt > 0) {
                    retryCount = context.attempt;
                    WebExtensionContext.telemetry.sendInfoTelemetry(
                        webExtensionTelemetryEventNames.WEB_EXTENSION_REQUEST_RETRY,
                        {
                            attempt: context.attempt.toString(),
                            url: typeof requestInfo === 'string' ? requestInfo : String(requestInfo)
                        }
                    );
                }

                let response = await fetch(requestInfo, requestInit);

                // node-fetch resolves (does not throw) on HTTP 401, so the retry
                // policy above never sees it. Handle token-expiry here: refresh the
                // token once, rebuild only the Authorization header, and re-issue the
                // request a single time. Fail-fast (return the 401) if the refresh
                // yields no token or the retried request still 401s — no refresh loop.
                if (response.status === 401 && onUnauthorized) {
                    const newToken = await onUnauthorized();
                    if (newToken) {
                        WebExtensionContext.telemetry.sendInfoTelemetry(
                            webExtensionTelemetryEventNames.WEB_EXTENSION_TOKEN_REFRESH_RETRY,
                            {
                                url: typeof requestInfo === 'string' ? requestInfo : String(requestInfo)
                            }
                        );
                        const headers = {
                            ...(requestInit?.headers as Record<string, string>),
                            authorization: "Bearer " + newToken,
                        };
                        response = await fetch(requestInfo, { ...requestInit, headers });
                    }
                }

                return response;
            });
        } catch (e) {
            if (e instanceof BulkheadRejectedError) {
                // Pass an Error object so sendErrorTelemetry actually persists
                // executionSlots/retryCount into the event payload — without it,
                // the telemetry layer drops the message string entirely and the
                // event lands in Kusto with only {eventName, methodName}.
                const msg = `executionSlots: ${this._bulkhead.executionSlots}, retryCount: ${retryCount}`;
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_BULKHEAD_QUEUE_FULL,
                    this.handleRequest.name,
                    msg,
                    new Error(msg)
                );
                throw new Error(ERROR_CONSTANTS.BULKHEAD_LIMITS_EXCEEDED);
            } else {
                throw e;
            }
        }
    }
}
