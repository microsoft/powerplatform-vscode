/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as path from 'path';
import * as vscode from 'vscode';
import { toBase64 } from '../utility/CommonUtility';
import { getRequestURL, PathHasEntityFolderName } from '../utility/UrlBuilder';
import { CHARSET, httpMethod, ORG_URL } from './constants';
import PowerPlatformExtensionContextManager from "./localStore";
import { SaveEntityDetails } from './portalSchemaInterface';
import { getDataFromDataVerse } from './remoteFetchProvider';
import { saveData } from './remoteSaveProvider';

export class File implements vscode.FileStat {

    type: vscode.FileType;
    ctime: number;
    mtime: number;
    size: number;

    name: string;
    data: Uint8Array;

    constructor(name: string) {
        this.type = vscode.FileType.File;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
        this.name = name;
        this.data = new Uint8Array();
    }
}

export class Directory implements vscode.FileStat {

    type: vscode.FileType;
    ctime: number;
    mtime: number;
    size: number;

    name: string;
    entries: Map<string, File | Directory>;

    constructor(name: string) {
        this.type = vscode.FileType.Directory;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
        this.name = name;
        this.entries = new Map();
    }
}

export type Entry = File | Directory;

export class PortalsFS implements vscode.FileSystemProvider {

    root = new Directory('');

    // --- manage file metadata

    async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
        return await this._lookup(uri, false);
    }

    async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
        console.log("powerpagedebug readDirectory", uri.toString());
        const entry = await this._lookupAsDirectory(uri, false);

        const result: [string, vscode.FileType][] = [];
        for (const [name, child] of entry.entries) {
            result.push([name, child.type]);
        }
        console.log("powerpagedebug readDirectory: entries", entry.entries);

        const powerPlatformContext = await PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext();
        console.log("powerpagedebug readDirectory: entries", powerPlatformContext.rootDirectory?.toString(), entry.entries.size, powerPlatformContext.rootDirectory === uri);
        if (powerPlatformContext.rootDirectory && powerPlatformContext.rootDirectory.toString().includes(uri.toString()) && entry.entries.size === 0) {
            console.log("powerpagedebug readDirectory: need to create files");
        } else {
            console.log("powerpagedebug readDirectory", result);
        }
        return result;
    }

    // --- manage file contents

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        console.log("powerpagedebug readFile - updated", uri.toString());

        try {
            const data = await this._lookupAsFile(uri, false);
            return data.data;
        } catch (error) {
            const castedError = error as vscode.FileSystemError;
            console.log("powerpagedebug readFile: in catch", castedError.code, vscode.FileSystemError.FileNotFound.toString());
            if (castedError.code === vscode.FileSystemError.FileNotFound.name) {
                const powerPlatformContext = await PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext();
                console.log("powerpagedebug readFile: values", powerPlatformContext.rootDirectory?.toString());
                if (powerPlatformContext.rootDirectory
                    && uri.toString().includes(powerPlatformContext.rootDirectory.toString())
                    && PathHasEntityFolderName(uri.toString())) {
                    console.log("powerpagedebug readFile: create content here");

                    const powerPlatformContext = PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext();
                    if (!powerPlatformContext.dataverseAccessToken) {
                        await PowerPlatformExtensionContextManager.authenticateAndUpdateDataverseProperties();
                    }

                    await getDataFromDataVerse(
                        powerPlatformContext.dataverseAccessToken,
                        powerPlatformContext.entity,
                        powerPlatformContext.entityId,
                        powerPlatformContext.queryParamsMap,
                        powerPlatformContext.entitiesSchemaMap,
                        powerPlatformContext.languageIdCodeMap,
                        this,
                        powerPlatformContext.websiteIdToLanguage);

                    const data = await this._lookupAsFile(uri, false);
                    return data.data;
                }
                console.log("powerpagedebug readFile: no errors");
            }
        }

        return new Uint8Array();
    }

    async writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean, overwrite: boolean }): Promise<void> {
        console.log("powerpagedebug writefile", uri.toString());
        const basename = path.posix.basename(uri.path);
        const parent = await this._lookupParentDirectory(uri);
        let entry = parent.entries.get(basename);
        if (entry instanceof Directory) {
            throw vscode.FileSystemError.FileIsADirectory(uri);
        }
        if (!entry && !options.create) {
            throw vscode.FileSystemError.FileNotFound();
        }
        if (entry && options.create && !options.overwrite) {
            throw vscode.FileSystemError.FileExists(uri);
        }
        if (!entry) {
            entry = new File(basename);
            parent.entries.set(basename, entry);
            this._fireSoon({ type: vscode.FileChangeType.Created, uri });
        }
        entry.mtime = Date.now();
        entry.size = content.byteLength;
        entry.data = content;

        // Save data to dataverse
        let stringDecodedValue = new TextDecoder(CHARSET).decode(content);
        const powerPlatformContext = PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext();
        const dataMap: Map<string, SaveEntityDetails> = powerPlatformContext.saveDataMap;

        const dataverseOrgUrl = powerPlatformContext.queryParamsMap.get(ORG_URL) as string;

        if (dataMap.get(uri.fsPath)?.getUseBase64Encoding as boolean) {
            stringDecodedValue = toBase64(stringDecodedValue);
        }

        const patchRequestUrl = getRequestURL(dataverseOrgUrl,
            dataMap.get(uri.fsPath)?.getEntityName as string,
            dataMap.get(uri.fsPath)?.getEntityId as string,
            httpMethod.PATCH,
            true);

        await saveData(powerPlatformContext.dataverseAccessToken,
            patchRequestUrl,
            uri,
            dataMap,
            stringDecodedValue);

        this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
    }

    // --- manage files/folders

    async rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean }): Promise<void> {

        if (!options.overwrite && await this._lookup(newUri, true)) {
            throw vscode.FileSystemError.FileExists(newUri);
        }


        const entry = await this._lookup(oldUri, false);
        const oldParent = await this._lookupParentDirectory(oldUri);

        const newParent = await this._lookupParentDirectory(newUri);
        const newName = path.posix.basename(newUri.path);

        oldParent.entries.delete(entry.name);
        entry.name = newName;
        newParent.entries.set(newName, entry);

        this._fireSoon(
            { type: vscode.FileChangeType.Deleted, uri: oldUri },
            { type: vscode.FileChangeType.Created, uri: newUri }
        );
    }

    async delete(uri: vscode.Uri): Promise<void> {
        console.log("powerpagedebug delete", uri.toString());
        const dirname = uri.with({ path: path.posix.dirname(uri.path) });
        const basename = path.posix.basename(uri.path);
        const parent = await this._lookupAsDirectory(dirname, false);
        if (!parent.entries.has(basename)) {
            throw vscode.FileSystemError.FileNotFound();
        }
        parent.entries.delete(basename);
        parent.mtime = Date.now();
        parent.size -= 1;
        this._fireSoon({ type: vscode.FileChangeType.Changed, uri: dirname }, { uri, type: vscode.FileChangeType.Deleted });
    }

    async createDirectory(uri: vscode.Uri): Promise<void> {
        console.log("powerpagedebug createDirectory", uri.toString());
        const basename = path.posix.basename(uri.path);
        const dirname = uri.with({ path: path.posix.dirname(uri.path) });
        const parent = await this._lookupAsDirectory(dirname, false);

        const entry = new Directory(basename);
        parent.entries.set(entry.name, entry);
        parent.mtime = Date.now();
        parent.size += 1;
        this._fireSoon({ type: vscode.FileChangeType.Changed, uri: dirname }, { type: vscode.FileChangeType.Created, uri });
    }

    // --- lookup

    private async _lookup(uri: vscode.Uri, silent: false): Promise<Entry>;
    private async _lookup(uri: vscode.Uri, silent: boolean): Promise<Entry | undefined>;
    private async _lookup(uri: vscode.Uri, silent: boolean): Promise<Entry | undefined> {
        const parts = uri.path.split('/');
        let entry: Entry = this.root;
        for (const part of parts) {
            if (!part) {
                continue;
            }
            let child: Entry | undefined;
            if (entry instanceof Directory) {
                child = entry.entries.get(part);
            }
            if (!child) {
                if (!silent) {
                    throw vscode.FileSystemError.FileNotFound();
                } else {
                    return undefined;
                }
            }
            entry = child;
        }
        return entry;
    }

    private async _lookupAsDirectory(uri: vscode.Uri, silent: boolean): Promise<Directory> {
        const entry = await this._lookup(uri, silent);
        if (entry instanceof Directory) {
            return entry;
        }
        throw vscode.FileSystemError.FileNotADirectory(uri);
    }

    private async _lookupAsFile(uri: vscode.Uri, silent: boolean): Promise<File> {
        const entry = await this._lookup(uri, silent);
        if (entry instanceof File) {
            return entry;
        }
        throw vscode.FileSystemError.FileIsADirectory(uri);
    }

    private async _lookupParentDirectory(uri: vscode.Uri): Promise<Directory> {
        const dirname = uri.with({ path: path.posix.dirname(uri.path) });
        return await this._lookupAsDirectory(dirname, false);
    }

    // --- manage file events

    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    private _bufferedEvents: vscode.FileChangeEvent[] = [];
    private _fireSoonHandle?: NodeJS.Timer;

    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    watch(_resource: vscode.Uri): vscode.Disposable {
        // ignore, fires for all changes...
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return new vscode.Disposable(() => { });
    }

    private _fireSoon(...events: vscode.FileChangeEvent[]): void {
        this._bufferedEvents.push(...events);

        if (this._fireSoonHandle) {
            clearTimeout(this._fireSoonHandle);
        }
        this._fireSoonHandle = setTimeout(() => {
            this._emitter.fire(this._bufferedEvents);
            this._bufferedEvents.length = 0;
        }, 5);
    }
}
