/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { BulkheadRejectedError, bulkhead } from 'cockatiel';
import fetch, { RequestInfo, RequestInit } from "node-fetch";
import { MAX_CONCURRENT_REQUEST_COUNT, MAX_CONCURRENT_REQUEST_QUEUE_COUNT } from '../common/constants';
import WebExtensionContext from "../WebExtensionContext";
import { telemetryEventNames } from '../telemetry/constants';
import { ERRORS } from '../../../common/ErrorConstants';

export class ConcurrencyHandler {
    private _bulkhead = bulkhead(MAX_CONCURRENT_REQUEST_COUNT, MAX_CONCURRENT_REQUEST_QUEUE_COUNT);

    public async handleRequest(requestInfo: RequestInfo, requestInit?: RequestInit) {
        try {
            return await this._bulkhead.execute(() => fetch(
                requestInfo,
                requestInit
            ));
        } catch (e) {
            if (e instanceof BulkheadRejectedError) {
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    telemetryEventNames.WEB_EXTENSION_BULKHEAD_QUEUE_FULL,
                    this.handleRequest.name,
                    this._bulkhead.executionSlots.toString(),
                );
                throw new Error(ERRORS.SUBURI_EMPTY);
            } else {
                throw e;
            }
        }
    }
}
