/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export interface IUserData {
    containerId: string;
    userName: string;
    userId: string;
}

export class UserData implements IUserData {
    _containerId: string;
    _userName: string;
    _userId: string;
    _entityId: string[];

    // Getters
    public get containerId(): string {
        return this._containerId;
    }
    public get userName(): string {
        return this._userName;
    }
    public get userId(): string {
        return this._userId;
    }
    public get entityId(): string[] {
        return this._entityId;
    }

    constructor(
        containerId: string,
        userName: string,
        userId: string,
        entityId: string[]
    ) {
        this._containerId = containerId;
        this._userName = userName;
        this._userId = userId;
        this._entityId = entityId;
    }
}

export class UserDataMap {
    private usersMap: Map<string, UserData> = new Map<string, UserData>();

    public get getUserMap(): Map<string, UserData> {
        return this.usersMap;
    }

    public setUserData(
        containerId: string,
        userName: string,
        userId: string,
        entityId: string[]
    ) {
        const userData = new UserData(
            containerId,
            userName,
            userId,
            entityId
        );

        this.usersMap.set(userId, userData);
    }

    public removeUser(userId: string) {
        this.usersMap.delete(userId);
    }
}
