/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import { getDependencies } from "./DataParser";
import { DyanmicEntity } from './DataParserRule';
import { IItem } from './TreeView/Types/Entity/IItem';
import { globalWebsiteIItem, globalwebPageIItem } from './DataMapper';

export class MyReferenceProvider implements vscode.ReferenceProvider {
    async provideReferences(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.ReferenceContext,
        token: vscode.CancellationToken
    ): Promise<vscode.Location[]> {
        const selection = vscode.window.activeTextEditor?.selection;
        if (!selection) {
            return [];
        }
        const startLine = selection.start.line;
        const endLine = selection.end.line;

        const selectedLines: string[] = [];
        for (let line = startLine; line <= endLine; line++) {
            const lineText = document.lineAt(line).text;
            selectedLines.push(lineText);
        }
        const selectedText = document.getText(selection);
        const selectedTextLine = selectedLines.join('\n');
        const dependencies = getDependencies(selectedTextLine);
        const locations: vscode.Location[] = [];
        if (dependencies.length === 0) {
            findText(selectedText, globalWebsiteIItem, locations);
        } else {
            processDependencies(dependencies, locations);
        }
        return locations;
    }
}

function findText(selectedText: string, globalWebsiteIItem: IItem, locations: vscode.Location[]) {
    for (const entityIItem of globalWebsiteIItem.children) {
        if (entityIItem.label == 'Web Page') {
            globalwebPageIItem.children.forEach((item: IItem) => {
                const pgcy = item.children.find(child => child.label === "Page Copy");
                const pgsy = item.children.find(child => child.label === "Page Summary");
                const cp = item.children.find(child => child.label === "Content Page")
                const cppgcy = cp?.children.find(child => child.label === "Page Copy");
                const cppgsy = cp?.children.find(child => child.label === "Page Summary");

                findTextInFile(pgcy, selectedText, locations);
                findTextInFile(pgsy, selectedText, locations);
                findTextInFile(cppgcy, selectedText, locations);
                findTextInFile(cppgsy, selectedText, locations);
            })
        } else {
            for (const iitem of entityIItem.children) {
                findTextInFile(iitem, selectedText, locations);
            }
        }
    }
}

function findTextInFile(entityIItem: any, selectedText: any, locations: vscode.Location[]) {
    let file = entityIItem.children.find((child: IItem) => child.isFile === true);
    const filePath = file?.path?.fsPath;
    if (!filePath) {
        return;
    }

    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split(/\r?\n/);

        for (let i = 0; i < lines.length; i++) {
            let startIndex = 0;
            while ((startIndex = lines[i].indexOf(selectedText, startIndex)) !== -1) {
                const entityPosition = new vscode.Position(i, startIndex);
                const entityLocation = new vscode.Location(vscode.Uri.file(filePath), entityPosition);
                locations.push(entityLocation);
                startIndex += selectedText.length;
            }
        }
    } catch (error) {
        console.error('Error reading file:', error);
    }
}

function processDependencies(dependencies: DyanmicEntity[], locations: vscode.Location[]) {
    dependencies.forEach((entity: any) => {
        const tagName = entity.tagName.replace(/^['"](.*)['"]$/, '$1');
        const property = entity.property.replace(/^['"](.*)['"]$/, '$1');
        const fileNameOrID = entity.fileNameOrID.replace(/^['"](.*)['"]$/, '$1');
        if (tagName === "snippets" || tagName === "snippet" || (tagName === 'editable' && (property === "snippets" || property === "snippet"))) {
            const contentSnippetIItem = globalWebsiteIItem.children.find((child: IItem) => child.label === 'Content Snippets');
            if (contentSnippetIItem) {
                processEntity(contentSnippetIItem, entity, locations, 'label', '07');
            }
        } else if (tagName === "Web Template") {
            const webtemplateIItem = globalWebsiteIItem.children.find((child: IItem) => child.label === 'Web Templates');
            if (webtemplateIItem) {
                processEntity(webtemplateIItem, entity, locations, 'label', '08');
            }
        } else if (tagName === "entityform" || tagName === "entity_form") {
            const entityFormtIItem = globalWebsiteIItem.children.find((child: IItem) => child.label === 'Basic Forms');
            if (entityFormtIItem) {
                if (property == 'id' && isNaN(fileNameOrID)) {
                    processEntity(entityFormtIItem, entity, locations, 'id', '015');
                } else if (property == 'name' || property == 'key') {
                    processEntity(entityFormtIItem, entity, locations, 'label', '015')
                } else {
                    console.log("Not Valid EnitityForm");
                }
            }
        } else if (tagName === "entitylist" || tagName === "entity_list") {
            const listIItem = globalWebsiteIItem.children.find((child: IItem) => child.label === 'Lists');
            if (listIItem) {
                if (property == 'id' && isNaN(fileNameOrID)) {
                    processEntity(listIItem, entity, locations, 'id', '017');
                } else if (property == 'name' || property == 'key') {
                    processEntity(listIItem, entity, locations, 'label', '017')
                } else {
                    console.log("Not Valid EntityList");
                }
            }
        } else if (tagName === "webform") {
            const webFormIItem = globalWebsiteIItem.children.find((child: IItem) => child.label === 'Advanced Forms');
            if (webFormIItem) {
                if (property == 'id' && isNaN(fileNameOrID)) {
                    processEntity(webFormIItem, entity, locations, 'id', '019');
                } else if (property == 'name' || property == 'key') {
                    processEntity(webFormIItem, entity, locations, 'label', '019')
                } else {
                    console.log("Not Valid WebForm");
                }
            }
        } else if ((tagName != "entityform" && tagName != "entity_form") && (tagName != "entitylist" && tagName != "entity_list") && tagName !== "editable") {
            entity.fileNameOrID = tagName;
            entity.tagName = 'Web Template';
            const webtemplateIItem = globalWebsiteIItem.children.find((child: IItem) => child.label === 'Web Templates');
            if (webtemplateIItem) {
                processEntity(webtemplateIItem, entity, locations, 'label', '08');
            }
        } else {
            console.log("Another Dynamic entity");
        }
    })
}


function processEntity(targetIItem: IItem, entity: any, locations: vscode.Location[], compareBy: string, comp: string) {
    const fileNameOrID = entity.fileNameOrID.replace(/^['"](.*)['"]$/, '$1');
    const tagName = entity.tagName.replace(/^['"](.*)['"]$/, '$1');
    targetIItem.children.forEach((targetItem: IItem) => {
        const compareValue = compareBy === 'label' ? targetItem.label : targetItem.id;
        if (compareValue === fileNameOrID) {
            const IITem = targetItem.parentList;
            if (IITem) {
                for (const iitem of IITem) {
                    const file = iitem.children.find((child: IItem) => child.isFile === true);
                    if (file) {
                        addFileLocations(file, locations, entity);
                    }
                }
            }
        }
    });
}

function addFileLocations(file: IItem, locations: vscode.Location[], entity: DyanmicEntity) {
    const filePath = file?.path?.fsPath;
    if (!filePath) {
        return;
    }
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split(/\r?\n/);
        let file = entity.fileNameOrID?.replace(/^['"](.*)['"]$/, '$1');
        let tagName = entity.tagName.replace(/^['"](.*)['"]$/, '$1');
        const property = entity.property.replace(/^['"](.*)['"]$/, '$1');

        if (!file) {
            return;
        }
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(file)) {
                const dep = getDependencies(lines[i]);
                dep.forEach((de: any) => {
                    let tag = de.tagName.replace(/^['"](.*)['"]$/, '$1');
                    const pro = de.property.replace(/^['"](.*)['"]$/, '$1');
                    let fn = de.fileNameOrID?.replace(/^['"](.*)['"]$/, '$1');
                    if (tag !== 'snippets' && tag !== 'snippet' && tag !== 'editable' && tag !== 'Web Template' && tag !== "webform" && tag !== "entityform" && tag !== "entity_form" && tag !== "entitylist" && tag !== "entity_list") {
                        fn = tag;
                        tag = 'Web Template';
                    }
                    if (tag == tagName && fn == file) {
                        const entityPosition = new vscode.Position(i, 0);
                        const entityLocation = new vscode.Location(vscode.Uri.file(filePath), entityPosition);
                        locations.push(entityLocation);
                    } else if ((tag == 'snippets' && (tagName === 'snippets' || tagName === 'snippet')) || (tagName == 'snippets' && (tag === 'snippets' || tag === 'snippet')) && fn == file) {
                        const entityPosition = new vscode.Position(i, 0);
                        const entityLocation = new vscode.Location(vscode.Uri.file(filePath), entityPosition);
                        locations.push(entityLocation);
                    } else if (tagName === 'editable' && (property === "snippets" || property === "snippet")) {
                        if ((tag === 'snippets' || tag === 'snippet') && fn == file) {
                            const entityPosition = new vscode.Position(i, 0);
                            const entityLocation = new vscode.Location(vscode.Uri.file(filePath), entityPosition);
                            locations.push(entityLocation);
                        }
                    } else if (tag === 'editable' && (pro === "snippets" || pro === "snippet")) {
                        if ((tagName === 'snippets' || tagName === 'snippet') && fn == file) {
                            const entityPosition = new vscode.Position(i, 0);
                            const entityLocation = new vscode.Location(vscode.Uri.file(filePath), entityPosition);
                            locations.push(entityLocation);
                        }
                    } else if (((tag === 'entity_form' && tagName === 'entityform') || (tagName === 'entity_form' && tag === 'entityform')) && fn == file) {
                        const entityPosition = new vscode.Position(i, 0);
                        const entityLocation = new vscode.Location(vscode.Uri.file(filePath), entityPosition);
                        locations.push(entityLocation);
                    } else if (((tag === 'entity_list' && tagName === 'entitylist') || (tagName === 'entity_list' && tag === 'entitylist')) && fn == file) {
                        const entityPosition = new vscode.Position(i, 0);
                        const entityLocation = new vscode.Location(vscode.Uri.file(filePath), entityPosition);
                        locations.push(entityLocation);
                    }
                })
            }
        }
    } catch (error) {
        console.error('Error reading file:', error);
    }
}
