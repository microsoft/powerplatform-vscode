/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { IAttributePath } from "../utilities/schemaHelperUtil";
import { FileData } from "./fileData";

export interface IUserData {
    lineNumber: number;
    columnNumber: number;
    containerId: string;
    fileName: string;
    filePath: string;
    userName: string;
}

export class UserData implements IUserData {
    _lineNumber: number;
    _columnNumber: number;
    _containerId: string;
    _fileName: string;
    _filePath: string;
    _userName: string;

    // Getters
    public get lineNumber(): number {
        return this._lineNumber;
    }
    public get columnNumber(): number {
        return this._columnNumber;
    }
    public get containerId(): string {
        return this._containerId;
    }
    public get fileName(): string {
        return this.fileName;
    }
    public get filePath(): string {
        return this.filePath;
    }
    public get userName(): string {
        return this._userName;
    }

    constructor(
        lineNumber: number,
        columnNumber: number,
        containerId: string,
        fileName: string,
        filePath: string,
        userName: string
    ) {
        this._containerId = containerId;
        this._lineNumber = lineNumber;
        this._fileName = fileName;
        this._columnNumber = columnNumber;
        this._filePath = filePath;
        this._userName = userName;
    }
}

export class UserDataMap {
    private usersMap: Map<string, UserData> = new Map<string, UserData>();

    public get getUserMap(): Map<string, UserData> {
        return this.usersMap;
    }

    public setUserData(
        lineNumber: number,
        columnNumber: number,
        containerId: string,
        fileName: string,
        filePath: string,
        userName: string
    ) {
        const userData = new UserData(
            lineNumber,
            columnNumber,
            containerId,
            fileName,
            filePath,
            userName
        );

        this.usersMap.set(userName, userData);
    }

    // public updateDirtyChanges(fileFsPath: string, dirtyFlagValue: boolean) {
    //     const existingEntity = this.fileMap.get(fileFsPath);

    //     if (existingEntity) {
    //         existingEntity.setHasDirtyChanges = dirtyFlagValue;
    //         return;
    //     }
    //     throw Error("File does not exist in the map"); // TODO - Revisit errors and dialog experience here
    // }
}
