/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

import {
    Disposable,
    FileSystemWatcher,
    RelativePattern,
    Uri,
    WorkspaceFolder,
    workspace,
} from "vscode";
import { ITelemetry } from "../client/telemetry/ITelemetry";
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
     * Creates a new FileWatcher instance.
     * @param filePattern The file pattern to watch.
     * @param onFileChange The callback to call when a file changes.
     * @param workspaceFolder The workspace folder to watch.
     * @param logger The logger to use for telemetry.
     */
    constructor(
        filePattern: string,
        private readonly onFileChange: () => Promise<void>,
        workspaceFolder: WorkspaceFolder,
        private readonly logger: ITelemetry
    ) {
        const pattern = new RelativePattern(workspaceFolder, filePattern);
        this.watcher = workspace.createFileSystemWatcher(
            pattern,
            true,
            false,
            true
        );
        this.watcher.onDidChange((uri) => this.onChange(uri));
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
            // Somehow we need to wait a bit before we can trigger the onFileChange.
            // If we don't wait, then the bundle will still be in its old state *before* the change that triggered
            // the file watcher to call the onChange event.
            await sleep(5000);
            try {
                await this.onFileChange();
            } catch (error) {
                await ErrorReporter.report(
                    this.logger,
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
    }
}
