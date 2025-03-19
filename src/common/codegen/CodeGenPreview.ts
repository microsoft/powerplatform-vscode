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

export class CodeGenPreview implements vscode.Disposable {
    private static _isInitialized = false;
    private static readonly _memFs: MemFS = new MemFS();
    private readonly _disposables: vscode.Disposable[] = [];
    private static _previewText: string | undefined = undefined;

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
    }

    static async initialize(): Promise<void> {
        if (CodeGenPreview._isInitialized) {
            return;
        }

        new CodeGenPreview();
        const ppmInstance = new BrowserNPM(CodeGenPreview._memFs);
        await ppmInstance.installDependencies();
        await esbuild.initialize({
            worker: true,
            wasmURL: 'https://cdn.jsdelivr.net/npm/esbuild-wasm@0.25.1/esbuild.wasm',
        });
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
          plugins: [resolvePlugin(ppmInstance)], // Now ppm is guaranteed to be non-null
        });
        const endTime = performance.now();
        console.log('Build time:', endTime - startTime, 'ms');

        CodeGenPreview._previewText = res.outputFiles?.[0].text;

        CodeGenPreview._isInitialized = true;
    }

    private static showPreview() {
        const panel = vscode.window.createWebviewPanel("codeGenPreview", "Code Generation Preview", vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: false
        });

        panel.webview.html = CodeGenPreview.getWebviewContent();
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
