/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { MemFS } from "./FileSystemProvider";
import { BrowserNPM } from "./BrowserNpm";
import * as esbuild from 'esbuild-wasm';
import { resolvePlugin } from "./esbuild";
import { CreateDemoSite } from "./DemoDataHelper";
import { showProgressWithNotification } from "../utilities/Utils";

export class CodeGenPreview implements vscode.Disposable {
    private static _isInitialized = false;
    private static readonly _memFs: MemFS = new MemFS();
    private readonly _disposables: vscode.Disposable[] = [];
    private static _previewText: string | undefined = undefined;
    private static _activePanels: vscode.WebviewPanel[] = [];
    private static _ppmInstance: BrowserNPM | undefined;
    private static _watcher: vscode.FileSystemWatcher | undefined = undefined;

    private constructor() {
        this._disposables.push(
            vscode.commands.registerCommand("microsoft.powerplatform.pages.codegen.preview", CodeGenPreview.showPreview),
            vscode.workspace.registerFileSystemProvider('memfs', CodeGenPreview._memFs, { isCaseSensitive: true })
        );

        vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse('memfs:/'), name: "Codegen Demo" });

        CreateDemoSite(CodeGenPreview._memFs);
    }

    public dispose(): void {
        this._disposables.forEach(d => d.dispose());
        CodeGenPreview._watcher?.dispose();
    }

    static async initialize(): Promise<void> {
        if (CodeGenPreview._isInitialized) {
            return;
        }

        await showProgressWithNotification("Initializing code gen preview", async (progress) => {
            new CodeGenPreview();
            CodeGenPreview._ppmInstance = new BrowserNPM(CodeGenPreview._memFs);

            progress.report({ message: "Installing dependencies..." });
            await CodeGenPreview._ppmInstance.installDependencies();

            progress.report({ increment: 50, message: "Loading esbuild..." });
            await esbuild.initialize({
                worker: true,
                wasmURL: 'https://cdn.jsdelivr.net/npm/esbuild-wasm@0.25.1/esbuild.wasm',
            });

            progress.report({ increment: 75, message: "Building..." });
            await CodeGenPreview.rebuild();

            const folder = vscode.workspace.workspaceFolders?.[0] || "";

            progress.report({ increment: 85, message: "Setting up watcher..." });
            CodeGenPreview._watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(folder, "src/**/*"));
            CodeGenPreview._watcher.onDidChange(async (uri) => {
                console.log(`File changed: ${uri.toString()}`);
                await CodeGenPreview.rebuild();
            })

            progress.report({ increment: 100, message: "Code generation preview initialized successfully!" });
        });

        CodeGenPreview._isInitialized = true;
    }

    private static async rebuild(): Promise<void> {
        if (!CodeGenPreview._ppmInstance) return;

        try {
            console.log('Rebuilding code preview...');
            const configFile = new TextDecoder().decode(CodeGenPreview._memFs.readFile(vscode.Uri.parse(`memfs:/esbuild.config.json`)));
            const userConfig = JSON.parse(configFile || '{}');

            const startTime = performance.now();
            const res = await esbuild.build({
                ...userConfig,
                entryPoints: ['/src/index'],
                outdir: '/dist',
                format: 'esm',
                write: false,
                bundle: true,
                metafile: true,
                plugins: [resolvePlugin(CodeGenPreview._ppmInstance)],
            });
            const endTime = performance.now();
            console.log('Build time:', endTime - startTime, 'ms');

            CodeGenPreview._previewText = res.outputFiles?.[0].text;

            // Update all active panels with new content
            CodeGenPreview._activePanels.forEach(panel => {
                if (panel.visible) {
                    panel.webview.html = CodeGenPreview.getWebviewContent();
                }
            });
        } catch (error) {
            console.error('Build failed:', error);
            vscode.window.showErrorMessage(`Code generation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private static showPreview() {
        const panel = vscode.window.createWebviewPanel("codeGenPreview", "Code Generation Preview", vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: false
        });

        panel.webview.html = CodeGenPreview.getWebviewContent();

        // Track the panel
        CodeGenPreview._activePanels.push(panel);

        panel.onDidDispose(() => {
            // Remove from active panels when closed
            const index = CodeGenPreview._activePanels.indexOf(panel);
            if (index !== -1) {
                CodeGenPreview._activePanels.splice(index, 1);
            }
        });
    }

    private static getWebviewContent(): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src 'self' blob: https:; script-src 'unsafe-eval' 'unsafe-inline' blob: https:; style-src 'unsafe-inline'; worker-src blob:;">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Code Generation Preview</title>
        </head>
        <body>
            <div id="root"></div>
            <script type="module">
                if (${JSON.stringify(CodeGenPreview._previewText !== undefined)}) {
                    // Add the generated code to the page
                    const script = document.createElement('script');
                    script.type = 'module';
                    script.textContent = ${JSON.stringify(CodeGenPreview._previewText || '')};
                    document.body.appendChild(script);
                } else {
                    document.getElementById('root').innerHTML = '<h1>No preview available</h1><p>Please wait for code generation to complete.</p>';
                }
            </script>
        </body>
        </html>`;
    }
}
