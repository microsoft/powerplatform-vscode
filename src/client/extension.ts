// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from "vscode";
import { CliAcquisition } from "./lib/CliAcquisition";
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
    // The server is implemented in node
    const serverModule = context.asAbsolutePath(
        path.join("dist", "server.js")
    );
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    const debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

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
        // Register the server for plain text documents
        documentSelector: [{ scheme: "file", language: "plaintext" }],
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: vscode.workspace.createFileSystemWatcher(
                "**/.clientrc"
            ),
        },
    };

    // Create the language client and start the client.
    client = new LanguageClient(
        "languageServerExample",
        "Language Server Example",
        serverOptions,
        clientOptions
    );

    // Start the client. This will also launch the server
    client.start();

    const isPaportalFeatureEnabled = vscode.workspace
        .getConfiguration("powerplatform-vscode")
        .get("enablePortalFeatures");
    if (isPaportalFeatureEnabled) {
        // add  portal specific features in this block
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

    const cli = new CliAcquisition(context, "1.6.5-daily-21042621");
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
