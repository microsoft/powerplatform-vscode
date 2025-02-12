/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { EventEmitter, Event } from "vscode";
import { AuthInfo, OrgInfo } from "./PacTypes";

const _onPacContextChanged: EventEmitter<IPacContext> = new EventEmitter<IPacContext>();
export const OnPacContextChanged: Event<IPacContext> = _onPacContextChanged.event;

interface IPacContext {
    AuthInfo: AuthInfo | null;
    OrgInfo: OrgInfo | null;
}

class PacContext implements IPacContext {
    private _authInfo: AuthInfo | null;
    private _orgInfo: OrgInfo | null;

    public get AuthInfo(): AuthInfo | null {
        return this._authInfo;
    }

    public get OrgInfo(): OrgInfo | null {
        return this._orgInfo;
    }

    constructor() {
        this._authInfo = null;
        this._orgInfo = null;
    }


    public setContext(authInfo: AuthInfo | null = null, orgInfo: OrgInfo | null = null): void {
        if (authInfo){
            this._authInfo = authInfo;
        }

        if (orgInfo){
            this._orgInfo = orgInfo;
        }

        _onPacContextChanged.fire(this);
    }
}

export default new PacContext();
