/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export interface IUserData {
    containerId: string;
    userName: string;
    userId: string;
}

export interface IConnectionData {
    connectionId: string;
    entityId: string;
}

export class UserData implements IUserData {
    _containerId: string;
    _userName: string;
    _userId: string;
    _connectionData: IConnectionData[];

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
    public get connectionData(): IConnectionData[] {
        return this._connectionData;
    }

    // Setters
    public setConnectionData(connectionData: IConnectionData[]): void {
        this._connectionData = connectionData;
    }

    constructor(
        containerId: string,
        userName: string,
        userId: string,
        connectionData: IConnectionData[]
    ) {
        this._containerId = containerId;
        this._userName = userName;
        this._userId = userId;
        this._connectionData = connectionData;
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
        connectionData: IConnectionData[]
    ) {
        const userData = new UserData(
            containerId,
            userName,
            userId,
            connectionData
        );

        this.usersMap.set(userId, userData);
    }

    public removeUser(userId: string, removeConnectionData: IConnectionData) {
        const connectionData = this.usersMap.get(userId)?.connectionData ?? [];

        // Remove the connection data from the user's connection data
        const newConnectionData = connectionData.filter(connection => {
            return !(connection.connectionId === removeConnectionData.connectionId && connection.entityId[0] === removeConnectionData.entityId);
        });

        const userData = this.usersMap.get(userId) as UserData;
        userData.setConnectionData(newConnectionData);

        // If the user has no more connection data, remove the user from the map
        if (newConnectionData.length === 0) {
            this.usersMap.delete(userId);
        } else {
            this.usersMap.set(userId, userData);
        }
    }
}
