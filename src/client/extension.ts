// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from "vscode";
import TelemetryReporter from 'vscode-extension-telemetry';
import { ITelemetry } from './telemetry/ITelemetry';
import { createTelemetryReporter } from './telemetry/configuration';
import { CliAcquisition, ICliAcquisitionContext } from "./lib/CliAcquisition";
import { PacTerminal } from "./lib/PacTerminal";
import * as path from "path";
import { PortalWebView } from './PortalWebView';
import { AI_KEY } from './constants';
import { v4 } from 'uuid';
import { ITelemetryData } from "../common/TelemetryData";

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient;
let _context: vscode.ExtensionContext;
let htmlServerRunning = false;
let yamlServerRunning = false;
let _telemetry: TelemetryReporter;

export async function activate(
    context: vscode.ExtensionContext
): Promise<void> {
    _context = context;

    // Extension only supports Desktop UI installs currently
    // const extension = vscode.extensions.getExtension('microsoft-IsvExpTools.powerplatform-vscode');
    // if (extension && extension.extensionKind !== vscode.ExtensionKind.UI) {
    //     vscode.window.showErrorMessage("The PowerPlatform Extension does not currently support remote installations.");
    //     return;
    // }
    // if (vscode.env.uiKind !== vscode.UIKind.Desktop) {
    //     vscode.window.showErrorMessage("The PowerPlatform Extension does not currently support Web UI.");
    //     return;
    // }

    // setup telemetry
    const sessionId = v4();
    _telemetry = createTelemetryReporter('powerplatform-vscode', context, AI_KEY, sessionId);
    context.subscriptions.push(_telemetry);
    _telemetry.sendTelemetryEvent("Start");

    vscode.workspace.onDidOpenTextDocument(didOpenTextDocument);
    vscode.workspace.textDocuments.forEach(didOpenTextDocument);

    // portal web view panel
    _context.subscriptions.push(
        vscode.commands.registerCommand(
            "microsoft-powerapps-portals.preview-show",
            () => {
                _telemetry.sendTelemetryEvent('StartCommand', {'commandId': 'microsoft-powerapps-portals.preview-show'});
                PortalWebView.createOrShow();
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
                if ( PortalWebView?.currentPanel) {
                    _telemetry.sendTelemetryEvent('PortalWebPagePreview', { page: 'NewPage' });
                    PortalWebView?.currentPanel?._update();
                }
            }
        })
    );
    _context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(() => {
            if (vscode.window.activeTextEditor === undefined) {
                return;
            } else if (
                isCurrentDocumentEdited()
            ) {
                if (PortalWebView?.currentPanel) {
                    _telemetry.sendTelemetryEvent('PortalWebPagePreview', { page: 'ExistingPage' });
                    PortalWebView?.currentPanel?._update();
                }
            }
        })
    );

    if (vscode.window.registerWebviewPanelSerializer) {
        vscode.window.registerWebviewPanelSerializer(
            PortalWebView.viewType,
            {
                async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel) {
                    PortalWebView.revive(webviewPanel);
                },
            }
        );
    }

    // Only register the server-side commands if either
    // 1) UI and Server are running at the same place (vscode.env.remoteName === undefined)
    // 2) we are on the server side of a split extension (vscode.ExtensionKind === workspace)
    const extension = vscode.extensions.getExtension('microsoft-IsvExpTools.powerplatform-vscode');
    const crashDebug = vscode.window.createOutputChannel("CrashDebug");
    crashDebug.show();
    crashDebug.appendLine(`Remote Name: ${vscode.env.remoteName}`);
    crashDebug.appendLine(`Extension Kind: ${extension?.extensionKind}`);
    if (vscode.env.remoteName === undefined || extension && extension.extensionKind !== vscode.ExtensionKind.UI) {
        crashDebug.appendLine(`CLI Acquire - start`);
        const cli = new CliAcquisition(new CliAcquisitionContext(_context, _telemetry, crashDebug));
        crashDebug.appendLine(`CLI Acquire - constructor finished`);
        const cliPath = await cli.ensureInstalled();
        crashDebug.appendLine(`CLI Acquire - ensure installed finished`);
        _context.subscriptions.push(cli);
        _context.subscriptions.push(new PacTerminal(_context, _telemetry, cliPath));
    }

    _telemetry.sendTelemetryEvent("activated");
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
}

function didOpenTextDocument(document: vscode.TextDocument): void {

    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    const debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };


    if (document.languageId === 'yaml' && !yamlServerRunning) {

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
                fileEvents: vscode.workspace.createFileSystemWatcher(
                    "**/.clientrc"
                ),
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
    } else if (document.languageId === 'html' && !htmlServerRunning) {

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
                fileEvents: vscode.workspace.createFileSystemWatcher(
                    "**/.clientrc"
                ),
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

        // this is used to send htmlServer telemetry events
        registerClientToReceiveNotifications(client);
    }

}

function registerClientToReceiveNotifications(client: LanguageClient) {
    client.onReady().then(() => {
        client.onNotification("telemetry/event", (payload: string) => {
            const serverTelemetry = JSON.parse(payload) as ITelemetryData ;
            if(!!serverTelemetry && !!serverTelemetry.eventName) {
                _telemetry.sendTelemetryEvent(serverTelemetry.eventName, serverTelemetry.properties, serverTelemetry.measurements);
            }
        });
    });
}

function isCurrentDocumentEdited() : boolean{
    const workspaceFolderExists = vscode.workspace.workspaceFolders !== undefined;
    let currentPanelExists = false;
    if (PortalWebView?.currentPanel) {
        currentPanelExists = true;
    }
    return (workspaceFolderExists && currentPanelExists && PortalWebView.currentDocument === vscode?.window?.activeTextEditor?.document?.fileName);
}

class CliAcquisitionContext implements ICliAcquisitionContext {
    public constructor(
        private readonly _context: vscode.ExtensionContext,
        private readonly _telemetry: ITelemetry,
        public readonly debugOutputChannel: vscode.OutputChannel) {
    }

    public get extensionPath(): string { return this._context.extensionPath; }
    public get globalStorageLocalPath(): string { return this._context.globalStorageUri.fsPath; }
    public get telemetry(): ITelemetry { return this._telemetry; }

    showInformationMessage(message: string, ...items: string[]): void {
        vscode.window.showInformationMessage(message, ...items);
        this.debugOutputChannel.appendLine(message);
    }
    showErrorMessage(message: string, ...items: string[]): void {
        vscode.window.showErrorMessage(message, ...items);
        this.debugOutputChannel.appendLine(message);
    }
}
