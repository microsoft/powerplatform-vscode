/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ITokenProvider, ITokenResponse } from "@fluidframework/azure-client";

module.exports = class DataverseTokenProvider implements ITokenProvider {
    private cachedAccessToken: string;

    private readonly fetchAccessToken: () => Promise<string>;

    public constructor(
        accessToken: string,
        fetchAccessToken: () => Promise<string>
    ) {
        this.cachedAccessToken = accessToken;
        this.fetchAccessToken = fetchAccessToken;
    }

    public async fetchOrdererToken(
        tenantId: string,
        documentId?: string,
        refresh?: boolean
    ): Promise<ITokenResponse> {
        if (refresh) {
            this.cachedAccessToken = await this.fetchAccessToken();
        }
        return {
            jwt: this.cachedAccessToken,
        };
    }

    public async fetchStorageToken(
        tenantId: string,
        documentId: string,
        refresh?: boolean
    ): Promise<ITokenResponse> {
        if (refresh) {
            this.cachedAccessToken = await this.fetchAccessToken();
        }
        return {
            jwt: this.cachedAccessToken,
        };
    }
};
