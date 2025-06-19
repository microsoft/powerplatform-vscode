/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as path from "path";
import { findWebsiteYmlFolder } from "../common/utilities/WorkspaceInfoFinderUtil";

/**
 * Displays Portal html webpage preview
 */
export class PortalWebView {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: PortalWebView | undefined;
    public static currentDocument: string | undefined;

    public static readonly viewType = "portalPreview";

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private _textEditor: vscode.TextEditor;

    public static checkDocumentIsHTML(): boolean {
        const languageId = vscode.window.activeTextEditor?.document.languageId.toLowerCase();
        const result = languageId === "html";
        return result;
    }

    public static createOrShow(): void {
        const isHtml = this.checkDocumentIsHTML();
        if (!isHtml) {
            return;
        }

        // If we already have a panel, show it.
        if (PortalWebView.currentPanel) {
            const column = vscode.window.activeTextEditor
                ? vscode.window.activeTextEditor.viewColumn
                : undefined;

            PortalWebView.currentPanel._update();
            PortalWebView.currentPanel._panel.reveal(column);
            return;
        }

        if (!vscode.window.activeTextEditor) {
            return;
        }
        const repoRoot = PortalWebView.getPortalRootFolder();

        if (!repoRoot) {
            vscode.window.showErrorMessage(vscode.l10n.t("Unable to locate website root folder."));
            return;
        }

        const localResourceRootFolder = vscode.Uri.joinPath(repoRoot, "web-files");

        const panel = vscode.window.createWebviewPanel(
            PortalWebView.viewType,
            "Portal Preview",
            vscode.ViewColumn.Two,
            {
                localResourceRoots: [localResourceRootFolder]
            }
        );

        PortalWebView.currentPanel = new PortalWebView(panel);
    }

    public static revive(panel: vscode.WebviewPanel): void {
        PortalWebView.currentPanel = new PortalWebView(panel);
    }

    private constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
        this._textEditor = vscode.window.activeTextEditor as vscode.TextEditor;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            () => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );
    }

    public dispose(): void {
        PortalWebView.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    public _update(): void {
        this._textEditor = vscode.window.activeTextEditor as vscode.TextEditor;

        PortalWebView.currentDocument = this._textEditor.document.fileName;

        const webview = this._panel.webview;
        this._panel.title = this.getFileName();
        this._panel.webview.html = this.generateHTML(webview);
    }

    private getFileName(): string {
        const filePath = this._textEditor.document.fileName;
        const fileTitle = "(Preview) " + path.basename(filePath);
        return fileTitle;
    }

    private generateHTML(webview: vscode.Webview): string {
        const plainText: string = this._textEditor.document.getText();
        const html = this.fixLinks(webview, plainText);
        const htmlWithStyle = this.addStyles(webview, html);
        return htmlWithStyle;
    }

    // Add styles to the current HTML so that it is displayed correctly in VS Code
    private addStyles(webview: vscode.Webview, html: string): string {
        const uri = PortalWebView.getPortalRootFolder();
        if (uri) {
            // Add bootstrap.min.css
            let url = webview.asWebviewUri(
                vscode.Uri.joinPath(uri as vscode.Uri, "web-files", "bootstrap.min.css")
            );
            const bootstrap = `<link href="${url}" rel="stylesheet" />`;
            html += bootstrap;
            // Add theme.css
            url = webview.asWebviewUri(
                vscode.Uri.joinPath(uri as vscode.Uri, "web-files", "theme.css")
            );
            const theme = `<link href="${url}" rel="stylesheet" />`;
            html += theme;
        }
        return html;
    }

    private fixLinks(webview: vscode.Webview, html: string): string {
        const uri = PortalWebView.getPortalRootFolder();
        if (uri) {
            const BaseURL = webview.asWebviewUri(
                vscode.Uri.joinPath(uri as vscode.Uri, "web-files")
            );

            // update img src value with base url of web-files folder
            // html = html.replace(/<img([^>]*)\ssrc=(['"])(\/[^\2*([^\2\s<]+)\2/gi, "<img$1 src=$2" + BaseURL + "$3$2");
            const regex = /<img([^>]*)\ssrc=(['"])(\/[^\2*([^\2<]*(png|jpg|jpeg|svg|gif|PNG|JPG|JPEG|SVG|GIF|bmp|BMP))/g;
            const emptySpace = /[ ]/g;

            let match;
            while ((match = regex.exec(html)) !== null) {
                html = html.replace(match[3], BaseURL + match[3].replace(emptySpace, "-"));
            }

            // update image referred as url('/Homehero.png');
            html = html.replace(
                /url\('(?:[^'\]*)*([^']+)'/g,
                "url('" + BaseURL + "/$1'"
            );
        }
        return html;
    }

    private static getPortalRootFolder(): vscode.Uri | null {
        const fileBeingEdited = vscode.window.activeTextEditor as vscode.TextEditor;
        if (fileBeingEdited) {
            const repoRoot = findWebsiteYmlFolder(fileBeingEdited.document.uri.fsPath);

            if (!repoRoot) {
                return null;
            }

            const rootFolder = vscode.Uri.file(repoRoot);
            return rootFolder;
        }
        return null;
    }
}
