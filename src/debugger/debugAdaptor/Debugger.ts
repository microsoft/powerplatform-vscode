/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
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
import { ErrorReporter } from "../../common/ErrorReporter";

import { BrowserManager } from "../browser";
import { IPcfLaunchConfig } from "../configuration/types/IPcfLaunchConfig";
import { sleep } from "../utils";

import { ProtocolMessage } from "./DebugProtocolMessage";
import { oneDSLoggerWrapper } from "../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";

/**
 * The default number of retries to attach the debugger.
 */
const DEFAULT_DEBUGGING_RETRY_COUNT = 3;

/**
 * The default delay in ms after which to retry the attach to the debugger.
 */
const DEFAULT_DEBUGGING_RETRY_DELAY = 1000;

/**
 * Time after which to dispose the debugger if the parent session was terminated.
 */
const DEFAULT_DEBUGGING_DISPOSE_TIMEOUT = 4000;

/**
 * Control debugger that controls the msedge debug session.
 */
export class Debugger implements Disposable, DebugAdapter {
    private readonly debugConfig: IPcfLaunchConfig;
    private edgeDebugSession?: DebugSession;
    private startDebuggingDisposable?: Disposable;
    private debugSessionTerminatedDisposable?: Disposable;
    public isDisposed = false;

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
     * @param parentSession The parent {@link DebugSession debug session} that was started by the user.
     * @param workspaceFolder The workspace folder to use for debugging.
     * @param logger The telemetry reporter to use for telemetry.
     * @param debuggingRetryCount The number of times to retry starting the debug session if it fails.
     * @param debuggingRetryDelay The delay in ms after which to retry starting the debug session.
     */
    constructor(
        private readonly browserManager: BrowserManager,
        private readonly parentSession: DebugSession,
        private readonly workspaceFolder: WorkspaceFolder,
        private readonly debuggingRetryCount: number = DEFAULT_DEBUGGING_RETRY_COUNT,
        private readonly debuggingRetryDelay: number = DEFAULT_DEBUGGING_RETRY_DELAY,
        private readonly debuggingDisposeTimeout: number = DEFAULT_DEBUGGING_DISPOSE_TIMEOUT
    ) {
        this.debugConfig = parentSession.configuration as IPcfLaunchConfig;
        this.browserManager.registerOnBrowserClose(async () => {
            this.stopDebugging();
        });
        this.browserManager.registerOnBrowserReady(async () => {
            this.attachEdgeDebugger();
        });

        this.startDebuggingDisposable = debug.onDidStartDebugSession(
            (session) => this.onDebugSessionStarted(session)
        );
    }

    /**
     * An event which fires after the debug adapter has sent a Debug Adapter Protocol message to the editor.
     * Messages can be requests, responses, or events.
     *
     * *This debugger does not send messages to the editor, hence why subscribing is not supported*.
     * @implements + {@link DebugAdapter.onDidSendMessage}
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
     * @implements + {@link DebugAdapter.handleMessage}
     */
    handleMessage(message: ProtocolMessage): void {
        switch (message.command) {
            case "disconnect":
                void this.stopDebugging();
                break;
            case "initialize":
                void this.browserManagerLaunch();
                break;
        }
    }

    /**
     * Asynchronously starts the browser manager so that the debugger can be attached when the bundle has been intercepted.
     * The browser manager will then call {@link attachEdgeDebugger} through the {@link BrowserManager.onBrowserReady onBrowserReady} event.
     */
    private async browserManagerLaunch() {
        try {
            await this.browserManager.launch();
        } catch (error) {
            await this.stopDebugging();
        }
    }

    /**
     * Starts the debugging session by attaching the 'pwa-msedge' debugger to the browser started by {@link BrowserManager}.
     * @param retryCount The number of times to retry starting the debug session if it fails.
     */
    public async attachEdgeDebugger(
        retryCount: number = this.debuggingRetryCount
    ): Promise<void> {
        if (this.isDisposed) {
            throw new Error("Debugger is disposed");
        }

        // don't restart the debug session if it is already running
        if (this.hasAttachedDebuggerSession) {
            return;
        }

        oneDSLoggerWrapper.getLogger().traceInfo("Debugger.attachEdgeDebugger", {
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
            name: `edge ${this.debugConfig.name}`,
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
                "Debugger.startDebugging.error",
                error,
                "Exception starting debug session",
                false
            );
            success = false;
        }

        if (success) {
            oneDSLoggerWrapper.getLogger().traceInfo(
                "Debugger.attachEdgeDebugger.success",
                { running: "" + this.isRunning, retryCount: `${retryCount}` }
            );
        } else {
            await this.handleStartDebuggingNonSuccess(retryCount);
        }
    }

    /**
     * Handles a failure to attach the debugger with retries.
     * @param retryCount The number of times to retry starting the debug session if it fails.
     */
    private async handleStartDebuggingNonSuccess(
        retryCount: number
    ): Promise<void> {
        await ErrorReporter.report(
            "Debugger.handleStartDebuggingNonSuccess",
            undefined,
            "Could not start debugging session. Retrying",
            false,
            {
                retryCount: `${retryCount}` ?? "undefined",
            }
        );

        if (retryCount > 0) {
            await sleep(this.debuggingRetryDelay);
            await this.attachEdgeDebugger(retryCount - 1);
        } else {
            void ErrorReporter.report(
                "Debugger.handleStartDebuggingNonSuccess.noRetry",
                undefined,
                "Could not start debugging session.",
                true,
                {
                    retryCount:
                        `${retryCount}/${this.debuggingRetryCount}` ??
                        "undefined",
                }
            );
        }
    }

    /**
     * Callback called by {@link debug.onDidStartDebugSession} when the debug session has successfully started.
     * @param edgeDebugSession The {@link DebugSession debug session} that has started by attaching the 'pwa-msedge' debugger.
     */
    private onDebugSessionStarted(edgeDebugSession: DebugSession): void {
        // don't start the debug session if it is already running
        if (this.isRunning && this.hasAttachedDebuggerSession) {
            return;
        }

        this.edgeDebugSession = edgeDebugSession;
        this.debugSessionTerminatedDisposable =
            debug.onDidTerminateDebugSession(
                (session) => void this.onDebugSessionStopped(session)
            );

        oneDSLoggerWrapper.getLogger().traceInfo("Debugger.onDebugSessionStarted", {
            edgeDebugSessionId: this.edgeDebugSession?.id || "undefined",
            parentSessionId: this.parentSession.id || "undefined",
        });
    }

    /**
     * Stops the debugging session.
     */
    public async stopDebugging(): Promise<void> {
        oneDSLoggerWrapper.getLogger().traceInfo("debugger.stopDebugging", {
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
     * Callback called by {@link debug.onDidTerminateDebugSession} for when vscode terminates the debug session.
     * @param session The {@link DebugSession debug session} that has stopped.
     */
    private async onDebugSessionStopped(session: DebugSession): Promise<void> {
        // Disposes the debugger if it the parent session is stopped after 4 seconds.
        this.debuggingDisposeTimeout > 0 &&
            (await sleep(this.debuggingDisposeTimeout));
        if (this.isRunning) {
            return;
        }
        oneDSLoggerWrapper.getLogger().traceInfo(
            "debugger.onDebugSessionStopped.stopped",
            {
                sessionId: session.id,
            }
        );

        this.dispose();
    }

    /**
     * Disposes the debugger.
     */
    dispose() {
        if (this.isDisposed) {
            return;
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
        this.isDisposed = true;
    }
}
