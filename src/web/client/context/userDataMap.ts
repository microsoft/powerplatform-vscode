/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export interface IUserData {
    containerId: string;
    fileName: string;
    filePath: string;
    userName: string;
    userId: string;
}

export class UserData implements IUserData {
    _containerId: string;
    _fileName: string;
    _filePath: string;
    _userName: string;
    _userId: string;

    // Getters
    public get containerId(): string {
        return this._containerId;
    }
    public get fileName(): string {
        return this._fileName;
    }
    public get filePath(): string {
        return this._filePath;
    }
    public get userName(): string {
        return this._userName;
    }
    public get userId(): string {
        return this._userId;
    }

    constructor(
        containerId: string,
        fileName: string,
        filePath: string,
        userName: string,
        userId: string
    ) {
        this._fileName = fileName;
        this._containerId = containerId;
        this._filePath = filePath;
        this._userName = userName;
        this._userId = userId;
    }
}

export class UserDataMap {
    private usersMap: Map<string, UserData> = new Map<string, UserData>();

    public get getUserMap(): Map<string, UserData> {
        return this.usersMap;
    }

    public setUserData(
        containerId: string,
        fileName: string,
        filePath: string,
        userName: string,
        userId: string
    ) {
        const userData = new UserData(
            containerId,
            fileName,
            filePath,
            userName,
            userId
        );

        this.usersMap.set(userId, userData);
    }

    public removeUser(userId: string) {
        this.usersMap.delete(userId);
    }
}
