/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export abstract class PowerPlatformApp {
    private appName: string;
    constructor (appName: string) {
        this.appName = appName;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public abstract checkMandatoryParameters(args: any[]): boolean;
    public abstract launch(): void;
}
