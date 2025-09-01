/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as path from "path";
import * as vscode from "vscode";
import { isValidDirectoryPath, isValidFilePath, isWebFileWithLazyLoad } from "../utilities/urlBuilderUtil";
import {
    PORTALS_URI_SCHEME,
    queryParameters,
    REFERRER,
    SERVERLOGICS,
} from "../common/constants";
import WebExtensionContext from "../WebExtensionContext";
import { fetchDataFromDataverseAndUpdateVFS } from "./remoteFetchProvider";
import { saveData } from "./remoteSaveProvider";
import { webExtensionTelemetryEventNames } from "../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";
import { getFolderSubUris } from "../utilities/folderHelperUtility";
import { EtagHandlerService } from "../services/etagHandlerService";
import {
    fileHasDiffViewTriggered,
    fileHasDirtyChanges,
    getEntityEtag,
    getFileEntityEtag,
    getFileEntityId,
    getFileEntityName,
    getFileName,
    updateDiffViewTriggered,
    updateEntityColumnContent,
    updateFileDirtyChanges,
    updateFileEntityEtag,
} from "../utilities/fileAndEntityUtil";
import { getImageFileContent, getRangeForMultilineMatch, isImageFileSupportedForEdit, isPortalVersionV1, isVersionControlEnabled, updateFileContentInFileDataMap } from "../utilities/commonUtil";
import { IFileInfo, ISearchQueryMatch, ISearchQueryResults } from "../common/interfaces";
import { ERROR_CONSTANTS } from "../../../common/ErrorConstants";
import { EnableServerLogicChanges } from "../../../common/ecs-features/ecsFeatureGates";

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
    root = new Directory("");

    // --- manage file metadata

    async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
        if (fileHasDirtyChanges(uri.fsPath)) {
            if (isVersionControlEnabled()) {
                const latestContent =
                    await EtagHandlerService.getLatestFileContentAndUpdateMetadata(
                        uri.fsPath,
                        this
                    );
                const entityEtagValue = getEntityEtag(
                    getFileEntityId(uri.fsPath)
                );

                // Triggers diff view logic in web extension using file system provider in-built flows
                if (
                    latestContent.length > 0 &&
                    getFileEntityEtag(uri.fsPath) !== entityEtagValue
                ) {
                    updateDiffViewTriggered(uri.fsPath, true);
                    updateFileEntityEtag(uri.fsPath, entityEtagValue);
                    await this.updateMtime(uri, latestContent);
                    WebExtensionContext.telemetry.sendInfoTelemetry(
                        webExtensionTelemetryEventNames.WEB_EXTENSION_DIFF_VIEW_TRIGGERED
                    );
                }
            }
        }

        return await this._lookup(uri, false);
    }

    async readDirectory(uri: vscode.Uri, isActivationFlow = false): Promise<[string, vscode.FileType][]> {
        const result: [string, vscode.FileType][] = [];
        if (isActivationFlow && isValidDirectoryPath(uri.fsPath)) {
            WebExtensionContext.telemetry.sendInfoTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_FETCH_DIRECTORY_TRIGGERED
            );
            await this._loadFromDataverseToVFS();
            return result;
        }

        const entry = await this._lookup(uri, true);
        if (entry instanceof Directory) {
            for (const [name, child] of entry.entries) {
                result.push([name, child.type]);
            }
        }
        return result;
    }

    // --- manage file contents

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        let data = await this._lookup(uri, true);

        const isLazyLoadedWebFile = isWebFileWithLazyLoad(uri.fsPath);
        if ((!data && isValidFilePath(uri.fsPath))
            || isLazyLoadedWebFile) {
            await this._loadFileFromDataverseToVFS(uri);
            data = await this._lookup(uri, true);
        }

        const fileContent = data instanceof File ? data.data : new Uint8Array();
        if (fileHasDirtyChanges(uri.fsPath)) {
            if (fileHasDiffViewTriggered(uri.fsPath)) {
                updateDiffViewTriggered(uri.fsPath, false);
            } else {
                const fileData = WebExtensionContext.fileDataMap.getFileMap.get(uri.fsPath);
                if (fileData?.entityId && fileData.attributePath) {
                    updateEntityColumnContent(fileData?.entityId, fileData?.attributePath, Buffer.from(fileContent).toString());
                    updateFileDirtyChanges(uri.fsPath, false);
                }
            }
        }

        return fileContent;
    }

    async writeFile(
        uri: vscode.Uri,
        content: Uint8Array,
        options: { create: boolean; overwrite: boolean },
        isFirstTimeWrite = false
    ): Promise<void> {
        const basename = path.posix.basename(uri.path);
        const parent = await this._lookupParentDirectory(uri);
        let entry = parent.entries.get(basename);
        const isImageEdit = isImageFileSupportedForEdit(basename);

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

        if (!isFirstTimeWrite &&
            (WebExtensionContext.fileDataMap.getFileMap.get(uri.fsPath)
                ?.hasDirtyChanges
                || isImageEdit)
        ) {
            if (isImageEdit) {
                WebExtensionContext.telemetry.sendInfoTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_SAVE_IMAGE_FILE_TRIGGERED
                );

                updateFileContentInFileDataMap(uri.fsPath, getImageFileContent(uri.fsPath, content), true);
            }

            // Save data to dataverse
            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    cancellable: true,
                    title: vscode.l10n.t("Saving your file ..."),
                },
                async () => {
                    WebExtensionContext.telemetry.sendInfoTelemetry(
                        webExtensionTelemetryEventNames.WEB_EXTENSION_SAVE_FILE_TRIGGERED
                    );
                    await this._saveFileToDataverseFromVFS(uri);
                }
            );
        }

        entry.mtime = Date.now();
        entry.size = content.byteLength;
        entry.data = content;

        this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
    }

    // --- manage files/folders
    async createDirectory(uri: vscode.Uri): Promise<void> {
        // Do silent lookup to check for existing entry
        const entry = await this._lookup(uri, true);
        const { enableServerLogicChanges } = EnableServerLogicChanges.getConfig() as { enableServerLogicChanges?: boolean };
        if (!entry) {
            const basename = path.posix.basename(uri.path);
            const dirname = uri.with({ path: path.posix.dirname(uri.path) });
            const parent = await this._lookupAsDirectory(dirname, false);

            if (basename === SERVERLOGICS && !enableServerLogicChanges) {
                return; // Do not create the directory if the server logic is disabled
            }

            const entry = new Directory(basename);
            parent.entries.set(entry.name, entry);
            parent.mtime = Date.now();
            parent.size += 1;
            this._fireSoon(
                { type: vscode.FileChangeType.Changed, uri: dirname },
                { type: vscode.FileChangeType.Created, uri }
            );
        }
    }

    async rename(): Promise<void> {
        WebExtensionContext.telemetry.sendErrorTelemetry(
            webExtensionTelemetryEventNames.WEB_EXTENSION_RENAME_NOT_SUPPORTED,
            this.rename.name
        );
        throw new Error("Method not implemented.");
    }

    async delete(): Promise<void> {
        WebExtensionContext.telemetry.sendErrorTelemetry(
            webExtensionTelemetryEventNames.WEB_EXTENSION_DELETE_NOT_SUPPORTED,
            this.delete.name
        );
        throw new Error("Method not implemented.");
    }

    async updateMtime(uri: vscode.Uri, latestContent: string): Promise<void> {
        const basename = path.posix.basename(uri.path);
        const parent = await this._lookupParentDirectory(uri);
        const entry = parent.entries.get(basename);

        if (!entry) {
            throw vscode.FileSystemError.FileNotFound();
        }

        if (entry instanceof Directory) {
            throw vscode.FileSystemError.FileIsADirectory(uri);
        }

        entry.mtime = entry.mtime + 1;
        entry.data = new TextEncoder().encode(latestContent);
        entry.size = entry.size + 1;
        this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
    }

    async searchFiles(pattern: string) {
        // Record start time for iterating directory and searching files
        const startTime = Date.now();

        // create case sensitive regex
        const regex = new RegExp(pattern, "i");
        const files = await this.iterateDirectory(WebExtensionContext.rootDirectory);
        const results: vscode.ProviderResult<vscode.Uri[]> = [];

        files.forEach((fileUri) => {
            const isMatch = regex.test(fileUri.path);
            if (isMatch) {
                results.push(fileUri);
            }
        });

        WebExtensionContext.telemetry.sendInfoTelemetry(
            webExtensionTelemetryEventNames.WEB_EXTENSION_SEARCH_FILE,
            {
                duration: (Date.now() - startTime).toString(),
                files: files.length.toString(),
            }
        );

        return files;
    }

    private async iterateDirectory(uri: vscode.Uri) {
        const entries = await vscode.workspace.fs.readDirectory(uri);
        const files: vscode.Uri[] = [];

        for (const [entry, type] of entries) {
            const entryUri = vscode.Uri.joinPath(uri, entry);

            if (type === vscode.FileType.Directory) {
                const dirFiles = await this.iterateDirectory(entryUri);
                files.push(...dirFiles);
            } else if (type === vscode.FileType.File) {
                files.push(entryUri);
            }
        }

        return files;
    }

    async searchTextResults(query: vscode.TextSearchQuery, options: vscode.TextSearchOptions, progress: vscode.Progress<vscode.TextSearchResult>) {
        const results = await this.searchText(
            query,
            { maxResults: options.maxResults }
        );

        if (results === undefined) {
            return { limitHit: true };
        }

        for (const match of results.matches) {
            progress.report({
                uri: match.uri,
                ranges: match.ranges,
                preview: {
                    text: match.preview,
                    matches: match.matches,
                },
            });
        }

        return { limitHit: false };
    }

    async searchText(query: vscode.TextSearchQuery, options: { maxResults?: number }): Promise<ISearchQueryResults> {
        // Record start time for search
        const startTime = Date.now();

        const matches: ISearchQueryMatch[] = [];
        const files = await this.iterateDirectory(WebExtensionContext.rootDirectory);

        // Promises array to store promises for file reads
        const fileReadPromises = files.map(async (file) => {
            // Record start time for file processing
            const startFileTime = Date.now();

            const content = await this.readFile(file);

            // Convert buffer to string and replace windows line endings with unix line endings
            const text = new TextDecoder().decode(content).replace(/\r\n/g, '\n');

            // Convert windows line endings with unix line endings
            const pattern = query.pattern.replace(/\r\n/g, '\n');

            const lines = text.split('\n');

            const match: ISearchQueryMatch = {
                uri: file,
                ranges: [],
                preview: text,
                matches: [],
            };

            let regex;
            if (query.isWordMatch) {
                // \b is a word boundary
                regex = query.isCaseSensitive ? new RegExp(`\\b${pattern}\\b`) : new RegExp(`\\b${pattern}\\b`, "i");
            } else if (query.isRegExp) {
                regex = new RegExp(pattern);
            } else {
                regex = query.isCaseSensitive ? new RegExp(pattern) : new RegExp(pattern, "i");
            }

            if (query.isMultiline) {
                if (text.includes(pattern)) {
                    const index = text.indexOf(pattern);
                    const range = getRangeForMultilineMatch(text, pattern, index);
                    match.ranges.push(range);
                    match.matches.push(range);
                    matches.push(match);
                }
            } else {
                for (let i = 0; i < lines.length; i++) {
                    if (options.maxResults !== undefined && matches.length > options.maxResults) {
                        return { matches: matches, limitHit: true };
                    }

                    const regexMatch = lines[i].match(regex);

                    if (regexMatch) {
                        regexMatch.forEach((m) => {
                            const index = lines[i].indexOf(m);
                            const range = new vscode.Range(i, index, i, index + m.length);
                            match.ranges.push(range);
                            match.matches.push(new vscode.Range(i, index, i, index + m.length));
                            matches.push(match);
                        });
                    }
                }
            }

            // Record end time for file processing
            const endFileTime = Date.now();

            WebExtensionContext.telemetry.sendInfoTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_SEARCH_TEXT_RESULTS,
                {
                    duration: (endFileTime - startFileTime).toString(),
                    isMultiline: query.isMultiline ? "true" : "false",
                    isCaseSensitive: query.isCaseSensitive ? "true" : "false",
                    isWordMatch: query.isWordMatch ? "true" : "false",
                    isRegExp: query.isRegExp ? "true" : "false",
                }
            );
        });

        // Wait for all file read promises to resolve
        await Promise.all(fileReadPromises);

        // Record end time for search
        const endTime = Date.now();
        WebExtensionContext.telemetry.sendInfoTelemetry(
            webExtensionTelemetryEventNames.WEB_EXTENSION_SEARCH_TEXT,
            {
                duration: (endTime - startTime).toString(),
            }
        );

        return { matches: matches, limitHit: false };
    }

    // --- lookup

    private async _lookup(uri: vscode.Uri, silent: false): Promise<Entry>;
    private async _lookup(
        uri: vscode.Uri,
        silent: boolean
    ): Promise<Entry | undefined>;
    private async _lookup(
        uri: vscode.Uri,
        silent: boolean
    ): Promise<Entry | undefined> {
        const parts = uri.path.split("/");
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

    private async _lookupAsDirectory(
        uri: vscode.Uri,
        silent: boolean
    ): Promise<Directory> {
        const entry = await this._lookup(uri, silent);

        if (entry instanceof Directory) {
            return entry;
        }

        throw vscode.FileSystemError.FileNotADirectory(uri);
    }

    private async _lookupAsFile(
        uri: vscode.Uri,
        silent: boolean
    ): Promise<File> {
        const entry = await this._lookup(uri, silent);

        if (entry instanceof File) {
            return entry;
        }

        throw vscode.FileSystemError.FileNotFound(uri);
    }

    private async _lookupParentDirectory(uri: vscode.Uri): Promise<Directory> {
        const dirname = uri.with({ path: path.posix.dirname(uri.path) });
        return await this._lookupAsDirectory(dirname, false);
    }

    // --- manage file events

    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    private _bufferedEvents: vscode.FileChangeEvent[] = [];
    private _fireSoonHandle?: NodeJS.Timeout;

    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> =
        this._emitter.event;

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
    private async createFileSystem(portalFolderName: string) {
        if (portalFolderName.length === 0) {
            WebExtensionContext.telemetry.sendErrorTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_EMPTY_PORTAL_FOLDER_NAME,
                this.createFileSystem.name
            );
            throw new Error(ERROR_CONSTANTS.PORTAL_FOLDER_NAME_EMPTY);
        }

        WebExtensionContext.telemetry.sendInfoTelemetry(
            webExtensionTelemetryEventNames.WEB_EXTENSION_CREATE_ROOT_FOLDER
        );
        await this.createDirectory(
            vscode.Uri.parse(
                `${PORTALS_URI_SCHEME}:/${portalFolderName}/`,
                true
            )
        );
        vscode.workspace.updateWorkspaceFolders(
            vscode.workspace.workspaceFolders
                ? vscode.workspace.workspaceFolders.length
                : 0,
            null,
            {
                uri: vscode.Uri.parse(
                    `${PORTALS_URI_SCHEME}:/${portalFolderName}/`
                ),
                name: portalFolderName,
            }
        );

        await this.createEntityFolder(portalFolderName);
    }

    private async createEntityFolder(portalFolderName: string) {
        const subUris = getFolderSubUris();

        subUris.forEach(async (subUri) => {
            try {
                if (subUri?.length === 0) {
                    throw new Error(ERROR_CONSTANTS.SUBURI_EMPTY);
                }

                WebExtensionContext.telemetry.sendInfoTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_CREATE_ENTITY_FOLDER,
                    { entityFolderName: subUri }
                );

                const filePathInPortalFS = `${PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/`;
                await this.createDirectory(
                    vscode.Uri.parse(filePathInPortalFS, true)
                );
            } catch {
                WebExtensionContext.telemetry.sendInfoTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_CREATE_ENTITY_FOLDER_FAILED
                );
            }
        });
    }

    // --- Dataverse calls
    private async _loadFromDataverseToVFS() {
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();
        await this.createFileSystem(
            WebExtensionContext.urlParametersMap.get(
                queryParameters.WEBSITE_NAME
            ) as string
        );

        // Try Loading default file first
        const referrer = WebExtensionContext.urlParametersMap.get(queryParameters.REFERRER) as string

        // If referrer is power pages home and DM is V1, random home page id is being passed. Leading to error page.
        const shouldLoadDefaultFile = !(referrer === REFERRER.POWER_PAGES_HOME && isPortalVersionV1())

        if (WebExtensionContext.defaultEntityId !== "" && WebExtensionContext.defaultEntityType !== "" && shouldLoadDefaultFile) {
            await fetchDataFromDataverseAndUpdateVFS(
                this,
                {
                    entityId: WebExtensionContext.defaultEntityId,
                    entityName: WebExtensionContext.defaultEntityType,
                } as IFileInfo
            );

            // Fire and forget
            vscode.commands.executeCommand('vscode.open', WebExtensionContext.defaultFileUri, { preview: false, preserveFocus: true, viewColumn: vscode.ViewColumn.Active });

            WebExtensionContext.telemetry.sendInfoTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_VSCODE_START_COMMAND,
                {
                    commandId: "vscode.open",
                    type: "file",
                    entityId: WebExtensionContext.defaultEntityId,
                    entityName: WebExtensionContext.defaultEntityType,
                    isMultifileEnabled: WebExtensionContext.showMultifileInVSCode.toString(),
                    duration: (new Date().getTime() - WebExtensionContext.extensionActivationTime).toString(),
                }
            );
        }

        if (WebExtensionContext.showMultifileInVSCode) {
            // load rest of the files
            await fetchDataFromDataverseAndUpdateVFS(this);
        }

        WebExtensionContext.telemetry.sendInfoTelemetry(
            webExtensionTelemetryEventNames.WEB_EXTENSION_PREPARE_WORKSPACE_SUCCESS,
            {
                isMultifileEnabled: WebExtensionContext.showMultifileInVSCode.toString(),
                duration: (new Date().getTime() - WebExtensionContext.extensionActivationTime).toString(),
            }
        );
    }

    private async _loadFileFromDataverseToVFS(uri: vscode.Uri) {
        const entityId = getFileEntityId(uri.fsPath);
        const entityName = getFileEntityName(uri.fsPath);
        const fileName = getFileName(uri.fsPath);

        if (entityId && entityName && fileName) {
            await WebExtensionContext.dataverseAuthentication();
            await this.createFileSystem(
                WebExtensionContext.urlParametersMap.get(
                    queryParameters.WEBSITE_NAME
                ) as string
            );

            await fetchDataFromDataverseAndUpdateVFS(
                this,
                {
                    entityId: entityId,
                    entityName: entityName,
                    fileName: fileName
                } as IFileInfo
            );

            WebExtensionContext.telemetry.sendInfoTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_VSCODE_RELOAD_FILE,
                { entityId: entityId, entityName: entityName }
            );
        }
    }

    private async _saveFileToDataverseFromVFS(uri: vscode.Uri) {
        await saveData(uri);

        // Update fileDataMap with the latest changes
        updateFileDirtyChanges(uri.fsPath, false);
        updateDiffViewTriggered(uri.fsPath, false);

        // Update the etag of the file after saving
        await EtagHandlerService.updateFileEtag(uri.fsPath);
    }
}
