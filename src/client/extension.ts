// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from "vscode";
import TelemetryReporter from 'vscode-extension-telemetry';
import { createTelemetryReporter } from './telemetry/configuration';
import { CliAcquisition, ICliAcquisitionContext } from "./lib/CliAcquisition";
import { PacTerminal } from "./lib/PacTerminal";
import * as path from "path";
import { PortalWebView } from './PortalWebView';
import { AI_KEY } from './constants';
import { v4 } from 'uuid';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
} from "vscode-languageclient/node";
import TelemetryClient from "../common/telemetry/TelemetryClient";
import TelemetryReporterChannel from "./telemetry/TelemetryReporterChannel";
import { registerClientToReceiveTelemetryChannelNotifications } from "./telemetry/ClientTelemetryNotifications";

let client: LanguageClient;
let _context: vscode.ExtensionContext;
let htmlServerRunning = false;
let yamlServerRunning = false;

let _telemetryReporter: TelemetryReporter;
let telemetryClient: TelemetryClient;

export async function activate(
    context: vscode.ExtensionContext
): Promise<void> {
    _context = context;

    // setup telemetry
    const sessionId = v4();
    _telemetryReporter = createTelemetryReporter('powerplatform-vscode', context, AI_KEY, sessionId);
    context.subscriptions.push(_telemetryReporter);
    telemetryClient = new TelemetryClient(new TelemetryReporterChannel(_telemetryReporter));
    telemetryClient.trackEvent({ name: "Start" });

    vscode.workspace.onDidOpenTextDocument(didOpenTextDocument);
    vscode.workspace.textDocuments.forEach(didOpenTextDocument);

    // portal web view panel
    _context.subscriptions.push(
        vscode.commands.registerCommand(
            "microsoft-powerapps-portals.preview-show",
            () => {
                telemetryClient.trackStartCommandEvent('microsoft-powerapps-portals.preview-show');
                PortalWebView.createOrShow(_context);
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
                    telemetryClient.trackEvent('PortalWebPagePreview', { page: 'NewPage' });
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
                    telemetryClient.trackEvent('PortalWebPagePreview', { page: 'ExistingPage' });
                    PortalWebView?.currentPanel?._update();
                }
            }
        })
    );

    if (vscode.window.registerWebviewPanelSerializer) {
        vscode.window.registerWebviewPanelSerializer(
            PortalWebView.viewType,
            {
                async deserializeWebviewPanel(
                    webviewPanel: vscode.WebviewPanel
                ) {
                    PortalWebView.revive(
                        webviewPanel,
                        _context.extensionUri
                    );
                },
            }
        );
    }

    const cli = new CliAcquisition(new CliAcquisitionContext(_context, telemetryClient));
    const cliPath = await cli.ensureInstalled();
    _context.subscriptions.push(cli);
    _context.subscriptions.push(new PacTerminal(_context, cliPath));

    telemetryClient.trackEvent("activated");
}

export async function deactivate(): Promise<void> {
    telemetryClient?.trackEvent("End");
    if (_telemetryReporter) {
        // dispose() will flush any events not sent
        // Note, while dispose() returns a promise, we don't await it so that we can unblock the rest of unloading logic
        _telemetryReporter.dispose();
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

        registerClientToReceiveTelemetryChannelNotifications(client, telemetryClient);
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

        registerClientToReceiveTelemetryChannelNotifications(client, telemetryClient);
    }

}

function isCurrentDocumentEdited(): boolean {
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
        private readonly _telemetryClient: TelemetryClient) {
    }

    public get extensionPath(): string { return this._context.extensionPath; }
    public get globalStorageLocalPath(): string { return this._context.globalStorageUri.fsPath; }
    public get telemetryClient(): TelemetryClient { return this._telemetryClient; }

    showInformationMessage(message: string, ...items: string[]): void {
        vscode.window.showInformationMessage(message, ...items);
    }
    showErrorMessage(message: string, ...items: string[]): void {
        vscode.window.showErrorMessage(message, ...items);
    }
}
