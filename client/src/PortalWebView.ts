import * as vscode from "vscode";
import * as path from "path";

/**
 * Manages cat coding webview panels
 */
export class PortalWebView {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: PortalWebView | undefined;
    public static currentDocument: string | undefined;

    public static readonly viewType = "portalPreview";

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _textEditor: vscode.TextEditor;

    public static checkDocumentIsHTML(): boolean {
        const languageId = vscode.window.activeTextEditor?.document.languageId.toLowerCase();
        let result = languageId === "html";
        return result;
    }

    public static createOrShow(context: vscode.ExtensionContext) {
        const isHtml = this.checkDocumentIsHTML();
        if (!isHtml) {
            return;
        }

        const extensionUri: vscode.Uri = context.extensionUri;
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (PortalWebView.currentPanel) {
            PortalWebView.currentPanel._update();
            PortalWebView.currentPanel._panel.reveal(column);
            return;
        }

        const uri =
            vscode.workspace.workspaceFolders &&
            vscode.window.activeTextEditor &&
            vscode.workspace.getWorkspaceFolder(
                vscode.window.activeTextEditor?.document.uri
            )?.uri;

        const panel = vscode.window.createWebviewPanel(
            PortalWebView.viewType,
            "Portal Preview",
            vscode.ViewColumn.Two,
            {
                localResourceRoots: [
                    vscode.Uri.joinPath(uri as vscode.Uri, "web-files"),
                ],
            }
        );

        PortalWebView.currentPanel = new PortalWebView(panel, extensionUri);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        PortalWebView.currentPanel = new PortalWebView(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._textEditor = vscode.window.activeTextEditor as vscode.TextEditor;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            (e) => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );
    }

    public dispose() {
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

    public _update() {
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
        let plainText: string = this._textEditor.document.getText();
        let html = this.fixLinks(webview, plainText);
        let htmlWithStyle = this.addStyles(webview, html);
        return htmlWithStyle;
    }

    // Add styles to the current HTML so that it is displayed corectly in VS Code
    private addStyles(webview: vscode.Webview, html: string): string {
        const uri =
            vscode.workspace.workspaceFolders &&
            vscode.workspace.workspaceFolders[0].uri;

        // Add bootstrap.min.css
        let url = webview.asWebviewUri(
            vscode.Uri.joinPath(
                uri as vscode.Uri,
                "web-files",
                "bootstrap.min.css"
            )
        );
        const bootstrap: string = `<link href="${url}" rel="stylesheet" />`;

        // Add theme.css
        url = webview.asWebviewUri(
            vscode.Uri.joinPath(uri as vscode.Uri, "web-files", "theme.css")
        );
        const theme: string = `<link href="${url}" rel="stylesheet" />`;

        return html + bootstrap + theme;
    }

    private fixLinks(webview: vscode.Webview, html: string): string {
        const uri =
            vscode.workspace.workspaceFolders &&
            vscode.workspace.workspaceFolders[0].uri;
        const BaseURL = webview.asWebviewUri(
            vscode.Uri.joinPath(uri as vscode.Uri, "web-files")
        );

        // update img src value with base url of web-files folder
        // html = html.replace(/<img([^>]*)\ssrc=(['"])(\/[^\2*([^\2\s<]+)\2/gi, "<img$1 src=$2" + BaseURL + "$3$2");
        const regex = /<img([^>]*)\ssrc=(['"])(\/[^\2*([^\2<]*(png|jpg|jpeg|svg|gif|PNG|JPG|JPEG|SVG|GIF|bmp|BMP))/g;

        let match;
        while ((match = regex.exec(html)) !== null) {
            html = html.replace(match[3], BaseURL + match[3].replace(" ", "-"));
        }

        // update image referred as url('/Homehero.png');
        html = html.replace(
            /url\('(?:[^'\/]*\/)*([^']+)'/g,
            "url('" + BaseURL + "/$1'"
        );

        return html;
    }
}
