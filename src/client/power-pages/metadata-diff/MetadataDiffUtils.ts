/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from 'yaml';

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
    // Build a self‑contained HTML report (previously Markdown) so we can render it directly in a webview.
    const generatedOn = new Date().toLocaleString();

    const diffFiles = await getAllDiffFiles(workspacePath, storagePath);

    // Group by folder
    const folderStructure = new Map<string, DiffFile[]>();
    diffFiles.forEach(file => {
        const dirPath = path.dirname(file.relativePath) || '.';
        if (!folderStructure.has(dirPath)) {
            folderStructure.set(dirPath, []);
        }
        folderStructure.get(dirPath)!.push(file);
    });

    const sortedFolders = Array.from(folderStructure.keys()).sort();

    // Escape for both element text and attribute contexts. Adds quotes to address CodeQL finding.
    const escapeHtml = (value: string | undefined) => (value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    let body = `<h1>Power Pages Metadata Diff Report</h1>`;
    body += `<p class="meta">Generated on: ${escapeHtml(generatedOn)}</p>`;

    if (sortedFolders.length === 0) {
        body += '<p>No differences found.</p>';
    }

    for (const folder of sortedFolders) {
        const files = folderStructure.get(folder)!;
        const folderId = folder === '.' ? 'root' : folder;
        if (folder !== '.') {
            body += `<h2>${escapeHtml(folder)}</h2>`;
        } else {
            body += `<h2>Root</h2>`;
        }
        body += `<ul class="file-list" data-folder="${escapeHtml(folderId)}">`;
        const allowedChangeClasses = new Set(["modified","only-in-local","only-in-environment"]);
        for (const file of files.sort((a, b) => a.relativePath.localeCompare(b.relativePath))) {
            const rawChange = file.changes.toLowerCase().replace(/\s+/g,'-');
            // Map known values to canonical class names; fallback to 'modified' to avoid arbitrary injection
            let changeClass = "modified";
            if (rawChange.includes("only") && rawChange.includes("local")) {
                changeClass = "only-in-local";
            } else if (rawChange.includes("only") && (rawChange.includes("environment") || rawChange.includes("remote"))) {
                changeClass = "only-in-environment";
            } else if (rawChange === "modified") {
                changeClass = "modified";
            }
            if (!allowedChangeClasses.has(changeClass)) {
                changeClass = "modified";
            }
            body += `<li class="file-item ${changeClass}">`;
            body += `<div class="file-header"><span class="file-name">${escapeHtml(path.basename(file.relativePath))}</span>`;
            body += `<span class="change-tag">${escapeHtml(file.changes)}</span></div>`;

            // YAML property level differences
            if ((file.relativePath.toLowerCase().endsWith('.yml') || file.relativePath.toLowerCase().endsWith('.yaml')) && file.workspaceContent && file.storageContent && file.changes === 'Modified') {
                try {
                    const workspaceYaml = yaml.parse(file.workspaceContent);
                    const storageYaml = yaml.parse(file.storageContent);
                    const propertyChanges = findYamlPropertyChanges(workspaceYaml, storageYaml);
                    if (propertyChanges.length > 0) {
                        body += '<details class="prop-changes"><summary>Property changes</summary><ul>';
                        propertyChanges.forEach(change => {
                            body += `<li>${escapeHtml(change)}</li>`;
                        });
                        body += '</ul></details>';
                    }
                } catch (error: unknown) {
                    body += `<div class="error">Failed to parse YAML content: ${escapeHtml(error instanceof Error ? error.message : String(error))}</div>`;
                }
            }
            body += '</li>';
        }
        body += '</ul>';
    }

    // Lightweight styling – no external dependencies.
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" />
<style>
body{font-family:Segoe UI,Arial,sans-serif;padding:16px;line-height:1.4;}
h1{margin-top:0;font-size:20px;}
h2{margin-top:24px;font-size:16px;border-bottom:1px solid #ccc;padding-bottom:4px;}
.meta{color:#666;font-size:12px;margin-top:-4px;}
ul.file-list{list-style:none;margin:0;padding:0;}
li.file-item{margin:6px 0;padding:8px;border:1px solid #dcdcdc;border-radius:4px;background:var(--vscode-editor-background,#fff);}
.file-header{display:flex;justify-content:space-between;align-items:center;}
.file-name{font-weight:600;}
.change-tag{font-size:11px;padding:2px 6px;border-radius:12px;background:#e0e0e0;color:#333;text-transform:uppercase;letter-spacing:.5px;}
li.file-item.modified .change-tag{background:#fff4ce;color:#8a6d00;}
li.file-item['only-in-workspace'] .change-tag, li.file-item.only-in-workspace .change-tag{background:#dff6dd;color:#0e700e;}
li.file-item['only-in-remote'] .change-tag, li.file-item.only-in-remote .change-tag{background:#fde7e9;color:#a4262c;}
details.prop-changes{margin-top:4px;}
details.prop-changes summary{cursor:pointer;font-weight:600;}
details.prop-changes ul{margin:4px 0 0 16px;padding:0;}
details.prop-changes li{list-style:disc;margin-left:16px;}
.error{color:#a4262c;font-size:12px;margin-top:4px;}
</style></head><body>${body}</body></html>`;

    return html;
}

/**
 * Finds differences between two YAML objects and returns a list of changes
 * @param workspaceObj The workspace YAML object
 * @param storageObj The storage YAML object
 * @returns An array of change descriptions
 */
function findYamlPropertyChanges(workspaceObj: unknown, storageObj: unknown, path = ''): string[] {
    const isObj = (o: unknown): o is Record<string, unknown> => typeof o === 'object' && o !== null && !Array.isArray(o);
    if (!isObj(workspaceObj) || !isObj(storageObj)) {
        return [];
    }

    const changes: string[] = [];
    const workspaceKeys = Object.keys(workspaceObj);
    for (const key of workspaceKeys) {
        const currentPath = path ? `${path}.${key}` : key;
        if (!(key in storageObj)) {
            changes.push(`Added property: \`${currentPath}\``);
            continue;
        }
        const wVal = workspaceObj[key];
        const sVal = (storageObj as Record<string, unknown>)[key];
        if (isObj(wVal) && isObj(sVal)) {
            changes.push(...findYamlPropertyChanges(wVal, sVal, currentPath));
        } else if (JSON.stringify(wVal) !== JSON.stringify(sVal)) {
            changes.push(`Modified property: \`${currentPath}\``);
        }
    }
    const storageKeys = Object.keys(storageObj);
    for (const key of storageKeys) {
        if (!(key in workspaceObj)) {
            const currentPath = path ? `${path}.${key}` : key;
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
                changes: 'Only in Local',
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
                changes: 'Only in Environment',
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
