/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import {
    Disposable,
    FileSystemWatcher,
    RelativePattern,
    Uri,
    WorkspaceFolder,
    workspace,
} from "vscode";
import { ErrorReporter } from "../common/ErrorReporter";
import { sleep } from "./utils";

/**
 * A file watcher that watches for file changes in a given folder.
 */
export class FileWatcher implements Disposable {
    /**
     * Vscode file watcher instance.
     */
    private readonly watcher: FileSystemWatcher;

    /**
     * Wether or not a file change was already triggered.
     * This flag prevents us from reloading the page multiple times.
     */
    private fileChangeTriggered = false;

    /**
     * Delay after a bundle change was detected.
     */
    private readonly FILE_WATCHER_CHANGE_DELAY = 5000;

    /**
     * The callback to call when a file changes.
     */
    private onFileChange?: () => Promise<void>;

    /**
     * Creates a new FileWatcher instance.
     * @param filePattern The file pattern to watch.
     * @param workspaceFolder The workspace folder to watch.
     * @param logger The logger to use for telemetry.
     */
    constructor(
        filePattern: string,
        workspaceFolder: WorkspaceFolder,
        createFileSystemWatcher = workspace.createFileSystemWatcher
    ) {
        const pattern = new RelativePattern(workspaceFolder, filePattern);
        this.watcher = createFileSystemWatcher(pattern, true, false, true);
        this.watcher.onDidChange((uri) => this.onChange(uri));
    }

    public register(onFileChange: () => Promise<void>) {
        this.onFileChange = onFileChange;
    }

    /**
     * Handle file change events.
     * @param _ The URI of the file that changed.
     */
    private onChange(_: Uri) {
        if (this.fileChangeTriggered) {
            return;
        }

        this.fileChangeTriggered = true;
        const onChangeAction = async () => {
            if (!this.onFileChange) {
                return;
            }

            // Somehow we need to wait a bit before we can trigger the onFileChange.
            // If we don't wait, then the bundle will still be in its old state *before* the change that triggered
            // the file watcher to call the onChange event.
            await sleep(this.FILE_WATCHER_CHANGE_DELAY);
            try {
                await this.onFileChange();
            } catch (error) {
                await ErrorReporter.report(
                    "FileWatcher.onChange.error",
                    error,
                    "Could not execute file change action.",
                    false
                );
            }
            this.fileChangeTriggered = false;
        };
        void onChangeAction();
    }

    /**
     * Dispose the watcher.
     */
    dispose() {
        this.watcher.dispose();
        this.onFileChange = undefined;
    }
}
