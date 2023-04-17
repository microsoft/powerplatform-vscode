/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

(function () {
    let webpageIconUri ;
    let webfileIconUri ;
    let tabelPermissonsIconUri ;

    // check these also see if this is the correct pattern
    window.addEventListener("message", (event) => {
        const message = event.data;
        if (message.type === "webpageIconUri") {
            console.log("windowEvent: webpageIconUri = " + message.value);
            webpageIconUri = message.value;
        } else if (message.type === "webfileIconUri") {
            console.log("windowEvent: webfileIconUri = " + message.value);
            webfileIconUri = message.value;
        } else if (message.type === "tabelPermissonsIconUri") {
            console.log(
                "windowEvent: tabelPermissonsIconUri = " + message.value
            );
            tabelPermissonsIconUri = message.value;
        }
    });

    const vscode = acquireVsCodeApi();
    const dequeue = [];
    const chatMessages = document.getElementById("chat-messages");
    const chatInput = document.getElementById("chat-input");
    const sendButton = document.getElementById("send-button");

    function addToDequeue(element) {
        if (dequeue.length >= 5) {
            dequeue.shift(); // Remove the first element from the dequeue
        }
        dequeue.push(element); // Add the new element to the end of the dequeue
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
        const messageText = document.createElement("div");
        messageText.textContent = message;
        messageElement.appendChild(messageText);
        messageElement.classList.add("message", className);

        messageWrapper.appendChild(messageElement);

        if (className === "api-response") {
            const actionWrapper = document.createElement("div");
            actionWrapper.classList.add("action-wrapper");

            const CopyButton = document.createElement("button");
            CopyButton.textContent = "Copy";
            CopyButton.classList.add("action-button");
            CopyButton.addEventListener("click", () => {
                copyCodeToClipboard(message);
            });
            actionWrapper.appendChild(CopyButton);

            const InsertButton = document.createElement("button");
            InsertButton.textContent = "Insert";
            InsertButton.classList.add("action-button");
            InsertButton.addEventListener("click", () => {
                insertCode(message);
            });
            actionWrapper.appendChild(InsertButton);

            const CreateButton = document.createElement("button");
            CreateButton.textContent = "Create";
            CreateButton.classList.add("accordion");

            const accordionContent = document.createElement("div");
            accordionContent.classList.add("accordion-content");

            const option1 = document.createElement("button");
            const webpageicon = document.createElement("img");
            webpageicon.src = webpageIconUri;
            option1.appendChild(webpageicon);
            option1.addEventListener("click", () => {
                createWebpage(message);
            });
            accordionContent.appendChild(option1);

            const option2 = document.createElement("button");
            const webfileicon = document.createElement("img");
            webfileicon.src = webfileIconUri;
            option2.appendChild(webfileicon);
            option2.addEventListener("click", () => {
                createWebfile(message);
            });
            accordionContent.appendChild(option2);

            const option3 = document.createElement("button");
            const tablepermissionicon = document.createElement("img");
            tablepermissionicon.src = tabelPermissonsIconUri;
            option3.appendChild(tablepermissionicon);
            option3.addEventListener("click", () => {
                createTablePermission(message);
            });
            accordionContent.appendChild(option3);

            CreateButton.addEventListener("click", () => {
                CreateButton.classList.toggle("active");
                if (accordionContent.style.maxHeight) {
                    accordionContent.style.maxHeight = null;
                } else {
                    accordionContent.style.maxHeight =
                        accordionContent.scrollHeight + "px";
                }
            });

            CreateButton.appendChild(accordionContent);
            actionWrapper.appendChild(CreateButton);

            messageWrapper.appendChild(actionWrapper);
        }

        chatMessages.appendChild(messageWrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendMessageToApi(message) {
        const apiKey = 'YOUR_API_KEY';
        const endpointUrl = 'https://api.openai.com/v1/completions';
        const engineeredPrompt = generateEngineeredPrompt(message);
        const requestBody = {
            prompt: message,
            max_tokens: 50,
            model: "text-davinci-003",
            temperature: 0.5
          };
        const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            console.log("API call successful");
            const jsonResponse = await response.json();
            const responseMessage = jsonResponse.choices[0].text.trim();
            responseMessage.replace(/(\r\n|\n|\r)/gm,"");
            addMessage(responseMessage, 'api-response');
        } else {
            // Handle the API error, e.g., display an error message
        }

        console.log("engineeredPrompt : " + engineeredPrompt);
        // addMessage(
        //     `Sample message`,
        //     "api-response"
        // );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function generateEngineeredPrompt(userPrompt) {
        let prompts = "";
        for (let i = 0; i < dequeue.length; i++) {
            const element = dequeue[i];
            prompts += i + 1 + "." + element + " "; // fix this to the required format for chat
        }

        console.log(prompts);
        return prompts;
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

    function createWebfile(code) {
        vscode.postMessage({ type: "createWebfile", value: code });
    }

    function createTablePermission(code) {
        vscode.postMessage({ type: "createTablePermission", value: code });
    }

    sendButton.addEventListener("click", () => {
        if (chatInput.value.trim()) {
            addMessage(chatInput.value, "user-message");
            sendMessageToApi(chatInput.value);
            chatInput.value = "";
            chatInput.focus();
        }
    });

    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && chatInput.value.trim()) {
            addMessage(chatInput.value, "user-message");
            sendMessageToApi(chatInput.value);
            chatInput.value = "";
        }
    });
})();
