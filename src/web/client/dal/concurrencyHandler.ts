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

    public async handleRequest(requestInfo: RequestInfo, requestInit?: RequestInit) {
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
                return fetch(requestInfo, requestInit);
            });
        } catch (e) {
            if (e instanceof BulkheadRejectedError) {
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_BULKHEAD_QUEUE_FULL,
                    this.handleRequest.name,
                    `executionSlots: ${this._bulkhead.executionSlots}, retryCount: ${retryCount}`,
                );
                throw new Error(ERROR_CONSTANTS.BULKHEAD_LIMITS_EXCEEDED);
            } else {
                throw e;
            }
        }
    }
}
