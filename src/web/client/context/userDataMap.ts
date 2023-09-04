/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { UserData } from "./userData";

export class UserDataMap {
    private usersMap: Map<string, UserData> = new Map<string, UserData>();

    public get getUserMap(): Map<string, UserData> {
        return this.usersMap;
    }

    public setUserData(
        cId: string,
        fName: string,
        fPath: string,
        uName: string,
        uId: string
    ) {
        const userData = new UserData(
            cId,
            fName,
            fPath,
            uName,
            uId
        );

        this.usersMap.set(uId, userData);
    }

    public removeUser(uId: string) {
        this.usersMap.delete(uId);
    }
}
