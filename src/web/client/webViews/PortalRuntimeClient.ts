/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface RuntimeParameters {
    instanceUrl: string;
    bearerToken: string;
}

export class PortalRuntimeClient {
    private runtimeParameters: RuntimeParameters;
    private portalRuntimeClientStore: { [key: string]: AxiosInstance } = {};

    constructor(runtimeParams: RuntimeParameters) {
        this.runtimeParameters = runtimeParams;
        this.initializeAxiosInstance();
    }

    private initializeAxiosInstance(): void {
        const { instanceUrl, bearerToken } = this.runtimeParameters;

        if (!this.portalRuntimeClientStore[instanceUrl]) {
            const axiosInstance = axios.create({
                baseURL: instanceUrl,
                withCredentials: true,
            });

            axiosInstance.interceptors.request.use((config: AxiosRequestConfig) => {
                if (config.headers) {
                    config.headers.Authorization = `Bearer ${bearerToken}`;
                    return config;
                } else {
                    throw new Error('Request headers are not present.');
                }
            });

            this.portalRuntimeClientStore[instanceUrl] = axiosInstance;
        }
    }

    public async fetchAndApplyContent(url: string): Promise<string> {
        try {
            const portalRuntimeClient: AxiosInstance = this.getPortalRuntimeClient();

            const response = await portalRuntimeClient.get(url);

            return response.data.toString();
        } catch (error) {
            console.error('Failed to fetch and apply content:', error);
            throw error;
        }
    }

    private getPortalRuntimeClient(): AxiosInstance {
        const { instanceUrl } = this.runtimeParameters;
        if (!this.portalRuntimeClientStore[instanceUrl]) {
            throw new Error('Axios instance not initialized correctly.');
        }
        return this.portalRuntimeClientStore[instanceUrl];
    }
}
