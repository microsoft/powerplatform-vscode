/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { AppInsightsResource } from "./AppInsightsResource";

export class AppInsightsResourceProvider {
    readonly _allResources: Map<string, AppInsightsResource>;

    constructor(private defaultResource: AppInsightsResource, ...additionalResources: AppInsightsResource[]) {
        this._allResources = new Map<string, AppInsightsResource>();
        additionalResources.forEach(r => {
            if (!r.dataBoundary) throw new Error('One or more of the additionalResources are missing a value for the dataBoundary.');
            this._allResources.set(r.dataBoundary, r);
        });
        if (defaultResource.dataBoundary && !this._allResources.has(defaultResource.dataBoundary)) {
            this._allResources.set(defaultResource.dataBoundary, defaultResource);
        }
    }

    public GetAppInsightsResourceForDataBoundary(dataBoundary?: string): AppInsightsResource {
        if (dataBoundary) {
            const match = this._allResources.get(dataBoundary);
            if (match) {
                return match;
            }
        }
        return this.defaultResource;
    }
}
