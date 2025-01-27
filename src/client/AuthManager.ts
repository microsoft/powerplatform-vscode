/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { AuthInfo } from "./power-pages/actions-hub/Constants";

class AuthManager {
    private static instance: AuthManager;
    private authInfo: AuthInfo | null = null;

    public static getInstance(): AuthManager {
        if (!AuthManager.instance) {
            AuthManager.instance = new AuthManager();
        }
        return AuthManager.instance;
    }

    public setAuthInfo(authInfo: AuthInfo): void {
        this.authInfo = authInfo;
    }

    public getAuthInfo(): AuthInfo | null {
        return this.authInfo;
    }
}

export const authManager = AuthManager.getInstance();
