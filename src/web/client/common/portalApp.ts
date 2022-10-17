/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { PowerPlatformApp } from "./powerPlatformApp";

export class Portal extends PowerPlatformApp{
    constructor(){
        super('portal');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public checkMandatoryParameters(args: any[]): boolean {
        if (args) {
            return true;
        }
        else return false;
    }
    public launch(): void {
        return;
    }
}
