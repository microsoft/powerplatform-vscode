/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { EventEmitter, Event } from "vscode";
import { AuthInfo } from "./PacTypes";

class AuthManager {
    private static instance: AuthManager;
    private authInfo: AuthInfo | null = null;
    private _onDidChangeEnvironment: EventEmitter<void> = new EventEmitter<void>();
    public readonly onDidChangeEnvironment: Event<void> = this._onDidChangeEnvironment.event;

    public static getInstance(): AuthManager {
        if (!AuthManager.instance) {
            AuthManager.instance = new AuthManager();
        }
        return AuthManager.instance;
    }

    public setAuthInfo(authInfo: AuthInfo): void {
        this.authInfo = authInfo;
        this._onDidChangeEnvironment.fire();
    }

    public getAuthInfo(): AuthInfo | null {
        return this.authInfo;
    }
}

export const pacAuthManager = PacAuthManager.getInstance();
