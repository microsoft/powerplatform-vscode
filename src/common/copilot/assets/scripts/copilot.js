/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable no-undef */

(function () {
    const vscode = acquireVsCodeApi();
    const dequeue = [];
    const chatMessages = document.getElementById("chat-messages");
    const chatInput = document.getElementById("chat-input");
    const conversation = [
        {
            role: "system",
            content:
                "You are a web developer well versed with css, html and javascript who is using the power pages platform which was formerly known as powerapps portals. It mostly uses html, css, javascript for development.",
        },
    ];
    const apiKey = "YOUR_API_KEY_HERE";

    const sendSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-license="isc-gnc" stroke-width="1.5" stroke="currentColor" class="w-3 h-3 mr-1"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>`;

    const clipboardSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-license="isc-gnc" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>`;

    const pencilSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-license="isc-gnc" stroke-width="2" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>`;

    const plusSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-license="isc-gnc" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>`;

    const insertSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-license="isc-gnc" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" /></svg>`;

    if (!chatInput || !chatMessages) {
        return;
    }
    const autocompletePanel = document.createElement("div");
    autocompletePanel.classList.add("autocomplete-panel");
    chatInput.parentNode?.appendChild(autocompletePanel);

    chatInput.addEventListener("focus", () => {
        chatInput.style.border = "1px solid blue";
    });
    chatInput.addEventListener("blur", () => {
        chatInput.style.border = "none";
    });

    chatInput.style.background = "rgb(60, 60, 60)";

    const SendButton = document.getElementById("send-button");
    if (!SendButton) {
        return;
    }

    const SendIcon = document.createElement("div");
    SendIcon.innerHTML = sendSvg;
    SendIcon.style.width = "22px";
    SendIcon.style.height = "22px";
    SendButton.title = "Send";
    SendButton.appendChild(SendIcon);

    function addToDequeue(element) {
        if (dequeue.length >= 5) {
            dequeue.shift(); // Remove the first element from the dequeue
        }
        dequeue.push(element); // Add the new element to the end of the dequeue
    }

    function formatCodeBlocks(response) {
        let arr = response.split("```");

        let result = document.createElement("div");
        for (let i = 0; i < arr.length; i++) {
            if (i % 2 === 0) {
                const textDiv = document.createElement("div");
                textDiv.innerText = arr[i];
                result.appendChild(textDiv);
            } else {
                const codeDiv = document.createElement("div");
                codeDiv.classList.add("code-division");
                codeDiv.appendChild(createActionWrapper(arr[i]));

                const preFormatted = document.createElement("pre");
                const codeSnip = document.createElement("code");
                codeSnip.innerText = arr[i];
                preFormatted.appendChild(codeSnip);

                codeDiv.appendChild(preFormatted);
                result.appendChild(codeDiv);
            }
        }
        return result;
    }

    function createActionWrapper(message) {
        const actionWrapper = document.createElement("div");
        actionWrapper.classList.add("action-wrapper");

        const CopyButton = document.createElement("div");
        CopyButton.innerHTML = clipboardSvg;
        CopyButton.classList.add("action-button");
        CopyButton.classList.add("copy-button");
        CopyButton.title = "Copy to clipboard";
        CopyButton.addEventListener("click", () => {
            copyCodeToClipboard(message);
        });
        actionWrapper.appendChild(CopyButton);

        const InsertButton = document.createElement("button");
        InsertButton.innerHTML = insertSvg
        InsertButton.classList.add("action-button");
        InsertButton.classList.add("insert-button");
        InsertButton.title = "Insert code into editor";
        InsertButton.addEventListener("click", () => {
            insertCode(message);
        });
        actionWrapper.appendChild(InsertButton);

        const PreviewButton = document.createElement("button");
        let isPreviewing = false;
        PreviewButton.innerHTML = pencilSvg;
        PreviewButton.classList.add("action-button");
        PreviewButton.classList.add("preview-button");
        PreviewButton.title = "Preview";
        PreviewButton.addEventListener("click", () => {
            isPreviewing = !isPreviewing;
            if (isPreviewing) {
                PreviewIcon.src = `${pencilSvg}`;
            } else {
                PreviewIcon.src = `${pencilSvg}`;
            }
            // previewCode(message);
        });
        actionWrapper.appendChild(PreviewButton);

        const CreateButton = document.createElement("button");
        CreateButton.innerHTML = plusSvg;
        CreateButton.classList.add("action-button");
        CreateButton.classList.add("create-button");
        CreateButton.title = "Create a new record";
        CreateButton.addEventListener("click", () => {
            console.log("Create Button Clicked");
            createWebpage(message);
        });
        actionWrapper.appendChild(CreateButton);

        return actionWrapper;
    }

    function addMessage(message, className) {
        const messageWrapper = document.createElement("div");
        messageWrapper.classList.add("message-wrapper");

        const messageElement = document.createElement("div");
        if (className === "user-message") {
            addToDequeue(message);
            const makerElement = document.createElement("div");
            makerElement.textContent = "Maker:";
            messageElement.appendChild(makerElement);
            makerElement.appendChild(document.createElement("br"));
        } else if (className === "api-response") {
            const makerElement = document.createElement("div");
            makerElement.textContent = "PowerPages Copilot:";
            messageElement.appendChild(makerElement);
            makerElement.appendChild(document.createElement("br"));
        }
        messageElement.appendChild(formatCodeBlocks(message));
        messageElement.classList.add("message", className);

        messageWrapper.appendChild(messageElement);

        if (!chatMessages) {
            return;
        }
        chatMessages.appendChild(messageWrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendMessageToApi(message) {
        console.log("Sending message to API: " + message);
        const endpointUrl = "https://api.openai.com/v1/chat/completions";
        console.log("conversations : " + conversation);
        const requestBody = {
            model: "gpt-3.5-turbo",
            messages: conversation,
            max_tokens: 1000,
            temperature: 0.5,
        };
        const response = await fetch(endpointUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (response.ok) {
            console.log("API call successful");
            const jsonResponse = await response.json();
            const responseMessage =
                jsonResponse.choices[0].message.content.trim();
            conversation.push({ role: "assistant", content: responseMessage });
            addMessage(responseMessage, "api-response");
        } else {
            console.log("API call failed");
            // Handle the API error, e.g., display an error message
        }
    }

    // function getTemplates() {
    //     const templates = {
    //         base: `You are a web developer using power portal or power pages platform for development. Power Pages uses liquid as a templating language and Bootstrap v3.3.6. Always give code snippets enclosed within \`+"${"```"}" +\` and never without it.`,

    //         entityList: `The list gets its data asynchronously, and when it's complete it will trigger an event 'loaded' that your custom JavaScript can listen for and do something with items in the grid. The following code is a sample javascript code: \`+"${"```"}" +\` $(document).ready(function () { $(".entitylist.entity-grid").on("loaded", function () { $(this).children(".view-grid").find("tr").each(function () { // do something with each row $(this).css("background-color", "yellow"); }); }); }); \`+"${"```"}" +\` Find a particular attribute field and get its value to possibly modify the rendering of the value. The following code gets each table cell that contains the value of the accountnumber attribute. Replace accountnumber with an attribute appropriate for your table and view. \`+"${"```"}" +\` $(document).ready(function (){ $(".entitylist.entity-grid").on("loaded", function () { $(this).children(".view-grid").find("td[data-attribute='accountnumber']").each(function (i, e){ var value = $(this).data(value); \`+"${"```"}" +\` // now that you have the value you can do something to the value }); }); });`,

    //         entityForm: `In a form On click of the Next/Submit button, a function named entityFormClientValidate is executed. You can extend this method to add custom validation logic for example refer the following javascript code: \`+"${"```"}" +\` if (window.jQuery) { (function ($) { if (typeof (entityFormClientValidate) != 'undefined') { var originalValidationFunction = entityFormClientValidate; if (originalValidationFunction && typeof (originalValidationFunction) == 'function') { entityFormClientValidate = function() { originalValidationFunction.apply(this, arguments); // do your custom validation here // return false; // to prevent the form submit you need to return false // end custom validation. return true; }; } } }(window.jQuery)); } To customize the validation of fields on the form you can write something like this: if (window.jQuery) { (function ($) { $(document).ready(function () { if (typeof (Page_Validators) == 'undefined') return; // Create new validator var newValidator = document.createElement('span'); newValidator.style.display = 'none'; newValidator.id = 'emailaddress1Validator'; newValidator.controltovalidate = 'emailaddress1'; newValidator.errormessage = '<a href="#emailaddress1_label" referencecontrolid="emailaddress1" onclick="javascript:scrollToAndFocus(\\"emailaddress1_label\\",\\"emailaddress1\\");return false;">Email is a required field.</a>'; newValidator.validationGroup = ''; // Set this if you have set ValidationGroup on the form newValidator.initialvalue = ''; newValidator.evaluationfunction = function () { var contactMethod = $('#preferredcontactmethodcode').val(); if (contactMethod != 2) return true; // check if contact method is not 'Email'. // only require email address if preferred contact method is email. var value = $('#emailaddress1').val(); if (value == null || value == '') { return false; } else { return true; } }; // Add the new validator to the page validators array: Page_Validators.push(newValidator); }); }(window.jQuery)); } \`+"${"```"}" +\`  Note: The above code is just an example for adding validations to the form. The actual prompt might be different based on the requirement`,

    //         webPage: `Power pages webpages have the following HTML code structure: \`+"${"```"}" +\` <div class="row sectionBlockLayout" data-component-theme="portalThemeColor6" style="display: flex; flex-wrap: wrap; height: 15px; min-height: 15px;"></div>\n<div class="row sectionBlockLayout" style="display: flex; flex-wrap: wrap; text-align: left; min-height: auto;">\n  <div class="container" style="padding: 0px; display: flex; flex-wrap: wrap;">\n    <div class="col-md-12 columnBlockLayout" style="flex-grow: 1; display: flex; flex-direction: column; min-width: 300px;">\n      <h1>Contact us</h1>\n    </div>\n  </div>\n</div>\n<div class="row sectionBlockLayout" style="display: flex; flex-wrap: wrap;text-align: left; min-height: 374px;">\n  <div class="container" style="padding: 0px; display: flex; flex-wrap: wrap;">\n    <div class="col-md-12 columnBlockLayout" style="flex-grow: 1; display: flex; flex-direction: column; min-width: 300px;">\n      {% entityform name: 'simple contact us form' %}\n    </div>\n  </div>\n</div>\n<div class="row sectionBlockLayout" data-component-theme="portalThemeColor2" style="display: flex; flex-wrap: wrap; min-height: 28px;"></div>\n<div class="row sectionBlockLayout" data-component-theme="portalThemeColor6" style="display: flex; flex-wrap: wrap; min-height: 52px;"></div> \`+"${"```"}"`,
    //     };
    //     return templates;
    // }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    // function promptEngine(message) {
    //     const type = message.split(" ")[0].slice(1);
    //     const templates = getTemplates();
    //     let realPrompt = "";
    //     let template = templates[type];
    //     if (template === undefined) {
    //         template = "";
    //     } else {
    //         // template = "Here is an example. " + template;
    //         realPrompt = message.split(type).slice(1);
    //         console.log("realPrompt = " + realPrompt);
    //     }
    //     message =
    //         " based on this information, respond to the prompt mentioned after hyphen -  " +
    //         realPrompt;
    //     const basePrompt = templates["base"];
    //     const prompt = basePrompt + template + message;
    //     console.log("Generated prompt : " + prompt);
    //     return prompt;
    // }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // function generateEngineeredPrompt(userPrompt) {
    //     let prompts = "";
    //     for (let i = 0; i < dequeue.length; i++) {
    //         const element = dequeue[i];
    //         prompts += i + 1 + "." + element + " "; // fix this to the required format for chat
    //     }

    //     console.log(prompts);
    //     return prompts;
    // }

    // Handle messages sent from the extension to the webview
    window.addEventListener("message", (event) => {
        const message = event.data; // The JSON data our extension sent
        console.log("message received from extension : " + message.type + " " + message.value)
        switch (message.type) {
            case "enigneeredPrompt": {
                conversation.push({ role: "user", content: message.value });
                sendMessageToApi(message.value);
                break;
            }
        }
    });

    function generateEngineeredPrompt(userPrompt) {
        vscode.postMessage({ type: "newUserPrompt", value: userPrompt });
    }

    function insertCode(code) {
        vscode.postMessage({ type: "insertCode", value: code });
    }

    function copyCodeToClipboard(code) {
        vscode.postMessage({ type: "copyCodeToClipboard", value: code });
    }

    function createWebpage(code) {
        vscode.postMessage({ type: "createWebpage", value: code });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function createWebfile(code) {
        vscode.postMessage({ type: "createWebfile", value: code });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function createTablePermission(code) {
        vscode.postMessage({ type: "createTablePermission", value: code });
    }

    SendButton?.addEventListener("click", () => {
        if (chatInput?.value.trim()) {
            addMessage(chatInput.value, "user-message");
            generateEngineeredPrompt(chatInput.value);
            //sendMessageToApi(chatInput.value);
            chatInput.value = "";
            chatInput.focus();
        }
    });

    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && chatInput.value.trim()) {
            addMessage(chatInput.value, "user-message");
            generateEngineeredPrompt(chatInput.value);
           // sendMessageToApi(chatInput.value);
            chatInput.value = "";
        }
    });

    chatInput.addEventListener("input", () => {
        if (chatInput.value === "/") {
            showAutocompletePanel();
        } else {
            hideAutocompletePanel();
        }
    });

    document.addEventListener("click", (event) => {
        if (!chatInput.contains(event.target)) {
            hideAutocompletePanel();
        }
    });

    function showAutocompletePanel() {
        const listItems = [
            { name: "webPage", description: "Create a new webpage" },
            { name: "entityForm", description: "Create a new entity form" },
            { name: "entityList", description: "Create a new entity list" },
        ];

        const listContainer = document.createElement("div");
        listContainer.classList.add("list-container");

        const list = document.createElement("ul");
        list.classList.add("list");

        listItems.forEach((item) => {
            const listItem = document.createElement("li");
            listItem.classList.add("list-item");

            const link = document.createElement("a");
            link.href = "#";
            link.textContent = item.name;
            link.title = item.description;

            listItem.appendChild(link);
            list.appendChild(listItem);

            listItem.addEventListener("click", () => {
                chatInput.value = `/${item.name} `;
                hideAutocompletePanel();
            });
        });

         // Clear the contents of the autocomplete panel before adding the new list of items
        autocompletePanel.innerHTML = "";

        listContainer.appendChild(list);
        autocompletePanel.appendChild(listContainer);

        autocompletePanel.style.display = "block";
        autocompletePanel.style.position = "absolute";
        autocompletePanel.style.top =
            chatInput?.offsetTop - autocompletePanel.offsetHeight + "px";
        autocompletePanel.style.left = chatInput?.offsetLeft + "px";
    }

    function hideAutocompletePanel() {
        autocompletePanel.style.display = "none";
    }

})();
