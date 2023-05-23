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

    let isDesktop = false;

    const sendSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.17683 1.1185C1.32953 0.989145 1.54464 0.963297 1.72363 1.05279L14.7236 7.55279C14.893 7.63748 15 7.81061 15 8C15 8.18939 14.893 8.36252 14.7236 8.44721L1.72363 14.9472C1.54464 15.0367 1.32953 15.0109 1.17683 14.8815C1.02414 14.7522 0.96328 14.5442 1.02213 14.353L2.97688 8L1.02213 1.64705C0.96328 1.45578 1.02414 1.24785 1.17683 1.1185ZM3.8693 8.5L2.32155 13.5302L13.382 8L2.32155 2.46979L3.8693 7.5H9.50001C9.77615 7.5 10 7.72386 10 8C10 8.27614 9.77615 8.5 9.50001 8.5H3.8693Z" fill="#F3F2F1"/>
    </svg>`;

    const clipboardSvg = `<svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 3L3.01333 1.98667H8.4L12.0267 5.56V12.9733L11.0133 13.9867H3.01333L2 12.9733V3ZM11.0133 5.98667L8.02667 3H3.01333V12.9733H11.0133V5.98667ZM0.986667 0.0133333L0.0266666 0.973333V11L0.986667 12.0133V0.973333H7.44L6.42667 0.0133333H0.986667Z" fill="#F3F2F1"/>
    </svg>`;

   // const pencilSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-license="isc-gnc" stroke-width="2" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>`;

    const plusSvg = `<svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.0267 5.98667V7H7V12.9733H5.98667V7H0.0133333V5.98667H5.98667V0.0133333H7V5.98667H13.0267Z" fill="#F3F2F1"/>
    </svg>`;

    const insertSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_7_7)">
    <path d="M14 6H5C4.73487 5.99972 4.48068 5.89428 4.2932 5.7068C4.10572 5.51932 4.00028 5.26513 4 5V2C4.00028 1.73487 4.10572 1.48068 4.2932 1.2932C4.48068 1.10572 4.73487 1.00028 5 1H14C14.2651 1.00028 14.5193 1.10572 14.7068 1.2932C14.8943 1.48068 14.9997 1.73487 15 2V5C14.9997 5.26513 14.8943 5.51932 14.7068 5.7068C14.5193 5.89428 14.2651 5.99972 14 6ZM5 2V5H14V2H5Z" fill="#F3F2F1"/>
    <path d="M14 15H5C4.73487 14.9997 4.48068 14.8943 4.2932 14.7068C4.10572 14.5193 4.00028 14.2651 4 14V11C4.00028 10.7349 4.10572 10.4807 4.2932 10.2932C4.48068 10.1057 4.73487 10.0003 5 10H14C14.2651 10.0003 14.5193 10.1057 14.7068 10.2932C14.8943 10.4807 14.9997 10.7349 15 11V14C14.9997 14.2651 14.8943 14.5193 14.7068 14.7068C14.5193 14.8943 14.2651 14.9997 14 15ZM5 11V14H14V11H5Z" fill="#F3F2F1"/>
    <path d="M4.5 8L1.707 5.207L1 5.914L3.086 8L1 10.086L1.707 10.793L4.5 8Z" fill="#F3F2F1"/>
    </g>
    <defs>
    <clipPath id="clip0_7_7">
    <rect width="16" height="16" fill="white"/>
    </clipPath>
    </defs>
    </svg>`;

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
    const SendIcon = document.createElement("div");
    SendIcon.innerHTML = sendSvg;
    SendIcon.classList.add("send-icon");
    SendButton.title = "Send";
    SendButton.appendChild(SendIcon);

    vscode.postMessage({ type: "webViewLoaded"});

    function addToDequeue(element) {
        if (dequeue.length >= 5) {
            dequeue.shift(); // Remove the first element from the dequeue
        }
        dequeue.push(element); // Add the new element to the end of the dequeue
    }

    function formatCodeBlocks(responseText) {
        const blocks = responseText.split("```");
        const resultDiv = document.createElement("div");

        for (let i = 0; i < blocks.length; i++) {
            if (i % 2 === 0) {
                // Handle text blocks
                const textDiv = document.createElement("div");
                textDiv.innerText = blocks[i];
                resultDiv.appendChild(textDiv);
            } else {
                // Handle code blocks
                const codeDiv = document.createElement("div");
                codeDiv.classList.add("code-division");
                codeDiv.appendChild(createActionWrapper(blocks[i]));

                const preFormatted = document.createElement("pre");
                const codeSnip = document.createElement("code");
                codeSnip.innerText = blocks[i];
                preFormatted.appendChild(codeSnip);

                codeDiv.appendChild(preFormatted);
                resultDiv.appendChild(codeDiv);
            }
        }

        return resultDiv;
    }

    function createActionWrapper(code) {
        const actionWrapper = document.createElement("div");
        actionWrapper.classList.add("action-wrapper");

        const copyButton = document.createElement("div");
        copyButton.innerHTML = clipboardSvg;
        copyButton.classList.add("action-button");
        copyButton.classList.add("copy-button");
        copyButton.title = "Copy to clipboard";
        copyButton.addEventListener("click", () => {
          copyCodeToClipboard(code);
        });
        actionWrapper.appendChild(copyButton);

        const insertButton = document.createElement("button");
        insertButton.innerHTML = insertSvg
        insertButton.classList.add("action-button");
        insertButton.classList.add("insert-button");
        insertButton.title = "Insert code into editor";
        insertButton.addEventListener("click", () => {
          insertCode(code);
        });
        actionWrapper.appendChild(insertButton);

        // const previewButton = document.createElement("button");
        // let isPreviewing = false;
        // previewButton.innerHTML = pencilSvg;
        // previewButton.classList.add("action-button");
        // previewButton.classList.add("preview-button");
        // previewButton.title = "Preview";
        // previewButton.addEventListener("click", () => {
        //   isPreviewing = !isPreviewing;
        //   if (isPreviewing) {
        //     PreviewIcon.src = `${pencilSvg}`;
        //   } else {
        //     PreviewIcon.src = `${pencilSvg}`;
        //   }
        //   // previewCode(code);
        // });
        // actionWrapper.appendChild(previewButton);

        if (isDesktop) {
          const createButton = document.createElement("button");
          createButton.innerHTML = plusSvg;
          createButton.classList.add("action-button");
          createButton.classList.add("create-button");
          createButton.title = "Create a new record";
          createButton.addEventListener("click", () => {
            console.log("Create Button Clicked");
            createWebpage(code);
          });
          actionWrapper.appendChild(createButton);
        }

        return actionWrapper;
      }


    function addMessageToChat(message, className) {
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

    // Handle messages sent from the extension to the webview
    window.addEventListener("message", (event) => {
        const message = event.data; // The JSON data our extension sent
        console.log(
            "message received from extension : " +
            message.type +
            " " +
            message.value
        );
        switch (message.type) {
            case "apiResponse": {
                addMessageToChat(message.value, "api-response")
                break;
            }
            case "env": {
                console.log("env received from extension : " + message.value);
                isDesktop = message.value;
            }
        }
    });

    function getApiResponse(userPrompt) {
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
            addMessageToChat(chatInput.value, "user-message");
            getApiResponse(chatInput.value);
            chatInput.value = "";
            chatInput.focus();
        }
    });

    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && chatInput.value.trim()) {
            addMessageToChat(chatInput.value, "user-message");
            getApiResponse(chatInput.value);
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
            { name: "fetchXml", description: "Fetch data from table" },
            { name: "clear", description: "Clear the chat window" },
            { name: "animate", description: "Add animations to your code" }
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
                if(item.name === "clear") {
                    chatMessages.innerHTML = "";
                    vscode.postMessage({ type: "clearChat" });
                    hideAutocompletePanel();
                    return;
                }   
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
