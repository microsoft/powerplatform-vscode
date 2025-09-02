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
import { traceInfo, traceError, getBaseEventInfo } from '../TelemetryHelper';

interface PowerPagesConfig {
    codeQlQuery?: string;
}

export class CodeQLAction {
    private outputChannel: vscode.OutputChannel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel(Constants.Strings.CODEQL_ANALYSIS_CHANNEL_NAME);
    }

    public async executeCodeQLAnalysisWithCustomPath(sitePath: string, databaseLocation: string, powerPagesSiteFolderExists: boolean): Promise<{ issueCount: number; resultsPath: string }> {
        const startTime = Date.now();
        const siteBaseName = path.basename(sitePath);

        traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_ACTION_STARTED, {
            methodName: this.executeCodeQLAnalysisWithCustomPath.name,
            sitePath: sitePath,
            databaseLocation: databaseLocation,
            powerPagesSiteFolderExists: powerPagesSiteFolderExists,
            siteBaseName: siteBaseName,
            ...getBaseEventInfo()
        });

        this.outputChannel.show();
        this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_ANALYSIS_STARTING, path.basename(sitePath)));
        this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_DATABASE_LOCATION, databaseLocation));

        try {
            const codeqlCliPath = await this.checkCodeQLInstallation();
            const databaseName = `codeql-db-${path.basename(sitePath)}`;
            const dbPath = path.join(databaseLocation, '.codeql', databaseName);

            if (!fs.existsSync(path.dirname(dbPath))) {
                fs.mkdirSync(path.dirname(dbPath), { recursive: true });
            }

            this.outputChannel.appendLine(Constants.Strings.CODEQL_CREATING_DATABASE);
            await this.runCodeQLCommand(`"${codeqlCliPath}" database create "${dbPath}" --language=javascript-typescript --source-root="${sitePath}" --overwrite --no-run-unnecessary-builds`);

            this.outputChannel.appendLine(Constants.Strings.CODEQL_RUNNING_ANALYSIS);
            const resultsPath = path.join(path.dirname(dbPath), 'results.sarif');

            // Get the query suite from config or use default - only check config if Power Pages folder exists
            const querySuite = await this.getCodeQLQuerySuite(sitePath, powerPagesSiteFolderExists);

            try {
                // Use the correct syntax for JavaScript code scanning query suite
                await this.runCodeQLCommand(`"${codeqlCliPath}" database analyze "${dbPath}" ${querySuite} --format=sarif-latest --output="${resultsPath}" --download`);
                this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_ANALYSIS_COMPLETED, querySuite));
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_QUERY_SUITE_FAILED, querySuite, errorMessage));
            }

            this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_ANALYSIS_COMPLETE, resultsPath));

            if (fs.existsSync(resultsPath)) {
                await this.displayResults(resultsPath);
            }

            const duration = Date.now() - startTime;
            const finalIssueCount = fs.existsSync(resultsPath) ? this.getIssueCountFromResults(resultsPath) : 0;

            traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_ACTION_COMPLETED, {
                methodName: this.executeCodeQLAnalysisWithCustomPath.name,
                sitePath: sitePath,
                databaseLocation: databaseLocation,
                databasePath: dbPath,
                resultsPath: resultsPath,
                querySuite: querySuite,
                duration: duration,
                siteBaseName: siteBaseName,
                powerPagesSiteFolderExists: powerPagesSiteFolderExists,
                resultsFileExists: fs.existsSync(resultsPath),
                issuesFound: finalIssueCount,
                hasIssues: finalIssueCount > 0,
                ...getBaseEventInfo()
            });

            return { issueCount: finalIssueCount, resultsPath: resultsPath };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const duration = Date.now() - startTime;

            this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_ANALYSIS_ERROR, errorMessage));
            vscode.window.showErrorMessage(vscode.l10n.t(Constants.Strings.CODEQL_ANALYSIS_FAILED, errorMessage));

            traceError(Constants.EventNames.ACTIONS_HUB_CODEQL_ACTION_FAILED, error as Error, {
                methodName: this.executeCodeQLAnalysisWithCustomPath.name,
                sitePath: sitePath,
                databaseLocation: databaseLocation,
                duration: duration,
                siteBaseName: siteBaseName,
                powerPagesSiteFolderExists: powerPagesSiteFolderExists,
                errorMessage: errorMessage,
                ...getBaseEventInfo()
            });

            // Return empty results on error
            return { issueCount: 0, resultsPath: '' };
        }
    }

    private async checkCodeQLInstallation(): Promise<string> {
        traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_CLI_SEARCH_STARTED, {
            methodName: this.checkCodeQLInstallation.name,
            ...getBaseEventInfo()
        });

        // First try to get the CodeQL CLI path from the CodeQL extension
        const codeqlCliPath = await this.getCodeQLCliPath();
        if (codeqlCliPath) {
            this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_CLI_FOUND_AT, codeqlCliPath));

            traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_CLI_FOUND, {
                methodName: this.checkCodeQLInstallation.name,
                cliPath: codeqlCliPath,
                source: 'extension',
                ...getBaseEventInfo()
            });

            return codeqlCliPath;
        }

        // Fallback to checking if CodeQL is in PATH
        return new Promise((resolve, reject) => {
            exec('codeql version', (error, stdout, _) => {
                if (error) {
                    traceError(Constants.EventNames.ACTIONS_HUB_CODEQL_CLI_NOT_FOUND, error, {
                        methodName: this.checkCodeQLInstallation.name,
                        source: 'PATH',
                        errorMessage: error.message,
                        ...getBaseEventInfo()
                    });
                    reject(new Error(Constants.Strings.CODEQL_CLI_NOT_INSTALLED));
                } else {
                    this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_VERSION, stdout.trim()));

                    traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_CLI_FOUND, {
                        methodName: this.checkCodeQLInstallation.name,
                        cliPath: 'codeql',
                        source: 'PATH',
                        version: stdout.trim(),
                        ...getBaseEventInfo()
                    });

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
                this.outputChannel.appendLine(Constants.Strings.CODEQL_EXTENSION_NOT_INSTALLED_LOG);
                return null;
            }

            if (!codeqlExtension.isActive) {
                this.outputChannel.appendLine(Constants.Strings.CODEQL_ACTIVATING_EXTENSION);
                await codeqlExtension.activate();
            }

            // The CodeQL extension stores the CLI in VS Code's global storage
            // Path pattern: %APPDATA%\Code\User\globalStorage\github.vscode-codeql\distribution{N}\codeql\codeql.exe
            const userDataPath = process.env.APPDATA || process.env.HOME;
            if (!userDataPath) {
                this.outputChannel.appendLine(Constants.Strings.CODEQL_USER_DATA_PATH_ERROR);
                return null;
            }

            const codeqlBasePath = path.join(userDataPath, 'Code', 'User', 'globalStorage', 'github.vscode-codeql');
            this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_LOOKING_FOR_CLI, codeqlBasePath));

            if (!fs.existsSync(codeqlBasePath)) {
                this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_GLOBAL_STORAGE_NOT_EXISTS, codeqlBasePath));
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
                        this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_CLI_VIA_API, cliPath));
                        return cliPath;
                    }
                } catch (apiError) {
                    const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
                    this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_API_ERROR, errorMessage));
                }
            }

            this.outputChannel.appendLine(Constants.Strings.CODEQL_CLI_NOT_LOCATED);
            return null;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_EXTENSION_ACCESS_ERROR, errorMessage));
            return null;
        }
    }

    private async searchCodeQLInPath(basePath: string): Promise<string | null> {
        try {
            const distributionDirs = fs.readdirSync(basePath)
                .filter(dir => dir.startsWith('distribution'))
                .sort()
                .reverse(); // Get the latest distribution first

            this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_DISTRIBUTION_DIRS, distributionDirs.join(', ')));

            for (const distributionDir of distributionDirs) {
                const codeqlPaths = [
                    path.join(basePath, distributionDir, 'codeql', 'codeql.exe'), // Windows
                    path.join(basePath, distributionDir, 'codeql', 'codeql')     // Unix/Linux/macOS
                ];

                for (const codeqlCliPath of codeqlPaths) {
                    if (fs.existsSync(codeqlCliPath)) {
                        this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_CLI_FOUND_AT, codeqlCliPath));
                        return codeqlCliPath;
                    }
                }
            }

            return null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_CLI_SEARCH_ERROR, errorMessage));
            return null;
        }
    }

    private getCommandType(command: string): string {
        if (command.includes('database create')) {
            return 'database_create';
        } else if (command.includes('database analyze')) {
            return 'database_analyze';
        } else if (command.includes('version')) {
            return 'version';
        }
        return 'unknown';
    }

    private async runCodeQLCommand(command: string): Promise<string> {
        const startTime = Date.now();
        const commandType = this.getCommandType(command);

        traceInfo(commandType === 'database_create' ?
            Constants.EventNames.ACTIONS_HUB_CODEQL_DATABASE_CREATION_STARTED :
            Constants.EventNames.ACTIONS_HUB_CODEQL_ANALYSIS_STARTED, {
            methodName: this.runCodeQLCommand.name,
            command: command,
            commandType: commandType,
            ...getBaseEventInfo()
        });

        return new Promise((resolve, reject) => {
            this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_EXECUTING_COMMAND, command));

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
                const duration = Date.now() - startTime;

                if (code === 0) {
                    this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_COMMAND_SUCCESS, code.toString()));

                    traceInfo(commandType === 'database_create' ?
                        Constants.EventNames.ACTIONS_HUB_CODEQL_DATABASE_CREATION_COMPLETED :
                        Constants.EventNames.ACTIONS_HUB_CODEQL_ANALYSIS_COMPLETED, {
                        methodName: this.runCodeQLCommand.name,
                        command: command,
                        commandType: commandType,
                        exitCode: code,
                        duration: duration,
                        stdoutLength: stdout.length,
                        stderrLength: stderr.length,
                        ...getBaseEventInfo()
                    });

                    resolve(stdout);
                } else {
                    this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_COMMAND_FAILED, code.toString()));

                    traceError(commandType === 'database_create' ?
                        Constants.EventNames.ACTIONS_HUB_CODEQL_DATABASE_CREATION_FAILED :
                        Constants.EventNames.ACTIONS_HUB_CODEQL_ANALYSIS_FAILED,
                        new Error(vscode.l10n.t(Constants.Strings.CODEQL_COMMAND_FAILED_ERROR, code.toString(), stderr || 'Unknown error')), {
                        methodName: this.runCodeQLCommand.name,
                        command: command,
                        commandType: commandType,
                        exitCode: code,
                        duration: duration,
                        stdoutLength: stdout.length,
                        stderrLength: stderr.length,
                        stderr: stderr,
                        ...getBaseEventInfo()
                    });

                    reject(new Error(vscode.l10n.t(Constants.Strings.CODEQL_COMMAND_FAILED_ERROR, code.toString(), stderr || 'Unknown error')));
                }
            });

            process.on('error', (error: Error) => {
                const duration = Date.now() - startTime;
                this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_PROCESS_ERROR, error.message));

                traceError(commandType === 'database_create' ?
                    Constants.EventNames.ACTIONS_HUB_CODEQL_DATABASE_CREATION_FAILED :
                    Constants.EventNames.ACTIONS_HUB_CODEQL_ANALYSIS_FAILED,
                    error, {
                    methodName: this.runCodeQLCommand.name,
                    command: command,
                    commandType: commandType,
                    duration: duration,
                    errorMessage: error.message,
                    ...getBaseEventInfo()
                });

                reject(new Error(vscode.l10n.t(Constants.Strings.CODEQL_PROCESS_ERROR, error.message)));
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

            let hasIssues = false;
            let issueCount = 0;
            let runsCount = 0;

            if (results.runs && results.runs.length > 0) {
                runsCount = results.runs.length;
                const run = results.runs[0];
                if (run.results && run.results.length > 0) {
                    hasIssues = true;
                    issueCount = run.results.length;
                    this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_ISSUES_FOUND, run.results.length.toString()));

                    run.results.forEach((result: { message?: { text?: string }; locations?: Array<{ physicalLocation?: { artifactLocation?: { uri?: string }; region?: { startLine?: number } } }> }, index: number) => {
                        this.outputChannel.appendLine(`\n${index + 1}. ${result.message?.text || Constants.Strings.CODEQL_NO_MESSAGE}`);
                        if (result.locations && result.locations.length > 0) {
                            const location = result.locations[0];
                            if (location.physicalLocation) {
                                const file = location.physicalLocation.artifactLocation?.uri;
                                const startLine = location.physicalLocation.region?.startLine;
                                this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_FILE_LABEL, file || ''));
                                if (startLine) {
                                    this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_LINE_LABEL, startLine.toString()));
                                }
                            }
                        }
                    });
                } else {
                    this.outputChannel.appendLine(Constants.Strings.CODEQL_NO_ISSUES_FOUND);
                }
            } else {
                this.outputChannel.appendLine(Constants.Strings.CODEQL_NO_ANALYSIS_RESULTS);
            }

            traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_RESULTS_PROCESSED, {
                methodName: this.displayResults.name,
                resultsPath: resultsPath,
                hasIssues: hasIssues,
                issueCount: issueCount,
                runsCount: runsCount,
                fileSize: resultsContent.length,
                analysisResultsAvailable: runsCount > 0,
                issuesFoundCount: issueCount,
                resultsFileExists: fs.existsSync(resultsPath),
                ...getBaseEventInfo()
            });

            // Only open SARIF viewer if issues are found
            if (hasIssues) {
                traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_SARIF_VIEWER_OPENING_WITH_ISSUES, {
                    methodName: this.displayResults.name,
                    issueCount: issueCount,
                    runsCount: runsCount,
                    ...getBaseEventInfo()
                });

                await this.openWithSarifViewer(resultsPath);
            } else {
                // Show a simple success notification for clean results
                traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_ANALYSIS_CLEAN_RESULTS, {
                    methodName: this.displayResults.name,
                    runsCount: runsCount,
                    ...getBaseEventInfo()
                });

                vscode.window.showInformationMessage(Constants.Strings.CODEQL_ANALYSIS_SUCCESS_NO_ISSUES);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_ERROR_READING_RESULTS, errorMessage));

            traceError(Constants.EventNames.ACTIONS_HUB_CODEQL_RESULTS_DISPLAY_FAILED, error as Error, {
                methodName: this.displayResults.name,
                resultsPath: resultsPath,
                errorMessage: errorMessage,
                ...getBaseEventInfo()
            });
        }
    }

    private async openWithSarifViewer(resultsPath: string): Promise<void> {
        try {
            const sarifExt = vscode.extensions.getExtension('MS-SarifVSCode.sarif-viewer');

            if (!sarifExt) {
                this.outputChannel.appendLine(Constants.Strings.CODEQL_SARIF_VIEWER_NOT_FOUND);

                traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_SARIF_VIEWER_NOT_FOUND, {
                    methodName: 'openWithSarifViewer',
                    resultsPath: resultsPath,
                    extensionId: 'MS-SarifVSCode.sarif-viewer',
                    ...getBaseEventInfo()
                });

                const installExtension = await vscode.window.showInformationMessage(
                    Constants.Strings.SARIF_VIEWER_NOT_INSTALLED,
                    Constants.Strings.INSTALL,
                    Constants.Strings.OPEN_AS_TEXT,
                    Constants.Strings.CANCEL
                );

                traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_SARIF_VIEWER_INSTALL_PROMPTED, {
                    methodName: 'openWithSarifViewer',
                    resultsPath: resultsPath,
                    extensionId: 'MS-SarifVSCode.sarif-viewer',
                    userResponse: installExtension,
                    ...getBaseEventInfo()
                });

                if (installExtension === Constants.Strings.INSTALL) {
                    try {
                        traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_SARIF_VIEWER_INSTALL_ACCEPTED, {
                            methodName: 'openWithSarifViewer',
                            resultsPath: resultsPath,
                            extensionId: 'MS-SarifVSCode.sarif-viewer',
                            ...getBaseEventInfo()
                        });

                        this.outputChannel.appendLine(Constants.Strings.CODEQL_INSTALLING_SARIF_VIEWER);
                        await vscode.commands.executeCommand('workbench.extensions.installExtension', 'MS-SarifVSCode.sarif-viewer');

                        // Wait a moment for the extension to be available
                        await new Promise(resolve => setTimeout(resolve, 2000));

                        // Try to get the extension again after installation
                        const newSarifExt = vscode.extensions.getExtension('MS-SarifVSCode.sarif-viewer');
                        if (newSarifExt) {
                            this.outputChannel.appendLine(Constants.Strings.CODEQL_SARIF_VIEWER_INSTALLED);

                            traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_SARIF_VIEWER_INSTALL_SUCCESS, {
                                methodName: 'openWithSarifViewer',
                                resultsPath: resultsPath,
                                extensionId: 'MS-SarifVSCode.sarif-viewer',
                                ...getBaseEventInfo()
                            });

                            await newSarifExt.activate();

                            if (newSarifExt.exports && typeof newSarifExt.exports.openLogs === 'function') {
                                this.outputChannel.appendLine(Constants.Strings.CODEQL_OPENING_WITH_NEW_SARIF_VIEWER);
                                await newSarifExt.exports.openLogs([vscode.Uri.file(resultsPath)]);
                                this.outputChannel.appendLine(Constants.Strings.CODEQL_SARIF_VIEWER_OPENED);

                traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_SARIF_VIEWER_OPENED, {
                    methodName: 'openWithSarifViewer',
                    resultsPath: resultsPath,
                    extensionId: 'MS-SarifVSCode.sarif-viewer',
                    openedAfterInstall: true,
                    issueCount: this.getIssueCountFromResults(resultsPath),
                    ...getBaseEventInfo()
                });                                return;
                            }
                        }

                        this.outputChannel.appendLine(Constants.Strings.CODEQL_SARIF_VIEWER_API_NOT_AVAILABLE);

                        traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_SARIF_VIEWER_NOT_AVAILABLE, {
                            methodName: 'openWithSarifViewer',
                            resultsPath: resultsPath,
                            extensionId: 'MS-SarifVSCode.sarif-viewer',
                            reason: 'api_not_available_after_install',
                            ...getBaseEventInfo()
                        });

                        await this.fallbackToTextEditor(resultsPath);

                    } catch (installError) {
                        const errorMessage = installError instanceof Error ? installError.message : String(installError);
                        this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_SARIF_VIEWER_INSTALL_ERROR, errorMessage));
                        vscode.window.showErrorMessage(Constants.Strings.SARIF_VIEWER_INSTALL_FAILED);

                        traceError(Constants.EventNames.ACTIONS_HUB_CODEQL_SARIF_VIEWER_INSTALL_FAILED, installError as Error, {
                            methodName: 'openWithSarifViewer',
                            resultsPath: resultsPath,
                            extensionId: 'MS-SarifVSCode.sarif-viewer',
                            errorMessage: errorMessage,
                            ...getBaseEventInfo()
                        });

                        await this.fallbackToTextEditor(resultsPath);
                    }
                } else if (installExtension === Constants.Strings.OPEN_AS_TEXT) {
                    traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_SARIF_VIEWER_INSTALL_DECLINED, {
                        methodName: 'openWithSarifViewer',
                        resultsPath: resultsPath,
                        extensionId: 'MS-SarifVSCode.sarif-viewer',
                        userChoice: 'open_as_text',
                        ...getBaseEventInfo()
                    });

                    await this.fallbackToTextEditor(resultsPath);
                } else {
                    traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_SARIF_VIEWER_INSTALL_DECLINED, {
                        methodName: 'openWithSarifViewer',
                        resultsPath: resultsPath,
                        extensionId: 'MS-SarifVSCode.sarif-viewer',
                        userChoice: 'cancelled',
                        ...getBaseEventInfo()
                    });

                    this.outputChannel.appendLine(Constants.Strings.CODEQL_USER_CANCELLED);
                }
                return;
            }

            if (!sarifExt.isActive) {
                this.outputChannel.appendLine(Constants.Strings.CODEQL_ACTIVATING_SARIF_VIEWER);

                traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_SARIF_VIEWER_ACTIVATION_STARTED, {
                    methodName: 'openWithSarifViewer',
                    resultsPath: resultsPath,
                    extensionId: 'MS-SarifVSCode.sarif-viewer',
                    ...getBaseEventInfo()
                });

                await sarifExt.activate();

                traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_SARIF_VIEWER_ACTIVATION_COMPLETED, {
                    methodName: 'openWithSarifViewer',
                    resultsPath: resultsPath,
                    extensionId: 'MS-SarifVSCode.sarif-viewer',
                    ...getBaseEventInfo()
                });
            }

            if (sarifExt.exports && typeof sarifExt.exports.openLogs === 'function') {
                this.outputChannel.appendLine(Constants.Strings.CODEQL_OPENING_WITH_SARIF_VIEWER);
                await sarifExt.exports.openLogs([vscode.Uri.file(resultsPath)]);
                this.outputChannel.appendLine(Constants.Strings.CODEQL_SARIF_VIEWER_OPENED);

                traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_SARIF_VIEWER_OPENED, {
                    methodName: 'openWithSarifViewer',
                    resultsPath: resultsPath,
                    extensionId: 'MS-SarifVSCode.sarif-viewer',
                    openedAfterInstall: false,
                    issueCount: this.getIssueCountFromResults(resultsPath),
                    ...getBaseEventInfo()
                });
            } else {
                this.outputChannel.appendLine(Constants.Strings.CODEQL_SARIF_VIEWER_API_FALLBACK);

                traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_SARIF_VIEWER_API_ERROR, {
                    methodName: 'openWithSarifViewer',
                    resultsPath: resultsPath,
                    extensionId: 'MS-SarifVSCode.sarif-viewer',
                    reason: 'api_function_not_available',
                    exportsAvailable: !!sarifExt.exports,
                    ...getBaseEventInfo()
                });

                await this.fallbackToTextEditor(resultsPath);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_SARIF_VIEWER_ERROR, errorMessage));

            traceError(Constants.EventNames.ACTIONS_HUB_CODEQL_SARIF_VIEWER_API_ERROR, error as Error, {
                methodName: 'openWithSarifViewer',
                resultsPath: resultsPath,
                extensionId: 'MS-SarifVSCode.sarif-viewer',
                errorMessage: errorMessage,
                ...getBaseEventInfo()
            });

            await this.fallbackToTextEditor(resultsPath);
        }
    }    private async fallbackToTextEditor(resultsPath: string): Promise<void> {
        try {
            traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_FALLBACK_TO_TEXT_EDITOR, {
                methodName: 'fallbackToTextEditor',
                resultsPath: resultsPath,
                ...getBaseEventInfo()
            });

            // Offer to open the full SARIF file as text
            const openFile = await vscode.window.showInformationMessage(
                Constants.Strings.CODEQL_ANALYSIS_COMPLETED_OPEN_FILE,
                Constants.Strings.CODEQL_OPEN_RESULTS,
                Constants.Strings.CODEQL_CLOSE
            );

            if (openFile === Constants.Strings.CODEQL_OPEN_RESULTS) {
                const document = await vscode.workspace.openTextDocument(resultsPath);
                await vscode.window.showTextDocument(document);

                traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_RESULTS_PROCESSED, {
                    methodName: 'fallbackToTextEditor',
                    resultsPath: resultsPath,
                    openedInTextEditor: true,
                    ...getBaseEventInfo()
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_ERROR_OPENING_RESULTS, errorMessage));

            traceError(Constants.EventNames.ACTIONS_HUB_CODEQL_RESULTS_DISPLAY_FAILED, error as Error, {
                methodName: 'fallbackToTextEditor',
                resultsPath: resultsPath,
                errorMessage: errorMessage,
                ...getBaseEventInfo()
            });
        }
    }

    private async getCodeQLQuerySuite(sitePath: string, powerPagesSiteFolderExists: boolean): Promise<string> {
        const defaultQuerySuite = 'codeql/javascript-queries:codeql-suites/javascript-security-and-quality.qls';

        // Only check for config if Power Pages folder exists
        if (!powerPagesSiteFolderExists) {
            this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_USING_DEFAULT_QUERY, defaultQuerySuite));

            traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_CONFIG_FILE_READ, {
                methodName: this.getCodeQLQuerySuite.name,
                sitePath: sitePath,
                powerPagesSiteFolderExists: powerPagesSiteFolderExists,
                configFileExists: false,
                querySuite: defaultQuerySuite,
                reason: 'power_pages_folder_not_exists',
                ...getBaseEventInfo()
            });

            return defaultQuerySuite;
        }

        const configPath = path.join(sitePath, 'powerpages.config.json');

        try {
            if (fs.existsSync(configPath)) {
                this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_CONFIG_FILE_FOUND, configPath));

                const configContent = fs.readFileSync(configPath, 'utf8');
                const config: PowerPagesConfig = JSON.parse(configContent);

                if (config.codeQlQuery) {
                    this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_USING_CUSTOM_QUERY, config.codeQlQuery));
                    return config.codeQlQuery;
                } else {
                    // Add the default query suite to the existing config
                    config.codeQlQuery = defaultQuerySuite;
                    await this.updateConfigFile(configPath, config);
                    this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_ADDED_DEFAULT_QUERY_TO_CONFIG, defaultQuerySuite));
                    return defaultQuerySuite;
                }
            } else {
                // Create new config file with default query suite
                const config: PowerPagesConfig = {
                    codeQlQuery: defaultQuerySuite
                };
                await this.createConfigFile(configPath, config);
                this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_CREATED_CONFIG_FILE, configPath, defaultQuerySuite));
                return defaultQuerySuite;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_CONFIG_ERROR, errorMessage));
            this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_USING_DEFAULT_QUERY, defaultQuerySuite));
            return defaultQuerySuite;
        }
    }

    private async createConfigFile(configPath: string, config: PowerPagesConfig): Promise<void> {
        try {
            const configContent = JSON.stringify(config, null, 2);
            fs.writeFileSync(configPath, configContent, 'utf8');
            this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_CONFIG_FILE_CREATED_SUCCESSFULLY, configPath));

            traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_CONFIG_FILE_CREATED, {
                methodName: this.createConfigFile.name,
                configPath: configPath,
                configSize: configContent.length,
                hasCodeQlQuery: !!config.codeQlQuery,
                querySuite: config.codeQlQuery || 'undefined',
                ...getBaseEventInfo()
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_CONFIG_FILE_CREATE_ERROR, errorMessage));

            traceError(Constants.EventNames.ACTIONS_HUB_CODEQL_CONFIG_FILE_ERROR, error as Error, {
                methodName: this.createConfigFile.name,
                configPath: configPath,
                operation: 'create',
                errorMessage: errorMessage,
                ...getBaseEventInfo()
            });

            throw error;
        }
    }

    private async updateConfigFile(configPath: string, config: PowerPagesConfig): Promise<void> {
        try {
            const configContent = JSON.stringify(config, null, 2);
            fs.writeFileSync(configPath, configContent, 'utf8');
            this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_CONFIG_FILE_UPDATED_SUCCESSFULLY, configPath));

            traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_CONFIG_FILE_UPDATED, {
                methodName: this.updateConfigFile.name,
                configPath: configPath,
                configSize: configContent.length,
                hasCodeQlQuery: !!config.codeQlQuery,
                querySuite: config.codeQlQuery || 'undefined',
                ...getBaseEventInfo()
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.outputChannel.appendLine(vscode.l10n.t(Constants.Strings.CODEQL_CONFIG_FILE_UPDATE_ERROR, errorMessage));

            traceError(Constants.EventNames.ACTIONS_HUB_CODEQL_CONFIG_FILE_ERROR, error as Error, {
                methodName: this.updateConfigFile.name,
                configPath: configPath,
                operation: 'update',
                errorMessage: errorMessage,
                ...getBaseEventInfo()
            });

            throw error;
        }
    }

    private getIssueCountFromResults(resultsPath: string): number {
        try {
            if (!fs.existsSync(resultsPath)) {
                return 0;
            }

            const resultsContent = fs.readFileSync(resultsPath, 'utf8');
            const results = JSON.parse(resultsContent);

            if (results.runs && results.runs.length > 0) {
                const run = results.runs[0];
                if (run.results && run.results.length > 0) {
                    return run.results.length;
                }
            }

            return 0;
        } catch (error) {
            // If we can't read the results file, return 0
            return 0;
        }
    }

    public dispose(): void {
        this.outputChannel.dispose();
    }
}
