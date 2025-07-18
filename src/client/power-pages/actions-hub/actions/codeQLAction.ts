/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { exec, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { CODEQL_EXTENSION_ID } from '../../../../common/constants';
import { Constants } from '../Constants';

export class CodeQLAction {
    private outputChannel: vscode.OutputChannel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('CodeQL Analysis');
    }    public async executeCodeQLAnalysis(fileUri: vscode.Uri): Promise<void> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('File must be part of a workspace to run CodeQL analysis.');
            return;
        }

        this.outputChannel.show();
        this.outputChannel.appendLine(`Starting CodeQL analysis for: ${path.basename(fileUri.fsPath)}`);

        try {
            const codeqlCliPath = await this.checkCodeQLInstallation();
            const tempDir = path.join(workspaceFolder.uri.fsPath, '.codeql-temp');
            const dbPath = path.join(tempDir, 'database');

            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            this.outputChannel.appendLine('Creating CodeQL database...');
            await this.runCodeQLCommand(`"${codeqlCliPath}" database create "${dbPath}" --language=javascript --source-root="${workspaceFolder.uri.fsPath}"`);

            this.outputChannel.appendLine('Running CodeQL analysis...');
            const resultsPath = path.join(tempDir, 'results.sarif');
            const querySuite = 'codeql/javascript-queries:codeql-suites/javascript-security-and-quality.qls';

            try {
                // Use the correct syntax for JavaScript code scanning query suite
                await this.runCodeQLCommand(`"${codeqlCliPath}" database analyze "${dbPath}" ${querySuite} --format=sarif-latest --output="${resultsPath}" --download`);
                this.outputChannel.appendLine(`Analysis completed using query suite: ${querySuite}`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.outputChannel.appendLine(`Primary query suite ${querySuite} failed: ${errorMessage}`);
            }

            this.outputChannel.appendLine(`Analysis complete! Results saved to: ${resultsPath}`);

            if (fs.existsSync(resultsPath)) {
                await this.displayResults(resultsPath);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.outputChannel.appendLine(`Error during CodeQL analysis: ${errorMessage}`);
            vscode.window.showErrorMessage(`CodeQL analysis failed: ${errorMessage}`);
        }
    }

    public async executeCodeQLAnalysisWithCustomPath(sitePath: string, databaseLocation: string): Promise<void> {
        this.outputChannel.show();
        this.outputChannel.appendLine(`Starting CodeQL analysis for: ${path.basename(sitePath)}`);
        this.outputChannel.appendLine(`Database location: ${databaseLocation}`);

        try {
            const codeqlCliPath = await this.checkCodeQLInstallation();
            const databaseName = `codeql-db-${path.basename(sitePath)}`;
            const dbPath = path.join(databaseLocation, '.codeql', databaseName);

            if (!fs.existsSync(path.dirname(dbPath))) {
                fs.mkdirSync(path.dirname(dbPath), { recursive: true });
            }

            this.outputChannel.appendLine('Creating CodeQL database...');
            await this.runCodeQLCommand(`"${codeqlCliPath}" database create "${dbPath}" --language=javascript --source-root="${sitePath}" --overwrite`);

            this.outputChannel.appendLine('Running CodeQL analysis...');
            const resultsPath = path.join(path.dirname(dbPath), 'results.sarif');
            const querySuite = 'codeql/javascript-queries:codeql-suites/javascript-security-and-quality.qls';

            try {
                // Use the correct syntax for JavaScript code scanning query suite
                await this.runCodeQLCommand(`"${codeqlCliPath}" database analyze "${dbPath}" ${querySuite} --format=sarif-latest --output="${resultsPath}" --download`);
                this.outputChannel.appendLine(`Analysis completed using query suite: ${querySuite}`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.outputChannel.appendLine(`Primary query suite ${querySuite} failed: ${errorMessage}`);
            }

            this.outputChannel.appendLine(`Analysis complete! Results saved to: ${resultsPath}`);

            if (fs.existsSync(resultsPath)) {
                await this.displayResults(resultsPath);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.outputChannel.appendLine(`Error during CodeQL analysis: ${errorMessage}`);
            vscode.window.showErrorMessage(`CodeQL analysis failed: ${errorMessage}`);
        }
    }

    private async checkCodeQLInstallation(): Promise<string> {
        // First try to get the CodeQL CLI path from the CodeQL extension
        const codeqlCliPath = await this.getCodeQLCliPath();
        if (codeqlCliPath) {
            this.outputChannel.appendLine(`Found CodeQL CLI at: ${codeqlCliPath}`);
            return codeqlCliPath;
        }

        // Fallback to checking if CodeQL is in PATH
        return new Promise((resolve, reject) => {
            exec('codeql version', (error, stdout, _) => {
                if (error) {
                    reject(new Error('CodeQL CLI is not installed or not in PATH. Please install the CodeQL extension or add CodeQL CLI to your PATH.'));
                } else {
                    this.outputChannel.appendLine(`CodeQL version: ${stdout.trim()}`);
                    resolve('codeql'); // Use the command as-is from PATH
                }
            });
        });
    }


    private async getCodeQLCliPath(): Promise<string | null> {
        try {
            // Get the CodeQL extension
            const codeqlExtension = vscode.extensions.getExtension(CODEQL_EXTENSION_ID);

            if (!codeqlExtension) {
                this.outputChannel.appendLine('CodeQL extension is not installed.');
                return null;
            }

            if (!codeqlExtension.isActive) {
                this.outputChannel.appendLine('Activating CodeQL extension...');
                await codeqlExtension.activate();
            }

            // The CodeQL extension stores the CLI in VS Code's global storage
            // Path pattern: %APPDATA%\Code\User\globalStorage\github.vscode-codeql\distribution{N}\codeql\codeql.exe
            const userDataPath = process.env.APPDATA || process.env.HOME;
            if (!userDataPath) {
                this.outputChannel.appendLine('Could not determine user data path.');
                return null;
            }

            const codeqlBasePath = path.join(userDataPath, 'Code', 'User', 'globalStorage', 'github.vscode-codeql');
            this.outputChannel.appendLine(`Looking for CodeQL CLI in: ${codeqlBasePath}`);

            if (!fs.existsSync(codeqlBasePath)) {
                this.outputChannel.appendLine(`CodeQL global storage path does not exist: ${codeqlBasePath}`);
                return null;
            }

            const foundCliPath = await this.searchCodeQLInPath(codeqlBasePath);
            if (foundCliPath) {
                return foundCliPath;
            }

            // Try to get the CLI path from the extension's API
            if (codeqlExtension.exports && typeof codeqlExtension.exports.getCliPath === 'function') {
                try {
                    const cliPath = await codeqlExtension.exports.getCliPath();
                    if (cliPath && fs.existsSync(cliPath)) {
                        this.outputChannel.appendLine(`Found CodeQL CLI via extension API: ${cliPath}`);
                        return cliPath;
                    }
                } catch (apiError) {
                    this.outputChannel.appendLine(`Error getting CLI path from extension API: ${apiError}`);
                }
            }

            this.outputChannel.appendLine('Could not locate CodeQL CLI in global storage.');
            return null;

        } catch (error) {
            this.outputChannel.appendLine(`Error accessing CodeQL extension: ${error}`);
            return null;
        }
    }

    private async searchCodeQLInPath(basePath: string): Promise<string | null> {
        try {
            const distributionDirs = fs.readdirSync(basePath)
                .filter(dir => dir.startsWith('distribution'))
                .sort()
                .reverse(); // Get the latest distribution first

            this.outputChannel.appendLine(`Found distribution directories: ${distributionDirs.join(', ')}`);

            for (const distributionDir of distributionDirs) {
                const codeqlPaths = [
                    path.join(basePath, distributionDir, 'codeql', 'codeql.exe'), // Windows
                    path.join(basePath, distributionDir, 'codeql', 'codeql')     // Unix/Linux/macOS
                ];

                for (const codeqlCliPath of codeqlPaths) {
                    if (fs.existsSync(codeqlCliPath)) {
                        this.outputChannel.appendLine(`Found CodeQL CLI at: ${codeqlCliPath}`);
                        return codeqlCliPath;
                    }
                }
            }

            return null;
        } catch (error) {
            this.outputChannel.appendLine(`Error searching for CodeQL CLI: ${error}`);
            return null;
        }
    }

    private async runCodeQLCommand(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.outputChannel.appendLine(`Executing: ${command}`);

            // Parse the command and arguments
            const parts = this.parseCommand(command);
            const cmd = parts[0];
            const args = parts.slice(1);

            const process = spawn(cmd, args, {
                shell: true,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            // Stream stdout in real-time
            process.stdout?.on('data', (data: Buffer) => {
                const output = data.toString();
                stdout += output;
                // Show real-time output in the output channel
                this.outputChannel.appendLine(`[STDOUT] ${output.trim()}`);
            });

            // Stream stderr in real-time
            process.stderr?.on('data', (data: Buffer) => {
                const output = data.toString();
                stderr += output;
                // Show real-time stderr in the output channel
                this.outputChannel.appendLine(`[STDERR] ${output.trim()}`);
            });

            process.on('close', (code: number) => {
                if (code === 0) {
                    this.outputChannel.appendLine(`Command completed successfully (exit code: ${code})`);
                    resolve(stdout);
                } else {
                    this.outputChannel.appendLine(`Command failed with exit code: ${code}`);
                    reject(new Error(`Command failed with exit code ${code}: ${stderr || 'Unknown error'}`));
                }
            });

            process.on('error', (error: Error) => {
                this.outputChannel.appendLine(`Process error: ${error.message}`);
                reject(new Error(`Process error: ${error.message}`));
            });
        });
    }

    private parseCommand(command: string): string[] {
        // Simple command parsing that handles quoted arguments
        const parts: string[] = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';

        for (let i = 0; i < command.length; i++) {
            const char = command[i];

            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar && inQuotes) {
                inQuotes = false;
                quoteChar = '';
            } else if (char === ' ' && !inQuotes) {
                if (current.trim()) {
                    parts.push(current.trim());
                    current = '';
                }
            } else {
                current += char;
            }
        }

        if (current.trim()) {
            parts.push(current.trim());
        }

        return parts;
    }

    private async displayResults(resultsPath: string): Promise<void> {
        try {
            const resultsContent = fs.readFileSync(resultsPath, 'utf8');
            const results = JSON.parse(resultsContent);

            if (results.runs && results.runs.length > 0) {
                const run = results.runs[0];
                if (run.results && run.results.length > 0) {
                    this.outputChannel.appendLine(`\nFound ${run.results.length} issue(s):`);

                    run.results.forEach((result: { message?: { text?: string }; locations?: Array<{ physicalLocation?: { artifactLocation?: { uri?: string }; region?: { startLine?: number } } }> }, index: number) => {
                        this.outputChannel.appendLine(`\n${index + 1}. ${result.message?.text || 'No message'}`);
                        if (result.locations && result.locations.length > 0) {
                            const location = result.locations[0];
                            if (location.physicalLocation) {
                                const file = location.physicalLocation.artifactLocation?.uri;
                                const startLine = location.physicalLocation.region?.startLine;
                                this.outputChannel.appendLine(`   File: ${file}`);
                                if (startLine) {
                                    this.outputChannel.appendLine(`   Line: ${startLine}`);
                                }
                            }
                        }
                    });
                } else {
                    this.outputChannel.appendLine('\nNo issues found!');
                }
            } else {
                this.outputChannel.appendLine('\nNo analysis results found.');
            }

            // Try to open with SARIF viewer extension by default
            await this.openWithSarifViewer(resultsPath);

        } catch (error) {
            this.outputChannel.appendLine(`Error reading results: ${error}`);
        }
    }

    private async openWithSarifViewer(resultsPath: string): Promise<void> {
        try {
            const sarifExt = vscode.extensions.getExtension('MS-SarifVSCode.sarif-viewer');

            if (!sarifExt) {
                this.outputChannel.appendLine('SARIF viewer extension not found.');

                const installExtension = await vscode.window.showInformationMessage(
                    Constants.Strings.SARIF_VIEWER_NOT_INSTALLED,
                    Constants.Strings.INSTALL,
                    Constants.Strings.OPEN_AS_TEXT,
                    Constants.Strings.CANCEL
                );

                if (installExtension === Constants.Strings.INSTALL) {
                    try {
                        this.outputChannel.appendLine('Installing SARIF viewer extension...');
                        await vscode.commands.executeCommand('workbench.extensions.installExtension', 'MS-SarifVSCode.sarif-viewer');

                        // Wait a moment for the extension to be available
                        await new Promise(resolve => setTimeout(resolve, 2000));

                        // Try to get the extension again after installation
                        const newSarifExt = vscode.extensions.getExtension('MS-SarifVSCode.sarif-viewer');
                        if (newSarifExt) {
                            this.outputChannel.appendLine('SARIF viewer extension installed successfully. Activating...');
                            await newSarifExt.activate();

                            if (newSarifExt.exports && typeof newSarifExt.exports.openLogs === 'function') {
                                this.outputChannel.appendLine('Opening results with newly installed SARIF viewer...');
                                await newSarifExt.exports.openLogs([vscode.Uri.file(resultsPath)]);
                                this.outputChannel.appendLine('Results opened in SARIF viewer successfully.');
                                return;
                            }
                        }

                        this.outputChannel.appendLine('Extension installed but API not available yet. Opening as text file...');
                        await this.fallbackToTextEditor(resultsPath);

                    } catch (installError) {
                        this.outputChannel.appendLine(`Failed to install SARIF viewer extension: ${installError}`);
                        vscode.window.showErrorMessage(Constants.Strings.SARIF_VIEWER_INSTALL_FAILED);
                        await this.fallbackToTextEditor(resultsPath);
                    }
                } else if (installExtension === Constants.Strings.OPEN_AS_TEXT) {
                    await this.fallbackToTextEditor(resultsPath);
                } else {
                    this.outputChannel.appendLine('User cancelled opening results.');
                }
                return;
            }

            if (!sarifExt.isActive) {
                this.outputChannel.appendLine('Activating SARIF viewer extension...');
                await sarifExt.activate();
            }

            if (sarifExt.exports && typeof sarifExt.exports.openLogs === 'function') {
                this.outputChannel.appendLine('Opening results with SARIF viewer...');
                await sarifExt.exports.openLogs([vscode.Uri.file(resultsPath)]);
                this.outputChannel.appendLine('Results opened in SARIF viewer successfully.');
            } else {
                this.outputChannel.appendLine('SARIF viewer extension does not expose expected API. Falling back to text editor...');
                await this.fallbackToTextEditor(resultsPath);
            }

        } catch (error) {
            this.outputChannel.appendLine(`Error opening with SARIF viewer: ${error}`);
            await this.fallbackToTextEditor(resultsPath);
        }
    }

    private async fallbackToTextEditor(resultsPath: string): Promise<void> {
        try {
            // Offer to open the full SARIF file as text
            const openFile = await vscode.window.showInformationMessage(
                'CodeQL analysis completed. Would you like to open the full results file?',
                'Open Results',
                'Close'
            );

            if (openFile === 'Open Results') {
                const document = await vscode.workspace.openTextDocument(resultsPath);
                await vscode.window.showTextDocument(document);
            }
        } catch (error) {
            this.outputChannel.appendLine(`Error opening results file: ${error}`);
        }
    }

    public dispose(): void {
        this.outputChannel.dispose();
    }
}
