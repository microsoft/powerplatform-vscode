/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export class AppInsightsResource {
    public readonly instrumentationKey: string;

    constructor(
        public readonly connectionString: string,
        public readonly dataBoundary?: string
    ) {
        if (!connectionString) throw new Error('Connection string is required.');
        if (dataBoundary === '') throw new Error('dataBoundary cannot be an empty string.');

        const firstParameter = this.connectionString.split(';')[0];
        const name = firstParameter.split('=', 2)[0];
        if (name !== 'InstrumentationKey') throw new Error('Connection string must start with InstrumentationKey=...');
        this.instrumentationKey = firstParameter.split('=', 2)[1];
    }
}
