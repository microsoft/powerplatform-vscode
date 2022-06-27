/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
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
import { ITelemetry } from "../../client/telemetry/ITelemetry";
import { ErrorReporter } from "../../common/ErrorReporter";

/**
 * Factory class that creates the debugger.
 */
export class DebugAdaptorFactory implements DebugAdapterDescriptorFactory {
    /**
     * Creates a new DebugAdaptorFactory instance.
     * @param logger The telemetry reporter to use for telemetry.
     */
    constructor(private readonly logger: ITelemetry) {}

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

        const debugAdaptor = new Debugger(
            session,
            workspaceFolder,
            this.logger
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
                this.logger,
                "DebugAdaptorFactory.getWorkspaceFolder",
                undefined,
                "Could not find workspace folder for debugger. Please make sure you've opened a workspace and try again."
            );
            return;
        }
        return workspaceFolder;
    }
}
