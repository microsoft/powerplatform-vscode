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
    const publisherName = document.getElementById("publisherNameTxtBox").value;
    const publisherPrefix = document.getElementById("publisherPrefixTxtBox").value;
    vscode.postMessage({
        command: "submit",
        outputDirectory: directory,
        publisherName: publisherName,
        publisherPrefix: publisherPrefix,
    });
}
