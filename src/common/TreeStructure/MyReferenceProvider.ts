/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import { getDependencies } from "./DataParser";
import { DyanmicEntity } from './DataParserRule';
import { IItem } from './TreeView/Types/Entity/IItem';
import { globalWebsiteIItem, globalwebPageIItem } from './DataMapper'
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
            helper(dependencies, globalWebsiteIItem, locations, selectedTextLine);
        }
        return locations;
    }
}
function findText(selectedText: string,globalWebsiteIItem: IItem, locations: vscode.Location[]){
    for (const entityIItem of globalWebsiteIItem.children) {
        if (entityIItem.label == 'Web Page') {
            globalwebPageIItem.children.forEach((item: IItem) => {
                const pgcy = item.children.find(child => child.label === "Page Copy");
                const pgsy = item.children.find(child => child.label === "Page Summary");
                const cp = item.children.find(child => child.label === "Content Page")
                const cppgcy = cp?.children.find(child => child.label === "Page Copy");
                const cppgsy = cp?.children.find(child => child.label === "Page Summary");

                helperforText(pgcy, selectedText, locations);
                helperforText(pgsy, selectedText, locations);
                helperforText(cppgcy, selectedText, locations);
                helperforText(cppgsy, selectedText, locations);
            })
        } else {
            for (const iitem of entityIItem.children) {
                helperforText(iitem, selectedText, locations);
            }
        }
    }
}

function helperforText(entityIItem: any, selectedText: any, locations: vscode.Location[]) {
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

function helper(dependencies: DyanmicEntity[], globalWebsiteIItem: IItem, locations: vscode.Location[], selectedText: string) {
    dependencies.forEach((entity: any) => {
        for (const entityIItem of globalWebsiteIItem.children) {
            if (entityIItem.label == 'Web Page') {
                globalwebPageIItem.children.forEach((item: IItem) => {
                    const pgcy = item.children.find(child => child.label === "Page Copy");
                    const pgsy = item.children.find(child => child.label === "Page Summary");
                    const cp = item.children.find(child => child.label === "Content Page")
                    const cppgcy = cp?.children.find(child => child.label === "Page Copy");
                    const cppgsy = cp?.children.find(child => child.label === "Page Summary");

                    helper1(pgcy, entity, locations);
                    helper1(pgsy, entity, locations);
                    helper1(cppgcy, entity, locations);
                    helper1(cppgsy, entity, locations);
                })
            } else {
                for (const iitem of entityIItem.children) {
                    helper1(iitem, entity, locations);
                }
            }
        }
    })
}

function helper1(entityIItem: any, entity: any, locations: vscode.Location[]) {
    const tagName = entity.tagName.replace(/^['"](.*)['"]$/, '$1');
    const property = entity.property.replace(/^['"](.*)['"]$/, '$1');
    const fileNameOrID = entity.fileNameOrID.replace(/^['"](.*)['"]$/, '$1');
    if (tagName === "snippets" || tagName === "snippet" || (tagName === 'editable' && (property === "snippets" || property === "snippet"))) {
        helper2(entityIItem, entity, 'label', locations, '07');
    } else if (tagName === "Template") {
        helper2(entityIItem, entity, 'label', locations, '08');
    } else if (tagName === "entityform" || tagName === "entity_form") {
        if (property === 'id' && isNaN(fileNameOrID)) {
            helper2(entityIItem, entity, 'id', locations, '015');
        } else if (property === 'name' || property === 'key') {
            helper2(entityIItem, entity, 'label', locations, '015');
        } else {
            console.log("Not Valid EntityForm");
        }
    } else if (tagName === "entitylist" || tagName === "entity_list") {
        if (property === 'id' && isNaN(fileNameOrID)) {
            helper2(entityIItem, entity, 'id', locations, '017');
        } else if (property === 'name' || property === 'key') {
            helper2(entityIItem, entity, 'label', locations, '017');
        } else {
            console.log("Not Valid EntityList");
        }
    } else if (tagName === "webform") {
        if (property === 'id' && isNaN(fileNameOrID)) {
            helper2(entityIItem, entity, 'id', locations, '019');
        } else if (property === 'name' || property === 'key') {
            helper2(entityIItem, entity, 'label', locations, '019');
        } else {
            console.log("Not Valid WebForm");
        }
    } else if ((tagName !== "entityform" && tagName !== "entity_form") && (tagName !== "entitylist" && tagName !== "entity_list")) {
        entity.fileNameOrID = tagName;
        helper2(entityIItem, entity, 'label', locations, '08');
    } else {
        console.log("Another Dynamic entity");
    }
}


function helper2(entityIItem: IItem, entity: DyanmicEntity, compareBy: string, locations: vscode.Location[], comp: string) {
    let sourceDep = entityIItem.children.find((child: IItem) => child.isFile === false);
    let file = entityIItem.children.find((child: IItem) => child.isFile === true);
    if (sourceDep) {
        for (const src of sourceDep.children) {
            const compareValue = compareBy === 'label' ? src.label : src.id;
            let fileNameOrID = entity.fileNameOrID?.replace(/^['"](.*)['"]$/, '$1');
            if (src.component === comp && compareValue === fileNameOrID) {
                if (file) {
                    addFileLocations(file, locations, entity);
                }
            }
        }
    }
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
                    if (tag!=='snippets' && tag!=='snippet' && tag!=='editable' && tag!=='Template' && tag !== "webform"  && tag !== "entityform" && tag !== "entity_form" && tag !== "entitylist" && tag !== "entity_list") {
                        fn = tag;
                        tag='Template';
                    }
                    if (tagName!=='snippets' && tagName!=='snippet' && tagName!=='editable' && tagName!=='Template' && tagName !== "webform"  && tagName !== "entityform" && tagName !== "entity_form" && tagName !== "entitylist" && tagName !== "entity_list") {
                        file = tagName;
                        tagName='Template';
                    }
                    if (tag == tagName && fn == file) {
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
                    }
                })
            }
        }
    } catch (error) {
        console.error('Error reading file:', error);
    }
}