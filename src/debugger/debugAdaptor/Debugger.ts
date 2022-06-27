/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

import {
    DebugAdapter,
    DebugConfiguration,
    DebugSession,
    Disposable,
    Event,
    WorkspaceFolder,
    debug,
} from "vscode";
import { ITelemetry } from "../../client/telemetry/ITelemetry";
import { ErrorReporter } from "../../common/ErrorReporter";

import { BrowserManager } from "../browser/BrowserManager";
import { IPcfLaunchConfig } from "../configuration/types/IPcfLaunchConfig";
import { sleep } from "../utils";

import { ProtocolMessage } from "./DebugProtocolMessage";

const defaultDebuggingRetryCount = 3;

/**
 * Control debugger that controls the msedge debug session.
 */
export class Debugger implements Disposable, DebugAdapter {
    private readonly debugConfig: IPcfLaunchConfig;
    private edgeDebugSession?: DebugSession;
    private browserManager: BrowserManager;
    private startDebugTimeout: NodeJS.Timeout | undefined;
    private startDebuggingDisposable?: Disposable;
    private debugSessionTerminatedDisposable?: Disposable;
    private isDisposed = false;

    /**
     * Flag indicating if a debug session is running.
     * @returns True if a debug session is running, false otherwise.
     */
    public get isRunning(): boolean {
        const activeSession = debug.activeDebugSession;
        return (
            activeSession !== undefined &&
            activeSession.id === this.edgeDebugSession?.id
        );
    }

    /**
     * Flag indicating if the debugger session is attached.
     * @returns True if the debugger session is attached, false otherwise.
     */
    public get hasAttachedDebuggerSession(): boolean {
        return this.edgeDebugSession !== undefined;
    }

    /**
     * Creates a new Debugger instance.
     * @param parentSession The parent debug session that was started by the user.
     * @param workspaceFolder The workspace folder to use for debugging.
     * @param logger The telemetry reporter to use for telemetry.
     */
    constructor(
        private readonly parentSession: DebugSession,
        private readonly workspaceFolder: WorkspaceFolder,
        private readonly logger: ITelemetry
    ) {
        this.debugConfig = parentSession.configuration as IPcfLaunchConfig;
        this.browserManager = new BrowserManager(
            logger,
            this.debugConfig,
            async () => this.stopDebugging(),
            async () => this.attachEdgeDebugger(),
            workspaceFolder
        );
        this.startDebuggingDisposable = debug.onDidStartDebugSession(
            (session) => this.onDebugSessionStarted(session)
        );
    }

    /**
     * An event which fires after the debug adapter has sent a Debug Adapter Protocol message to the editor.
     * Messages can be requests, responses, or events.
     *
     * *This debugger does not send messages to the editor, hence why subscribing is not supported*.
     * @implements {DebugAdapter}
     */
    onDidSendMessage: Event<ProtocolMessage> = () => {
        return {
            dispose: () => undefined,
        };
    };

    /**
     * Handle a Debug Adapter Protocol message.
     * Messages can be requests, responses, or events.
     * Results or errors are returned via onSendMessage events.
     * @param message A Debug Adapter Protocol message.
     * @implements {DebugAdapter}
     */
    handleMessage(message: ProtocolMessage): void {
        if (message.command === "disconnect") {
            void this.stopDebugging();
        } else if (message.command === "initialize") {
            void this.browserManager.launch();
        }
    }

    /**
     * Starts the debugging session by attaching the 'pwa-msedge' debugger to the browser started by {@link BrowserManager}.
     * @param retryCount The number of times to retry starting the debug session if it fails.
     */
    public async attachEdgeDebugger(
        retryCount: number = defaultDebuggingRetryCount
    ): Promise<void> {
        if (this.isDisposed) {
            throw new Error("Debugger is disposed");
        }

        // don't restart the debug session if it is already running
        if (this.hasAttachedDebuggerSession) {
            return;
        }

        this.logger.sendTelemetryEvent("Debugger.attachEdgeDebugger", {
            running: "" + this.isRunning,
            retryCount: `${retryCount}`,
        });
        const activeSession = debug.activeDebugSession;
        if (activeSession && this.isRunning) {
            this.onDebugSessionStarted(activeSession);
            return;
        }

        const edgeDebugConfig: DebugConfiguration = {
            type: "pwa-msedge",
            name: `EDGE ${this.debugConfig.name}`,
            request: "attach",
            webRoot: this.debugConfig.webRoot,
            port: this.debugConfig.port,
        };

        let success: boolean;
        try {
            success = await debug.startDebugging(
                this.workspaceFolder,
                edgeDebugConfig,
                this.parentSession
            );
        } catch (error) {
            await ErrorReporter.report(
                this.logger,
                "Debugger.startDebugging.error",
                error,
                "Exception starting debug session",
                false
            );
            success = false;
        }

        if (!success) {
            await this.handleStartDebuggingNonSuccess(retryCount);
        } else {
            this.logger.sendTelemetryEvent(
                "Debugger.attachEdgeDebugger.success",
                { running: "" + this.isRunning, retryCount: `${retryCount}` }
            );
            this.startDebugTimeout = undefined;
        }
    }

    /**
     * Handles a failure to attach the debugger with retries.
     * @param retryCount The number of times to retry starting the debug session if it fails.
     */
    private async handleStartDebuggingNonSuccess(
        retryCount?: number
    ): Promise<void> {
        await ErrorReporter.report(
            this.logger,
            "Debugger.handleStartDebuggingNonSuccess",
            undefined,
            "Could not start debugging session. Retrying",
            false,
            {
                retryCount: `${retryCount}` ?? "undefined",
            }
        );

        if (retryCount !== undefined && retryCount > 0) {
            await sleep(1000);
            await this.attachEdgeDebugger(retryCount - 1);
        } else {
            await ErrorReporter.report(
                this.logger,
                "Debugger.handleStartDebuggingNonSuccess.noRetry",
                undefined,
                "Could not start debugging session.",
                true,
                {
                    retryCount: `${retryCount}` ?? "undefined",
                }
            );
        }
    }

    /**
     * Callback for when the debug session starts.
     * @param edgeDebugSession The debug session that has started by attaching the 'pwa-msedge' debugger.
     */
    private onDebugSessionStarted(edgeDebugSession: DebugSession): void {
        // don't start the debug session if it is already running
        if (this.isRunning && this.hasAttachedDebuggerSession) {
            return;
        }

        this.edgeDebugSession = edgeDebugSession;
        this.debugSessionTerminatedDisposable =
            debug.onDidTerminateDebugSession((session) =>
                this.onDebugSessionStopped(session)
            );

        this.logger.sendTelemetryEvent("Debugger.onDebugSessionStarted", {
            edgeDebugSessionId: this.edgeDebugSession?.id || "undefined",
            parentSessionId: this.parentSession.id || "undefined",
        });
    }

    /**
     * Stops the debugging session.
     */
    public async stopDebugging(): Promise<void> {
        this.logger.sendTelemetryEvent("debugger.stopDebugging", {
            sessionId: this.edgeDebugSession?.id || "undefined",
        });
        if (this.hasAttachedDebuggerSession || this.isRunning) {
            // remove the onDebugStopped callback to prevent closing the browser
            // when the debug session is stopped
            await debug.stopDebugging(this.edgeDebugSession);
            await debug.stopDebugging(this.parentSession);
        }

        this.dispose();
    }

    /**
     * Callback for when the debug session stops.
     * @param session The debug session that has stopped.
     */
    private onDebugSessionStopped(session: DebugSession): void {
        // Stop the debug session if after four seconds the session is stopped.
        setTimeout(() => {
            if (this.isRunning) {
                return;
            }
            void this.logger.sendTelemetryEvent(
                "debugger.onDebugSessionStopped.stopped",
                {
                    sessionId: session.id,
                }
            );

            this.dispose();
        }, 4000);
    }

    /**
     * Disposes the debugger.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        if (this.startDebugTimeout) {
            clearTimeout(this.startDebugTimeout);
            this.startDebugTimeout = undefined;
        }

        if (this.startDebuggingDisposable) {
            this.startDebuggingDisposable.dispose();
            this.startDebuggingDisposable = undefined;
        }

        if (this.debugSessionTerminatedDisposable) {
            this.debugSessionTerminatedDisposable.dispose();
            this.debugSessionTerminatedDisposable = undefined;
        }

        if (this.browserManager) {
            this.browserManager.dispose();
        }

        this.edgeDebugSession = undefined;
    }
}
