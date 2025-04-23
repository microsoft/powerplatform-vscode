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
    for (let i = 0; i < sortedFolders.length; i++) {
        const folder = sortedFolders[i];
        const files = folderStructure.get(folder)!;

        // Add folder header (skip for root)
        if (folder !== '.') {
            report += `## ${folder}\n\n`;
        }

        // Add files
        for (const file of files.sort((a, b) => a.relativePath.localeCompare(b.relativePath))) {
            report += `- ${path.basename(file.relativePath)}\n`;
            report += `  - Changes: ${file.changes}\n`;

            // Add detailed YAML property changes for YAML files
            if (path.extname(file.relativePath).toLowerCase() === '.yml' ||
                path.extname(file.relativePath).toLowerCase() === '.yaml') {
                try {
                    if (file.workspaceContent && file.storageContent && file.changes === 'Modified') {
                        const yaml = require('yaml');
                        const workspaceYaml = yaml.parse(file.workspaceContent);
                        const storageYaml = yaml.parse(file.storageContent);

                        const propertyChanges = findYamlPropertyChanges(workspaceYaml, storageYaml);

                        if (propertyChanges.length > 0) {
                            report += `  - Property changes:\n`;
                            propertyChanges.forEach(change => {
                                report += `    - ${change}\n`;
                            });
                        }
                    }
                } catch (error) {
                    report += `  - Failed to parse YAML content: ${error}\n`;
                }
            }
        }

        // Only add a blank line between folders, not after the last folder
        if (i < sortedFolders.length - 1) {
            report += '\n';
        }
    }

    return report;
}

/**
 * Finds differences between two YAML objects and returns a list of changes
 * @param workspaceObj The workspace YAML object
 * @param storageObj The storage YAML object
 * @returns An array of change descriptions
 */
function findYamlPropertyChanges(workspaceObj: any, storageObj: any, path = ''): string[] {
    if (!workspaceObj || !storageObj) {
        return [];
    }

    const changes: string[] = [];

    // Check all properties in workspace object
    const workspaceKeys = Object.keys(workspaceObj);
    for (const key of workspaceKeys) {
        const currentPath = path ? `${path}.${key}` : key;

        // Check if key exists in storage
        if (!(key in storageObj)) {
            changes.push(`Added property: \`${currentPath}\``);
            continue;
        }

        // Check if both values are objects (for nested properties)
        if (typeof workspaceObj[key] === 'object' && workspaceObj[key] !== null &&
            typeof storageObj[key] === 'object' && storageObj[key] !== null) {
            // Recursively check nested objects
            const nestedChanges = findYamlPropertyChanges(
                workspaceObj[key],
                storageObj[key],
                currentPath
            );
            changes.push(...nestedChanges);
        }
        // Check primitive values (string, number, boolean, etc.)
        else if (JSON.stringify(workspaceObj[key]) !== JSON.stringify(storageObj[key])) {
            changes.push(`Modified property: \`${currentPath}\``);
        }
    }

    // Check for properties that exist in storage but not in workspace
    const storageKeys = Object.keys(storageObj);
    for (const key of storageKeys) {
        const currentPath = path ? `${path}.${key}` : key;
        if (!(key in workspaceObj)) {
            changes.push(`Removed property: \`${currentPath}\``);
        }
    }

    return changes;
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
