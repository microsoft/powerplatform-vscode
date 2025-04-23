/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as fs from "fs";
import * as path from "path";

export interface DiffFile {
    relativePath: string;
    changes: string;
    type: string;
    workspaceContent?: string;
    storageContent?: string;
}

export interface MetadataDiffReport {
    generatedOn: string;
    files: DiffFile[];
}

export async function generateDiffReport(workspacePath: string, storagePath: string): Promise<string> {
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

export async function getAllDiffFiles(workspacePath: string, storagePath: string): Promise<DiffFile[]> {
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
                type: path.dirname(normalized) || 'Other',
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
                type: path.dirname(normalized) || 'Other',
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
                type: path.dirname(normalized) || 'Other',
                storageContent: fs.readFileSync(storageFile, 'utf8').replace(/\r\n/g, '\n')
            });
        }
    }

    return diffFiles;
}

export async function getAllFiles(dirPath: string): Promise<string[]> {
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

export function groupDiffsByType(files: DiffFile[]): Record<string, DiffFile[]> {
    return files.reduce((groups: Record<string, DiffFile[]>, file) => {
        const type = file.type || 'Other';
        if (!groups[type]) {
            groups[type] = [];
        }
        groups[type].push(file);
        return groups;
    }, {});
}
