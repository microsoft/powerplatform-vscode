/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';

// Green highlight for modifications in the output file
const outputDecorationType = vscode.window.createTextEditorDecorationType({
	backgroundColor: '#90ee90'
});

// Red highlight for the classes output in the input file
const inputDecorationType = vscode.window.createTextEditorDecorationType({
	backgroundColor: '#E1AEAD'
});

// object for storing class range
type ClassRange = {
	Start: number;
	End : number;
	Offset : number;
	MatchedClass : string;
	ReplacedClass: string;
	Message: string;
};

let matchedClasses : ClassRange[][];

export async function bootstrapDiff()
{
    const editor = vscode.window.activeTextEditor;
		if(!editor)
		{
			// Handle this to prompt the user to open a file and the run the command
            vscode.window.showErrorMessage("Open a file before executing the command")
			return;
		}

		const inputPath = editor.document.uri.path;

		const diffFileName = inputPath + "-diff.json";
		let diffData = "";
		await vscode.workspace.openTextDocument(vscode.Uri.file(diffFileName)).then((document) => {
			diffData = document.getText();
		});

		matchedClasses = JSON.parse(diffData);
		hihglightReplacedClasses(editor);

		const websiteFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri)?.name;
        if(!websiteFolder)
        {
            vscode.window.showErrorMessage("Open Website folder in the wrokspace")
            return;``
        }

		const v3websiteFolder = websiteFolder.substring(0,websiteFolder.length - 2);
		const v3FilePath = inputPath.replace(websiteFolder,v3websiteFolder);

		const options : vscode.TextDocumentShowOptions = {
			viewColumn : 2,
			preserveFocus : false
		};

		await vscode.window.showTextDocument(vscode.Uri.file(v3FilePath),options);
		const v3editor = vscode.window.activeTextEditor;
		if(!v3editor)
		{
			// Handle this case
			return;
		}
		hihglightMatchedClasses(v3editor);
}

// Hihglights the replaced classes in V5 file
function hihglightReplacedClasses(editor: vscode.TextEditor)
{
	const hoverMessages : vscode.DecorationOptions[] = [];
	let offset = 0;

	for(let l=0;l<matchedClasses.length;l++)
	{
		offset = 0;
		for(let i=0;i<matchedClasses[l].length;i++)
		{
			const start = new vscode.Position(l,matchedClasses[l][i].Start+offset);
			offset+=matchedClasses[l][i].Offset;
			const end = new vscode.Position(l,matchedClasses[l][i].End+offset);
			hoverMessages.push({hoverMessage: matchedClasses[l][i].Message, range: new vscode.Range(start,end)});
		}
	}
	editor.setDecorations(outputDecorationType,hoverMessages);
}

// Hihglights the classes matched in the v3 file
function hihglightMatchedClasses(editor: vscode.TextEditor)
{
	const matchedClassPositionRanges : vscode.Range[] = [];

	for(let l=0;l<matchedClasses.length;l++)
	{
		for(let i=0;i<matchedClasses[l].length;i++)
		{
			const start = new vscode.Position(l,matchedClasses[l][i].Start);
			const end = new vscode.Position(l,matchedClasses[l][i].End);
			matchedClassPositionRanges.push(new vscode.Range(start,end));
		}
	}
	editor.setDecorations(inputDecorationType,matchedClassPositionRanges);
}
