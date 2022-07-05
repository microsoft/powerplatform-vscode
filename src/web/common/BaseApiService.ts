/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable @typescript-eslint/no-explicit-any */

import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    AxiosError
} from 'axios';

export type ApiServiceResponse<T = any> = AxiosResponse<T>;
export type ApiServiceRequestConfig = AxiosRequestConfig;
export type ApiServiceError<T = any> = AxiosError<T>;

export function isApiServiceError(e: any): e is ApiServiceError {
    return e.isAxiosError;
}

export interface BaseApiServiceInterceptorsPare<V> {
    onFulfilled?: (value: V) => V | Promise<V>,
    onRejection?: (error: any) => any
}

export interface BaseApiServiceInterceptors {
    request?: BaseApiServiceInterceptorsPare<ApiServiceRequestConfig>,
    response?: BaseApiServiceInterceptorsPare<ApiServiceResponse>
}


export class BaseApiService {
    private axios: AxiosInstance;

    constructor(serviceBaseUrl: string, interceptors?: BaseApiServiceInterceptors) {
        this.axios = axios.create({
            baseURL: serviceBaseUrl
        });

        if (interceptors) {
            if (interceptors.request) {
                this.axios.interceptors.request
                    .use(interceptors.request.onFulfilled, interceptors.request.onRejection);
            }

            if (interceptors.response) {
                this.axios.interceptors.response
                    .use(interceptors.response.onFulfilled, interceptors.response.onRejection);
            }
        }
    }

    protected get<T, R = ApiServiceResponse<T>>(url: string, config?: ApiServiceRequestConfig): Promise<R> {
        return this.axios.get<T, R>(url, config);
    }

    protected delete<T, R = ApiServiceResponse<T>>(url: string, config?: ApiServiceRequestConfig): Promise<R> {
        return this.axios.delete<T, R>(url, config);
    }

    protected head<T, R = ApiServiceResponse<T>>(url: string, config?: ApiServiceRequestConfig): Promise<R> {
        return this.axios.head<T, R>(url, config);
    }

    protected options<T, R = ApiServiceResponse<T>>(url: string, config?: ApiServiceRequestConfig): Promise<R> {
        return this.axios.options<T, R>(url, config);
    }

    protected post<T, R = ApiServiceResponse<T>>(url: string, data?: unknown, config?: ApiServiceRequestConfig)
        : Promise<R> {
        return this.axios.post<T, R>(url, data, config);
    }

    protected put<T, R = ApiServiceResponse<T>>(url: string, data?: unknown, config?: ApiServiceRequestConfig)
        : Promise<R> {
        return this.axios.put<T, R>(url, data, config);
    }

    protected patch<T, R = ApiServiceResponse<T>>(url: string, data?: unknown, config?: ApiServiceRequestConfig)
        : Promise<R> {
        return this.axios.patch<T, R>(url, data, config);
    }
}
