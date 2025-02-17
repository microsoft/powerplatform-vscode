/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { EventEmitter, Event } from "vscode";
import { AuthInfo, OrgInfo } from "./PacTypes";

interface IPacContext {
    AuthInfo: AuthInfo | null;
    OrgInfo: OrgInfo | null;
}

class PacContext implements IPacContext {
    private readonly _onChanged: EventEmitter<IPacContext> = new EventEmitter<IPacContext>();
    public readonly onChanged: Event<IPacContext> = this._onChanged.event;
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

    public dispose() {
        this._onChanged.dispose();
    }

    public setContext(authInfo: AuthInfo | null = null, orgInfo: OrgInfo | null = null): void {
        let shouldFireEvent = false;
        if (authInfo) {
            this._authInfo = authInfo;
            shouldFireEvent = true;
        }

        if (orgInfo) {
            this._orgInfo = orgInfo;
            shouldFireEvent = true;
        }

        if (shouldFireEvent) {
            this._onChanged.fire(this);
        }
    }
}

export default new PacContext();
