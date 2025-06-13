/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import {
    DebugAdapterDescriptor,
    DebugAdapterDescriptorFactory,
    DebugAdapterInlineImplementation,
    DebugSession,
    ProviderResult,
    WorkspaceFolder,
    debug,
    workspace,
} from "vscode";

import { Debugger } from "./Debugger";
import { ErrorReporter } from "../../common/ErrorReporter";
import { BrowserManager } from "../browser";
import { BundleLoader } from "../BundleLoader";
import { IPcfLaunchConfig } from "../configuration/types";
import { RequestInterceptor } from "../RequestInterceptor";
import { FileWatcher } from "../FileWatcher";
import { ControlLocator } from "../controlLocation";
import { BrowserLocator } from "../browser/BrowserLocator";

/**
 * Factory class that creates the debugger.
 */
export class DebugAdaptorFactory implements DebugAdapterDescriptorFactory {
    /**
     * Creates the dependencies for the debugger.
     * @param session The {@link DebugSession debug session} for which the debug adapter will be used.
     * @param workspaceFolder The current workspace folder for the debugger to use.
     * @returns The BrowserManager instance.
     */
    private createDependencyTree(
        session: DebugSession,
        workspaceFolder: WorkspaceFolder
    ): BrowserManager {
        const debugConfig = session.configuration as IPcfLaunchConfig;

        const bundleWatcher = new FileWatcher(
            debugConfig.file,
            workspaceFolder
        );

        const bundleLoader = new BundleLoader(
            debugConfig.file,
            workspaceFolder
        );
        const bundleInterceptor = new RequestInterceptor(bundleLoader);

        const controlLocator = new ControlLocator(debugConfig);

        const browserLocator = new BrowserLocator(debugConfig);

        return new BrowserManager(
            bundleWatcher,
            bundleInterceptor,
            controlLocator,
            browserLocator,
            debugConfig
        );
    }

    /**
     * This method is called at the start of a debug session to provide details about the debug adapter to use.
     * These details must be returned as objects of type {@link DebugAdapterDescriptor}.
     * @param session The {@link DebugSession debug session} for which the debug adapter will be used.
     * @returns A {@link DebugAdapterDescriptor debug adapter descriptor} or undefined.
     */
    public async createDebugAdapterDescriptor(
        session: DebugSession
    ): Promise<ProviderResult<DebugAdapterDescriptor>> {
        const workspaceFolder = this.getWorkspaceFolder();
        if (!workspaceFolder) {
            await debug.stopDebugging();
            return;
        }

        const browserManager = this.createDependencyTree(
            session,
            workspaceFolder
        );
        const debugAdaptor = new Debugger(
            browserManager,
            session,
            workspaceFolder
        );
        return new DebugAdapterInlineImplementation(debugAdaptor);
    }

    /**
     * Retrieves the current workspace folder for the debugger to use.
     * @returns The current workspace folder or undefined if no workspace is open.
     */
    private getWorkspaceFolder(): WorkspaceFolder | undefined {
        const folders = workspace.workspaceFolders || [];
        const workspaceFolder = folders[0];
        if (!workspaceFolder) {
            void ErrorReporter.report(
                "DebugAdaptorFactory.getWorkspaceFolder",
                undefined,
                "Could not find workspace folder for debugger. Please make sure you've opened a workspace and try again."
            );
            return;
        }
        return workspaceFolder;
    }
}
