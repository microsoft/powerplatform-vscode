/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import TelemetryReporter from "@vscode/extension-telemetry";
import * as path from "path";
import * as vscode from "vscode";
import { AppTelemetryConfigUtility } from "../common/pp-tooling-telemetry-node";
import { vscodeExtAppInsightsResourceProvider } from "../common/telemetry-generated/telemetryConfiguration";
import { ITelemetryData } from "../common/TelemetryData";
import { CliAcquisition, ICliAcquisitionContext } from "./lib/CliAcquisition";
import { PacTerminal } from "./lib/PacTerminal";
import { PortalWebView } from "./PortalWebView";
import { ITelemetry } from "./telemetry/ITelemetry";

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
    WorkspaceFolder,
} from "vscode-languageclient/node";
import { workspaceContainsPortalConfigFolder } from "../common/PortalConfigFinder";
import {
    activateDebugger,
    deactivateDebugger,
    shouldEnableDebugger,
} from "../debugger";
import { handleFileSystemCallbacks } from "./power-pages/fileSystemCallbacks";
import { readUserSettings } from "./telemetry/localfileusersettings";
import { initializeGenerator } from "./power-pages/create/CreateCommandWrapper";
import { disposeDiagnostics } from "./power-pages/validationDiagnostics";
import { PowerPagesCopilot } from "./../common/copilot/PowerPagesCopilot";
import { bootstrapDiff } from "./power-pages/bootstrapdiff/BootstrapDiff";

let client: LanguageClient;
let _context: vscode.ExtensionContext;
let htmlServerRunning = false;
let yamlServerRunning = false;
let _telemetry: TelemetryReporter;


export async function activate(
    context: vscode.ExtensionContext
): Promise<void> {
    _context = context;

    // setup telemetry
    const telemetryEnv =
        AppTelemetryConfigUtility.createGlobalTelemetryEnvironment();
    const appInsightsResource =
        vscodeExtAppInsightsResourceProvider.GetAppInsightsResourceForDataBoundary(
            telemetryEnv.dataBoundary
        );
    _telemetry = new TelemetryReporter(
        context.extension.id,
        context.extension.packageJSON.version,
        appInsightsResource.instrumentationKey
    );
    context.subscriptions.push(_telemetry);
    _telemetry.sendTelemetryEvent("Start", {
        "pac.userId": readUserSettings().uniqueId,
    });

    // Setup context switches
    if (
        vscode.env.remoteName === undefined ||
        vscode.env.remoteName === "wsl"
    ) {
        // PAC Interactive Login works when we are the UI is running on the same machine
        // as the extension (i.e. NOT remote), or the remote is WSL
        vscode.commands.executeCommand(
            "setContext",
            "pacCLI.authPanel.interactiveLoginSupported",
            true
        );
    } else {
        _context.environmentVariableCollection.replace(
            "PAC_CLI_INTERACTIVE_AUTH_NOT_AVAILABLE",
            "true"
        );
    }

    vscode.workspace.onDidOpenTextDocument(didOpenTextDocument);
    vscode.workspace.textDocuments.forEach(didOpenTextDocument);

    // portal web view panel
    _context.subscriptions.push(
        vscode.commands.registerCommand(
            "microsoft-powerapps-portals.preview-show",
            () => {
                _telemetry.sendTelemetryEvent("StartCommand", {
                    commandId: "microsoft-powerapps-portals.preview-show",
                });
                PortalWebView.createOrShow();
            }
        )
    );

    // registering bootstrapdiff command
    _context.subscriptions.push(
        vscode.commands.registerCommand('microsoft-powerapps-portals.bootstrap-diff', async() => {
                _telemetry.sendTelemetryEvent("StartCommand", {
                    commandId: "microsoft-powerapps-portals.bootstrap-diff",
                });
                bootstrapDiff();
            }
        )
    );

    _context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(() => {
            if (vscode.window.activeTextEditor === undefined) {
                return;
            } else if (
                !isCurrentDocumentEdited() &&
                PortalWebView.checkDocumentIsHTML()
            ) {
                if (PortalWebView?.currentPanel) {
                    _telemetry.sendTelemetryEvent("PortalWebPagePreview", {
                        page: "NewPage",
                    });
                    PortalWebView?.currentPanel?._update();
                }
            }
        })
    );
    _context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(() => {
            if (vscode.window.activeTextEditor === undefined) {
                return;
            } else if (isCurrentDocumentEdited()) {
                if (PortalWebView?.currentPanel) {
                    _telemetry.sendTelemetryEvent("PortalWebPagePreview", {
                        page: "ExistingPage",
                    });
                    PortalWebView?.currentPanel?._update();
                }
            }
        })
    );

    if (vscode.window.registerWebviewPanelSerializer) {
        vscode.window.registerWebviewPanelSerializer(PortalWebView.viewType, {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel) {
                PortalWebView.revive(webviewPanel);
            },
        });
    }

    // Add CRUD related callback subscription here
    await handleFileSystemCallbacks(_context, _telemetry);

    const cliContext = new CliAcquisitionContext(_context, _telemetry);
    const cli = new CliAcquisition(cliContext);
    const cliPath = await cli.ensureInstalled();
    _context.subscriptions.push(cli);
    _context.subscriptions.push(new PacTerminal(_context, _telemetry, cliPath));
    const workspaceFolders =
        vscode.workspace.workspaceFolders?.map(
            (fl) => ({ ...fl, uri: fl.uri.fsPath } as WorkspaceFolder)
        ) || [];
    
    // TODO: Handle for VSCode.dev also
    if (workspaceContainsPortalConfigFolder(workspaceFolders)) { 
        vscode.commands.executeCommand('setContext', 'powerpages.websiteYmlExists', true);
        initializeGenerator(_context, cliContext, _telemetry); // Showing the create command only if website.yml exists
    }
    else {
        vscode.commands.executeCommand('setContext', 'powerpages.websiteYmlExists', false);
    }

    const workspaceFolderWatcher = vscode.workspace.onDidChangeWorkspaceFolders(handleWorkspaceFolderChange);
    _context.subscriptions.push(workspaceFolderWatcher);

    if (shouldEnableDebugger()) {
        activateDebugger(context, _telemetry);
    }

    _telemetry.sendTelemetryEvent("activated");

    const copilotProvider = new PowerPagesCopilot(context.extensionUri);

    _context.subscriptions.push(vscode.window.registerWebviewViewProvider('powerpages.copilot', copilotProvider, {
        webviewOptions: {
            retainContextWhenHidden: true,
        },
    }));
}

export async function deactivate(): Promise<void> {
    if (_telemetry) {
        _telemetry.sendTelemetryEvent("End");

        // dispose() will flush any events not sent
        // Note, while dispose() returns a promise, we don't await it so that we can unblock the rest of unloading logic
        _telemetry.dispose();
    }

    if (client) {
        await client.stop();
    }

    disposeDiagnostics();
    deactivateDebugger();
}

function didOpenTextDocument(document: vscode.TextDocument): void {
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    const debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

    if (document.languageId === "yaml" && !yamlServerRunning) {
        // The server is implemented in node
        const serverModule = _context.asAbsolutePath(
            path.join("dist", "yamlServer.js")
        );

        // If the extension is launched in debug mode then the debug server options are used
        // Otherwise the run options are used
        const serverOptions: ServerOptions = {
            run: { module: serverModule, transport: TransportKind.ipc },
            debug: {
                module: serverModule,
                transport: TransportKind.ipc,
                options: debugOptions,
            },
        };

        // Options to control the language client
        const clientOptions: LanguageClientOptions = {
            // Register the server for yaml documents
            documentSelector: [{ scheme: "file", language: "yaml" }],
            synchronize: {
                // Notify the server about file changes to '.clientrc files contained in the workspace
                fileEvents:
                    vscode.workspace.createFileSystemWatcher("**/.clientrc"),
            },
        };

        // Create the language client and start the client.
        client = new LanguageClient(
            "PowerappsYamlLanguageServer",
            "PowerApps Yaml Language Server",
            serverOptions,
            clientOptions
        );

        // Start the client. This will also launch the server
        const disposable = client.start();
        if (disposable) {
            yamlServerRunning = true;
            _context.subscriptions.push(disposable);
        }

        // this is used to send yamlServer telemetry events
        registerClientToReceiveNotifications(client);
    } else if (document.languageId === "html" && !htmlServerRunning) {
        // The server is implemented in node
        const serverModule = _context.asAbsolutePath(
            path.join("dist", "htmlServer.js")
        );
        // If the extension is launched in debug mode then the debug server options are used
        // Otherwise the run options are used
        const serverOptions: ServerOptions = {
            run: { module: serverModule, transport: TransportKind.ipc },
            debug: {
                module: serverModule,
                transport: TransportKind.ipc,
                options: debugOptions,
            },
        };

        // Options to control the language client
        const clientOptions: LanguageClientOptions = {
            // Register the server for yaml documents
            documentSelector: [{ scheme: "file", language: "html" }],
            synchronize: {
                // Notify the server about file changes to '.clientrc files contained in the workspace
                fileEvents:
                    vscode.workspace.createFileSystemWatcher("**/.clientrc"),
            },
        };

        // Create the language client and start the client.
        client = new LanguageClient(
            "PowerappsHtmlLanguageServer",
            "PowerApps Html Language Server",
            serverOptions,
            clientOptions
        );

        // Start the client. This will also launch the server
        const disposable = client.start();
        if (disposable) {
            htmlServerRunning = true;
            _context.subscriptions.push(disposable);
        }

        // this is used to send HtmlServer telemetry events
        registerClientToReceiveNotifications(client);
    }
}

function registerClientToReceiveNotifications(client: LanguageClient) {
    client.onReady().then(() => {
        client.onNotification("telemetry/event", (payload: string) => {
            const serverTelemetry = JSON.parse(payload) as ITelemetryData;
            if (!!serverTelemetry && !!serverTelemetry.eventName) {
                _telemetry.sendTelemetryEvent(
                    serverTelemetry.eventName,
                    serverTelemetry.properties,
                    serverTelemetry.measurements
                );
            }
        });
    });
}

function isCurrentDocumentEdited(): boolean {
    const workspaceFolderExists =
        vscode.workspace.workspaceFolders !== undefined;
    let currentPanelExists = false;
    if (PortalWebView?.currentPanel) {
        currentPanelExists = true;
    }
    return (
        workspaceFolderExists &&
        currentPanelExists &&
        PortalWebView.currentDocument ===
        vscode?.window?.activeTextEditor?.document?.fileName
    );
}

function handleWorkspaceFolderChange() {
    const workspaceFolders =
        vscode.workspace.workspaceFolders?.map(
            (fl) => ({ ...fl, uri: fl.uri.fsPath } as WorkspaceFolder)
        ) || [];
    if (workspaceContainsPortalConfigFolder(workspaceFolders)) {
        vscode.commands.executeCommand('setContext', 'powerpages.websiteYmlExists', true);
    }
    else {
        vscode.commands.executeCommand('setContext', 'powerpages.websiteYmlExists', false);
    }
}
// allow for DI without direct reference to vscode's d.ts file: that definintions file is being generated at VS Code runtime
class CliAcquisitionContext implements ICliAcquisitionContext {
    public constructor(
        private readonly _context: vscode.ExtensionContext,
        private readonly _telemetry: ITelemetry
    ) { }

    public get extensionPath(): string {
        return this._context.extensionPath;
    }
    public get globalStorageLocalPath(): string {
        return this._context.globalStorageUri.fsPath;
    }
    public get telemetry(): ITelemetry {
        return this._telemetry;
    }

    showInformationMessage(message: string, ...items: string[]): void {
        vscode.window.showInformationMessage(message, ...items);
    }

    showErrorMessage(message: string, ...items: string[]): void {
        vscode.window.showErrorMessage(message, ...items);
    }

    showCliPreparingMessage(version: string): void {
        vscode.window.showInformationMessage(
            vscode.l10n.t({
                message: "Preparing pac CLI (v{0})...",
                args: [version],
                comment: ["{0} represents the version number"]
            })
        );
    }

    showCliReadyMessage(): void {
        vscode.window.showInformationMessage(
            vscode.l10n.t('The pac CLI is ready for use in your VS Code terminal!'));
    }

    showCliInstallFailedError(err: string): void {
        vscode.window.showErrorMessage(
            vscode.l10n.t({
                message: "Cannot install pac CLI: {0}",
                args: [err],
                comment: ["{0} represents the error message returned from the exception"]
            })
        );
    }

    showGeneratorInstallingMessage(version: string): void {
        vscode.window.showInformationMessage(
            vscode.l10n.t({
                message: "Installing Power Pages generator(v{0})...",
                args: [version],
                comment: ["{0} represents the version number"]
            }))
    }

    locDotnetNotInstalledOrInsufficient(): string {
        return vscode.l10n.t({
            message: "dotnet sdk 6.0 or greater must be installed",
            comment: ["Do not translate 'dotnet' or 'sdk'"]
        });
    }
}
