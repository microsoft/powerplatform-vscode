/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

const vscode = acquireVsCodeApi();

window.addEventListener("load", main);

function main() {
  const howdyButton = document.getElementById("submitBtn");
  howdyButton.addEventListener("click", handleSubmitClick);
}

function handleSubmitClick() {
  const environment = document.getElementById("envTxtBox").value;
  const currency = document.getElementById("currencyTxtBox").value;
  const domain = document.getElementById("domainTxtBox").value;
  const name = document.getElementById("nameTxtBox").value;
  const language = document.getElementById("languageTxtBox").value;
  const purpose = document.getElementById("purposeTxtBox").value;
  const templates = document.getElementById("templatesTxtBox").value;
  const async = document.getElementById("asyncCheckBox").value;

  vscode.postMessage({
    command: "submit",
    environment,
    currency,
    domain,
    name,
    language,
    purpose,
    templates,
    async,
    text: "simulated pac admin reset",
  });
}
