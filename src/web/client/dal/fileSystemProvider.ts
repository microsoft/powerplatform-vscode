/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as path from 'path';
import * as vscode from 'vscode';
import { convertStringtoBase64 } from '../utilities/commonUtil';
import { getRequestURL, pathHasEntityFolderName } from '../utilities/urlBuilderUtil';
import { CHARSET, httpMethod, PORTALS_URI_SCHEME, queryParameters } from '../common/constants';
import { FileData } from '../context/fileData';
import WebExtensionContext from "../WebExtensionContext";
import { fetchDataFromDataverseAndUpdateVFS } from './remoteFetchProvider';
import { saveData } from './remoteSaveProvider';
import * as nls from 'vscode-nls';
import { ERRORS } from '../common/errorHandler';
import { telemetryEventNames } from '../telemetry/constants';
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

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
        const result: [string, vscode.FileType][] = [];
        try {
            const entry = await this._lookupAsDirectory(uri, false);
            for (const [name, child] of entry.entries) {
                result.push([name, child.type]);
            }
        } catch (error) {
            const castedError = error as vscode.FileSystemError;

            if (castedError.code === vscode.FileSystemError.FileNotFound.name) {
                const powerPlatformContext = await WebExtensionContext.getWebExtensionContext();

                if (powerPlatformContext.isContextSet &&
                    uri.toString().toLowerCase() === powerPlatformContext.rootDirectory.toString().toLowerCase()) {
                    WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_FETCH_DIRECTORY_TRIGGERED);
                    await this._loadFromDataverseToVFS();
                }
            }
        }
        return result;
    }

    // --- manage file contents

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        try {
            const data = await this._lookupAsFile(uri, false);
            return data.data;
        } catch (error) {
            const castedError = error as vscode.FileSystemError;

            if (castedError.code === vscode.FileSystemError.FileNotFound.name) {
                const powerPlatformContext = await WebExtensionContext.getWebExtensionContext();

                if (powerPlatformContext.isContextSet
                    && uri.toString().includes(powerPlatformContext.rootDirectory.toString())) {
                    if (pathHasEntityFolderName(uri.toString())) {
                        WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_FETCH_FILE_TRIGGERED);
                        await this._loadFromDataverseToVFS();
                        const data = await this._lookupAsFile(uri, false);
                        return data.data;
                    }
                }
            }
        }
        return new Uint8Array();
    }

    async writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean, overwrite: boolean }): Promise<void> {
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
        } else if (WebExtensionContext.getWebExtensionContext().fileDataMap.has(uri.fsPath)) {

            // Save data to dataverse
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                cancellable: true,
                title: localize("microsoft-powerapps-portals.webExtension.save.file.message", "Saving your file ...")
            }, async () => {
                WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_SAVE_FILE_TRIGGERED);
                await this._saveFileToDataverseFromVFS(uri, content);
            });
        }

        entry.mtime = Date.now();
        entry.size = content.byteLength;
        entry.data = content;

        this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
    }

    // --- manage files/folders
    async createDirectory(uri: vscode.Uri): Promise<void> {
        const basename = path.posix.basename(uri.path);
        const dirname = uri.with({ path: path.posix.dirname(uri.path) });
        const parent = await this._lookupAsDirectory(dirname, false);

        const entry = new Directory(basename);
        parent.entries.set(entry.name, entry);
        parent.mtime = Date.now();
        parent.size += 1;
        this._fireSoon({ type: vscode.FileChangeType.Changed, uri: dirname }, { type: vscode.FileChangeType.Created, uri });
    }

    async rename(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async delete(): Promise<void> {
        throw new Error('Method not implemented.');
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
    private _fireSoonHandle?: NodeJS.Timeout;

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

    // --- VFS calls
    private async createFileSystem(portalsFS: PortalsFS, portalFolderName: string) {
        if (portalFolderName.length === 0) {
            WebExtensionContext.telemetry.sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_EMPTY_PORTAL_FOLDER_NAME);
            throw new Error(ERRORS.PORTAL_FOLDER_NAME_EMPTY);
        }

        WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_CREATE_ROOT_FOLDER);

        await portalsFS.createDirectory(vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/${portalFolderName}/`, true));
        vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, { uri: vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/${portalFolderName}/`), name: portalFolderName });
    }

    // --- Dataverse calls

    private async _loadFromDataverseToVFS() {
        const powerPlatformContext = await WebExtensionContext.authenticateAndUpdateDataverseProperties();
        await this.createFileSystem(this, powerPlatformContext.urlParametersMap.get(queryParameters.WEBSITE_NAME) as string);

        if (!powerPlatformContext.dataverseAccessToken) {
            WebExtensionContext.telemetry.sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_MISSING);
            throw vscode.FileSystemError.NoPermissions();
        }

        await fetchDataFromDataverseAndUpdateVFS(
            powerPlatformContext.dataverseAccessToken,
            powerPlatformContext.defaultEntityType,
            powerPlatformContext.defaultEntityId,
            powerPlatformContext.urlParametersMap,
            powerPlatformContext.languageIdCodeMap,
            this,
            powerPlatformContext.websiteIdToLanguage);
    }

    private async _saveFileToDataverseFromVFS(uri: vscode.Uri, content: Uint8Array) {
        let stringDecodedValue = new TextDecoder(CHARSET).decode(content);
        let powerPlatformContext = WebExtensionContext.getWebExtensionContext();
        const dataMap: Map<string, FileData> = powerPlatformContext.fileDataMap;
        const dataverseOrgUrl = powerPlatformContext.urlParametersMap.get(queryParameters.ORG_URL) as string;

        powerPlatformContext = await WebExtensionContext.reAuthenticate();

        if (dataMap.get(uri.fsPath)?.hasBase64Encoding as boolean) {
            stringDecodedValue = convertStringtoBase64(stringDecodedValue);
        }

        const patchRequestUrl = getRequestURL(dataverseOrgUrl,
            dataMap.get(uri.fsPath)?.getEntityName as string,
            dataMap.get(uri.fsPath)?.getEntityId as string,
            httpMethod.PATCH,
            true);

        await saveData(
            powerPlatformContext.dataverseAccessToken,
            patchRequestUrl,
            uri,
            stringDecodedValue);
    }
}
