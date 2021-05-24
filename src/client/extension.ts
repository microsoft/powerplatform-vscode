// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from "vscode";
import { CliAcquisition, ICliAcquisitionContext } from "./lib/CliAcquisition";
import { PacTerminal } from "./lib/PacTerminal";
import * as path from "path";
import { PortalWebView } from './PortalWebView';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient;

export async function activate(
    context: vscode.ExtensionContext
): Promise<void> {
    const isPaportalFeatureEnabled = vscode.workspace
        .getConfiguration("powerplatform-vscode")
        .get("enablePortalFeatures");
    if (isPaportalFeatureEnabled) {
        // add  portal specific features in this block

        let htmlServerRunning = false;
        let yamlServerRunning = false;
        // The debug options for the server
        // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
        const debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

        function didOpenTextDocument(document: vscode.TextDocument): void {

            if (document.languageId === 'yaml' && !yamlServerRunning) {

                // The server is implemented in node
                const serverModule = context.asAbsolutePath(
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
                    context.subscriptions.push(disposable);
                }
            } else if (document.languageId === 'html' && !htmlServerRunning) {

                // The server is implemented in node
                const serverModule = context.asAbsolutePath(
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
                    context.subscriptions.push(disposable);
                }
            }

        }

        vscode.workspace.onDidOpenTextDocument(didOpenTextDocument);
        vscode.workspace.textDocuments.forEach(didOpenTextDocument);

        // portal web view panel
        context.subscriptions.push(
            vscode.commands.registerCommand(
                "microsoft-powerapps-portals.preview-show",
                () => {
                    PortalWebView.createOrShow(context);
                }
            )
        );

        context.subscriptions.push(
            vscode.workspace.onDidOpenTextDocument(() => {
                if (vscode.window.activeTextEditor === undefined) {
                    return;
                } else if (
                    vscode.workspace.workspaceFolders !== undefined &&
                    PortalWebView.currentPanel &&
                    PortalWebView.currentDocument !==
                    vscode.window.activeTextEditor.document.fileName &&
                    PortalWebView.checkDocumentIsHTML()
                ) {
                    PortalWebView.currentPanel._update();
                }
            })
        );
        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument(() => {
                if (vscode.window.activeTextEditor === undefined) {
                    return;
                } else if (
                    vscode.workspace.workspaceFolders !== undefined &&
                    PortalWebView.currentPanel &&
                    PortalWebView.currentDocument ===
                    vscode.window.activeTextEditor.document.fileName
                ) {
                    PortalWebView.currentPanel._update();
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
                            context.extensionUri
                        );
                    },
                }
            );
        }
    }

    const cli = new CliAcquisition(new CliAcquisitionContext(context));
    const cliPath = await cli.ensureInstalled();
    context.subscriptions.push(cli);
    context.subscriptions.push(new PacTerminal(context, cliPath));
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

class CliAcquisitionContext implements ICliAcquisitionContext {
    private readonly _context: vscode.ExtensionContext;

    public constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    public get extensionPath(): string { return this._context.extensionPath; }
    public get globalStorageLocalPath(): string { return this._context.globalStorageUri.fsPath; }

    showInformationMessage(message: string, ...items: string[]): void {
        vscode.window.showInformationMessage(message, ...items);
    }
    showErrorMessage(message: string, ...items: string[]): void {
        vscode.window.showErrorMessage(message, ...items);
    }
}
