/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { MemFS } from "./FileSystemProvider";
import { BrowserNPM } from "./BrowserNpm";
import * as esbuild from 'esbuild-wasm';
import { resolvePlugin } from "./esbuild";

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

        CodeGenPreview._memFs.createDirectory(vscode.Uri.parse(`memfs:/src/`));
        CodeGenPreview._memFs.createDirectory(vscode.Uri.parse(`memfs:/node_modules/`));

        CodeGenPreview._memFs.writeFile(vscode.Uri.parse(`memfs:/src/index.tsx`), Buffer.from(`
import React from 'react';
import ReactDOM from 'react-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

const validationSchema = yup.object({
    email: yup
        .string('Enter your email')
        .email('Enter a valid email!')
        .required('Email is required'),
    password: yup
        .string('Enter your password')
        .min(8, 'Password should be of minimum 8 characters length')
        .required('Password is required'),
});

const WithMaterialUI = () => {
    const formik = useFormik({
        initialValues: {
            email: 'foobar@example.com',
            password: 'foobar',
        },
        validationSchema: validationSchema,
        onSubmit: (values) => {
            alert(JSON.stringify(values, null, 2));
        },
    });

    return (
        <div>
            <form onSubmit={formik.handleSubmit}>
                <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                />
                <TextField
                    fullWidth
                    id="password"
                    name="password"
                    label="Password"
                    type="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                />
                <Button color="primary" variant="contained" fullWidth type="submit">
                    Submit
                </Button>
            </form>
        </div>
    );
};

ReactDOM.render(<WithMaterialUI />, document.getElementById('root'));
`.trim()
        ), { create: true, overwrite: true });

        CodeGenPreview._memFs.writeFile(vscode.Uri.parse(`memfs:/package.json`), Buffer.from(
            JSON.stringify(
                {
                  dependencies: {
                    '@material-ui/core': '4.11.0',
                    formik: '2.3.0',
                    react: '18.2.0',
                    'react-dom': '18.2.0',
                    yup: '0.29.3',
                  },
                },
                null,
                2
              )
        ), { create: true, overwrite: true });

        CodeGenPreview._memFs.writeFile(vscode.Uri.parse(`memfs:/esbuild.config.json`), Buffer.from(
            JSON.stringify(
                {
                  entryPoints: ['/src/index'],
                  outdir: '/dist',
                  format: 'esm',
                  write: false,
                  bundle: true,
                  plugins: [],
                },
                null,
                2
              )
        ), { create: true, overwrite: true });
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
