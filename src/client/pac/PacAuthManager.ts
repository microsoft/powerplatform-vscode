/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { AuthInfo } from "./PacTypes";



class PacAuthManager {
    private static instance: PacAuthManager;
    private authInfo: AuthInfo | null = null;

    public static getInstance(): PacAuthManager {
        if (!PacAuthManager.instance) {
            PacAuthManager.instance = new PacAuthManager();
        }
        return PacAuthManager.instance;
    }

    public setAuthInfo(authInfo: AuthInfo): void {
        this.authInfo = authInfo;
    }

    public getAuthInfo(): AuthInfo | null {
        return this.authInfo;
    }
}

export const authManager = PacAuthManager.getInstance();
