/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

const vscode = acquireVsCodeApi();

window.addEventListener("load", main);

function main() {
    const submitBtn = document.getElementById("submit");
    submitBtn.addEventListener("click", handleSubmitClick);
}

function handleSubmitClick() {
    const directory = document.getElementById("directoryTxtBox").value;
    const name = document.getElementById("namespaceTxtBox").value;
    const namespace = document.getElementById("nameTxtBox").value;
    const template = document.getElementById("templateDropDown").value;
    vscode.postMessage({
        command: "submit",
        outputDirectory: directory,
        name: name,
        namespace: namespace,
        template: template,
    });
}
