/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import { ECSFeaturesClient } from "../../../common/ecs-features/ecsFeatureClient";
import { EnableMetadataDiff } from "../../../common/ecs-features/ecsFeatureGates";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { Constants, SUCCESS } from "../../../common/power-pages/metadata-diff/Constants";
import { MetadataDiffTreeDataProvider } from "../../../common/power-pages/metadata-diff/MetadataDiffTreeDataProvider";
import { PacTerminal } from "../../lib/PacTerminal";
import { createAuthProfileExp } from "../../../common/utilities/PacAuthUtil";
import path from "path";
import { getWebsiteRecordId } from "../../../common/utilities/WorkspaceInfoFinderUtil";
import { PagesList } from "../../pac/PacTypes";

interface DiffFile {
    relativePath: string;
    changes: string;
    type: string;
    workspaceContent?: string;
    storageContent?: string;
}

interface MetadataDiffReport {
    generatedOn: string;
    files: DiffFile[];
}

export class MetadataDiffDesktop {
    private static _isInitialized = false;

    static isEnabled(): boolean {
        const enableMetadataDiff = ECSFeaturesClient.getConfig(EnableMetadataDiff).enableMetadataDiff

        if (enableMetadataDiff === undefined) {
            return false;
        }

        return enableMetadataDiff;
    }

    static async initialize(context: vscode.ExtensionContext, pacTerminal: PacTerminal): Promise<void> {
        if (MetadataDiffDesktop._isInitialized) {
            return;
        }

        // Register command for handling file diffs
        vscode.commands.registerCommand('metadataDiff.openDiff', async (workspaceFile: string, storedFile: string) => {
            try {
                const workspaceUri = vscode.Uri.file(workspaceFile);
                const storedUri = vscode.Uri.file(storedFile);
                const fileName = path.basename(workspaceFile);

                await vscode.commands.executeCommand('vscode.diff',
                    storedUri,
                    workspaceUri,
                    `${fileName} (Metadata Diff)`
                );
            } catch (error) {
                oneDSLoggerWrapper.getLogger().traceError(
                    Constants.EventNames.METADATA_DIFF_REPORT_FAILED,
                    error as string,
                    error as Error
                );
                vscode.window.showErrorMessage("Failed to open diff view");
            }
        });

        vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.triggerFlow", async () => {
            try {
                const orgUrl = await vscode.window.showInputBox({
                    prompt: "Enter the organization URL",
                    placeHolder: "https://your-org.crm.dynamics.com"
                });

                if (!orgUrl) {
                    vscode.window.showErrorMessage("Organization URL is required to trigger the metadata diff flow.");
                    return;
                }

                const urlPattern = /^https:\/\/[a-zA-Z0-9.-]+\d*\.crm\.dynamics\.com\/?$/;
                if (!urlPattern.test(orgUrl)) {
                    vscode.window.showErrorMessage("Invalid organization URL. Please enter a valid URL in the format: https://your-org.crm.dynamics.com", { modal: true });
                    return;
                }

                const pacWrapper = pacTerminal.getWrapper()
                const pacActiveOrg = await pacWrapper.activeOrg();
                if(pacActiveOrg){
                    if (pacActiveOrg.Status === SUCCESS) {
                        if(pacActiveOrg.Results.OrgUrl == orgUrl){
                            vscode.window.showInformationMessage("Already connected to the specified environment.");
                        }
                        else{
                            const pacOrgSelect = await pacWrapper.orgSelect(orgUrl);
                            if(pacOrgSelect && pacOrgSelect.Status === SUCCESS){
                                vscode.window.showInformationMessage("Environment switched successfully.");
                            }
                            else{
                                vscode.window.showErrorMessage("Failed to switch the environment.");
                                return;
                            }
                        }
                    }
                    else{
                        await createAuthProfileExp(pacWrapper, orgUrl);
                        vscode.window.showInformationMessage("Auth profile created successfully.");
                    }
                }
                else {
                    vscode.window.showErrorMessage("Failed to fetch the current environment details.");
                    return;
                }

                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders || workspaceFolders.length === 0) {
                    vscode.window.showErrorMessage("No folders opened in the current workspace.");
                    return;
                }

                const currentWorkspaceFolder = workspaceFolders[0].uri.fsPath;
                const websiteId = getWebsiteRecordId(currentWorkspaceFolder);
                path.join(websiteId, "metadataDiffStorage");
                const storagePath = context.storageUri?.fsPath;
                if (!storagePath) {
                    throw new Error("Storage path is not defined");
                }

                // Clean out any existing files in storagePath (so we have a "fresh" download)
                if (fs.existsSync(storagePath)) {
                    fs.rmSync(storagePath, { recursive: true, force: true });
                }
                fs.mkdirSync(storagePath, { recursive: true });
                const progressOptions: vscode.ProgressOptions = {
                    location: vscode.ProgressLocation.Notification,
                    title: "Downloading website metadata",
                    cancellable: false
                };
                let pacPagesDownload;
                await vscode.window.withProgress(progressOptions, async (progress) => {
                    progress.report({ message: "Looking for this website in the connected environment..." });
                    const pacPagesList = await this.getPagesList(pacTerminal);
                    if (pacPagesList && pacPagesList.length > 0) {
                        const websiteRecord = pacPagesList.find((record) => record.id === websiteId);
                        if (!websiteRecord) {
                            vscode.window.showErrorMessage("Website not found in the connected environment.");
                            return;
                        }
                        progress.report({ message: `Downloading "${websiteRecord.name}" as ${websiteRecord.modelVersion === "v2" ? "enhanced" : "standard"} data model. Please wait...` });
                        pacPagesDownload = await pacWrapper.pagesDownload(storagePath, websiteId, websiteRecord.modelVersion == "v1" ? "1" : "2");
                        vscode.window.showInformationMessage("Download completed.");
                    }
                });
                if (pacPagesDownload) {
                    const treeDataProvider = MetadataDiffTreeDataProvider.initialize(context);
                    context.subscriptions.push(
                        vscode.window.registerTreeDataProvider("microsoft.powerplatform.pages.metadataDiff", treeDataProvider)
                    );
                }
                else{
                    vscode.window.showErrorMessage("Failed to download metadata.");
                }

            }
            catch (error) {
                oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.METADATA_DIFF_REFRESH_FAILED, error as string, error as Error, { methodName: null }, {});
            }
        });

        vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.generateReport", async () => {
            try {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders) {
                    vscode.window.showErrorMessage("No workspace folder open");
                    return;
                }

                const storagePath = context.storageUri?.fsPath;
                if (!storagePath) {
                    vscode.window.showErrorMessage("Storage path not found");
                    return;
                }

                // Generate report content
                const reportContent = await generateDiffReport(workspaceFolders[0].uri.fsPath, storagePath);

                // Create and show the report document
                const doc = await vscode.workspace.openTextDocument({
                    content: reportContent,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc, {
                    preview: true,
                    viewColumn: vscode.ViewColumn.Beside
                });
            } catch (error) {
                oneDSLoggerWrapper.getLogger().traceError(
                    Constants.EventNames.METADATA_DIFF_REPORT_FAILED,
                    error as string,
                    error as Error
                );
                vscode.window.showErrorMessage("Failed to generate metadata diff report");
            }
        });

        vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.exportReport", async () => {
            try {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders) {
                    vscode.window.showErrorMessage("No workspace folder open");
                    return;
                }

                const storagePath = context.storageUri?.fsPath;
                if (!storagePath) {
                    vscode.window.showErrorMessage("Storage path not found");
                    return;
                }

                // Get diff files
                const diffFiles = await getAllDiffFiles(workspaceFolders[0].uri.fsPath, storagePath);

                // Create report object
                const report: MetadataDiffReport = {
                    generatedOn: new Date().toISOString(),
                    files: diffFiles
                };

                // Save dialog
                const saveUri = await vscode.window.showSaveDialog({
                    defaultUri: vscode.Uri.file('metadata-diff-report.json'),
                    filters: {
                        'JSON files': ['json']
                    }
                });

                if (saveUri) {
                    fs.writeFileSync(saveUri.fsPath, JSON.stringify(report, null, 2));
                    vscode.window.showInformationMessage("Report exported successfully");
                }
            } catch (error) {
                oneDSLoggerWrapper.getLogger().traceError(
                    Constants.EventNames.METADATA_DIFF_REPORT_FAILED,
                    error as string,
                    error as Error
                );
                vscode.window.showErrorMessage("Failed to export metadata diff report");
            }
        });

        vscode.commands.registerCommand("microsoft.powerplatform.pages.metadataDiff.importReport", async () => {
            try {
                const fileUri = await vscode.window.showOpenDialog({
                    canSelectFiles: true,
                    canSelectFolders: false,
                    canSelectMany: false,
                    filters: {
                        'JSON files': ['json']
                    }
                });

                if (fileUri && fileUri[0]) {
                    const reportContent = fs.readFileSync(fileUri[0].fsPath, 'utf8');
                    const report = JSON.parse(reportContent) as MetadataDiffReport;

                    // Clean up any existing tree data provider
                    const treeDataProvider = new MetadataDiffTreeDataProvider(context);

                    // Update the tree with imported data
                    await treeDataProvider.setDiffFiles(report.files);

                    // Register the new tree data provider
                    context.subscriptions.push(
                        vscode.window.registerTreeDataProvider("microsoft.powerplatform.pages.metadataDiff", treeDataProvider)
                    );

                    vscode.window.showInformationMessage("Report imported successfully");
                }
            } catch (error) {
                oneDSLoggerWrapper.getLogger().traceError(
                    Constants.EventNames.METADATA_DIFF_REPORT_FAILED,
                    error as string,
                    error as Error
                );
                vscode.window.showErrorMessage("Failed to import metadata diff report");
            }
        });

        try {
            const isMetadataDiffEnabled = MetadataDiffDesktop.isEnabled();

            oneDSLoggerWrapper.getLogger().traceInfo("EnableMetadataDiff", {
                isEnabled: isMetadataDiffEnabled.toString()
            });

            vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.metadataDiffEnabled", isMetadataDiffEnabled);

            if (!isMetadataDiffEnabled) {
                return;
            }

            const storagePath = context.storageUri?.fsPath;
            if (!storagePath) {
                throw new Error("Storage path is not defined");
            }
            if (fs.existsSync(storagePath)) {
                fs.rmSync(storagePath, { recursive: true, force: true });
            }
            fs.mkdirSync(storagePath, { recursive: true });

            const treeDataProvider = MetadataDiffTreeDataProvider.initialize(context);
            context.subscriptions.push(
                vscode.window.registerTreeDataProvider("microsoft.powerplatform.pages.metadataDiff", treeDataProvider)
            );

            MetadataDiffDesktop._isInitialized = true;
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.METADATA_DIFF_INITIALIZED);
        } catch (exception) {
            const exceptionError = exception as Error;
            oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.METADATA_DIFF_INITIALIZATION_FAILED, exceptionError.message, exceptionError);
        }
    }

    static async getPagesList(pacTerminal: PacTerminal): Promise<{ name: string, id: string, modelVersion: string }[]> {
        const pacWrapper = pacTerminal.getWrapper();
        const pagesListOutput = await pacWrapper.pagesList();
        if (pagesListOutput && pagesListOutput.Status === SUCCESS && pagesListOutput.Information) {
            // Parse the list of pages from the string output
            const pagesList: PagesList[] = [];
            if (Array.isArray(pagesListOutput.Information)) {
                // If Information is already an array of strings
                pagesListOutput.Information.forEach(line => {
                    // Skip empty lines or header lines
                    if (!line.trim() || !line.includes('[')) {
                        return;
                    }

                    // Extract the relevant parts using regex
                    const match = line.match(/\[\d+\]\s+([a-f0-9-]+)\s+(.*?)\s+(v[12])\s*$/i);
                    if (match) {
                        pagesList.push({
                            WebsiteId: match[1].trim(),
                            FriendlyName: match[2].trim(),
                            ModelVersion: match[3].trim()
                        });
                    }
                });
            }
            return pagesList.map((site) => {
                return {
                    name: site.FriendlyName,
                    id: site.WebsiteId,
                    modelVersion: site.ModelVersion
                }
            });
        }

        return [];
    }
}

async function generateDiffReport(workspacePath: string, storagePath: string): Promise<string> {
    let report = '# Power Pages Metadata Diff Report\n\n';
    report += `Generated on: ${new Date().toLocaleString()}\n\n`;

    // Get diff files
    const diffFiles = await getAllDiffFiles(workspacePath, storagePath);

    // Group by folders
    const folderStructure = new Map<string, DiffFile[]>();
    diffFiles.forEach(file => {
        const dirPath = path.dirname(file.relativePath);
        if (!folderStructure.has(dirPath)) {
            folderStructure.set(dirPath, []);
        }
        folderStructure.get(dirPath)!.push(file);
    });

    // Sort folders and generate report
    const sortedFolders = Array.from(folderStructure.keys()).sort();
    for (const folder of sortedFolders) {
        const files = folderStructure.get(folder)!;

        // Add folder header (skip for root)
        if (folder !== '.') {
            report += `## ${folder}\n\n`;
        }

        // Add files
        for (const file of files.sort((a, b) => a.relativePath.localeCompare(b.relativePath))) {
            report += `- ${path.basename(file.relativePath)}\n`;
            report += `  - Changes: ${file.changes}\n`;
        }
        report += '\n';
    }

    return report;
}

async function getAllDiffFiles(workspacePath: string, storagePath: string): Promise<DiffFile[]> {
    const diffFiles: DiffFile[] = [];

    // Get website directory from storage path
    const folderNames = fs.readdirSync(storagePath).filter(file =>
        fs.statSync(path.join(storagePath, file)).isDirectory()
    );
    if (folderNames.length === 0) {
        return diffFiles;
    }
    const websitePath = path.join(storagePath, folderNames[0]);

    // Get all files
    const workspaceFiles = await getAllFiles(workspacePath);
    const storageFiles = await getAllFiles(websitePath);

    // Create normalized path maps
    const workspaceMap = new Map(workspaceFiles.map(f => {
        const normalized = path.relative(workspacePath, f).replace(/\\/g, '/');
        return [normalized, f];
    }));
    const storageMap = new Map(storageFiles.map(f => {
        const normalized = path.relative(websitePath, f).replace(/\\/g, '/');
        return [normalized, f];
    }));

    // Compare files
    for (const [normalized, workspaceFile] of workspaceMap.entries()) {
        const storageFile = storageMap.get(normalized);
        if (!storageFile) {
            diffFiles.push({
                relativePath: normalized,
                changes: 'Only in workspace',
                type: getFileType(normalized),
                workspaceContent: fs.readFileSync(workspaceFile, 'utf8').replace(/\r\n/g, '\n')
            });
            continue;
        }

        // Compare content
        const workspaceContent = fs.readFileSync(workspaceFile, 'utf8').replace(/\r\n/g, '\n');
        const storageContent = fs.readFileSync(storageFile, 'utf8').replace(/\r\n/g, '\n');
        if (workspaceContent !== storageContent) {
            diffFiles.push({
                relativePath: normalized,
                changes: 'Modified',
                type: getFileType(normalized),
                workspaceContent,
                storageContent
            });
        }
    }

    // Check for files only in storage
    for (const [normalized, storageFile] of storageMap.entries()) {
        if (!workspaceMap.has(normalized)) {
            diffFiles.push({
                relativePath: normalized,
                changes: 'Only in remote',
                type: getFileType(normalized),
                storageContent: fs.readFileSync(storageFile, 'utf8').replace(/\r\n/g, '\n')
            });
        }
    }

    return diffFiles;
}

async function getAllFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    function traverse(currentPath: string) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            if (entry.isDirectory()) {
                traverse(fullPath);
            } else {
                files.push(fullPath);
            }
        }
    }

    traverse(dirPath);
    return files;
}

function getFileType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath).toLowerCase();

    if (basename === 'webrole.yml') return 'Roles';
    if (basename === 'websitelanguage.yml') return 'Languages';
    if (ext === '.yml' && filePath.includes('webpages')) return 'Pages';
    if (ext === '.yml' && filePath.includes('webtemplates')) return 'Templates';
    if (ext === '.yml' && filePath.includes('webfiles')) return 'Files';

    return 'Other';
}

function groupDiffsByType(files: DiffFile[]): Record<string, DiffFile[]> {
    return files.reduce((groups: Record<string, DiffFile[]>, file) => {
        const type = file.type || 'Other';
        if (!groups[type]) {
            groups[type] = [];
        }
        groups[type].push(file);
        return groups;
    }, {});
}
