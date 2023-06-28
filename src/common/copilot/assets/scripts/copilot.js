/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable no-undef */

(function script() {
  const vscode = acquireVsCodeApi();

  const copilotHeader = document.getElementById("copilot-header");
  const chatMessages = document.getElementById("chat-messages");
  const chatInput = document.getElementById("chat-input");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let isDesktop = false;
  let userName;
  let apiResponseHandler;
  let welcomeScreen;
  let envrionment = "Environment";

  const clipboardSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 3L3.01333 1.98667H8.4L12.0267 5.56V12.9733L11.0133 13.9867H3.01333L2 12.9733V3ZM11.0133 5.98667L8.02667 3H3.01333V12.9733H11.0133V5.98667ZM0.986667 0.0133333L0.0266666 0.973333V11L0.986667 12.0133V0.973333H7.44L6.42667 0.0133333H0.986667Z" fill="#F3F2F1"/>
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

  const copilotSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <rect width="24" height="24" rx="12" fill="white"/> <path d="M10.1959 3.92188L5.49974 6.63385C4.57168 7.16979 4 8.16009 4 9.23178V14.7682C4 15.8398 4.57164 16.8301 5.49965 17.366L7.76712 18.6756L7.99007 18L12.2373 15.4567L10.4996 14.4531C9.57164 13.9172 9 12.9269 9 11.8553V10.2734L9.46563 9.67953L11 8.49176V5L10.3242 4.01172L9.58517 4.53879C9.75624 4.30668 9.96137 4.09837 10.1959 3.92188Z" fill="url(#paint0_linear_3893_124825)"/> <path d="M10.1959 3.92188L5.49974 6.63385C4.57168 7.16979 4 8.16009 4 9.23178V14.7682C4 15.8398 4.57164 16.8301 5.49965 17.366L7.76712 18.6756L7.99007 18L12.2373 15.4567L10.4996 14.4531C9.57164 13.9172 9 12.9269 9 11.8553V10.2734L9.46563 9.67953L11 8.49176V5L10.3242 4.01172L9.58517 4.53879C9.75624 4.30668 9.96137 4.09837 10.1959 3.92188Z" fill="url(#paint1_linear_3893_124825)"/> <path d="M14.9988 9.61523V11.8559C14.9988 12.9276 14.4271 13.9179 13.4991 14.4538L8.49914 17.3415C7.57076 17.8776 6.42682 17.8776 5.49844 17.3415L5.19531 17.1664C5.29151 17.2387 5.39266 17.3057 5.49844 17.3668L10.4984 20.2545C11.4268 20.7906 12.5708 20.7906 13.4991 20.2545L18.4991 17.3668C19.4271 16.8309 19.9988 15.8406 19.9988 14.769V12.6879L14.9988 9.61523Z" fill="url(#paint2_radial_3893_124825)"/> <path d="M14.9988 9.61523V11.8559C14.9988 12.9276 14.4271 13.9179 13.4991 14.4538L8.49914 17.3415C7.57076 17.8776 6.42682 17.8776 5.49844 17.3415L5.19531 17.1664C5.29151 17.2387 5.39266 17.3057 5.49844 17.3668L10.4984 20.2545C11.4268 20.7906 12.5708 20.7906 13.4991 20.2545L18.4991 17.3668C19.4271 16.8309 19.9988 15.8406 19.9988 14.769V12.6879L14.9988 9.61523Z" fill="url(#paint3_linear_3893_124825)"/> <path d="M10.1952 3.92167L10.4997 3.74582C11.4281 3.20972 12.5719 3.20973 13.5003 3.74582L18.5003 6.63324C19.4283 7.16918 20 8.15948 20 9.23117V14.7675C20 14.7881 19.9998 14.8087 19.9994 14.8293C19.9779 13.7814 19.4105 12.8187 18.5003 12.2931L13.5003 9.40565C12.5719 8.86955 11.4281 8.86954 10.4997 9.40564L9 10.2717V6.31815C9 5.36919 9.44824 4.48405 10.1952 3.92167Z" fill="url(#paint4_radial_3893_124825)"/> <path d="M10.1952 3.92167L10.4997 3.74582C11.4281 3.20972 12.5719 3.20973 13.5003 3.74582L18.5003 6.63324C19.4283 7.16918 20 8.15948 20 9.23117V14.7675C20 14.7881 19.9998 14.8087 19.9994 14.8293C19.9779 13.7814 19.4105 12.8187 18.5003 12.2931L13.5003 9.40565C12.5719 8.86955 11.4281 8.86954 10.4997 9.40564L9 10.2717V6.31815C9 5.36919 9.44824 4.48405 10.1952 3.92167Z" fill="url(#paint5_linear_3893_124825)"/> <path d="M4.00063 14.8293C4.00063 14.8293 4.00063 14.8292 4.00063 14.8293V14.8293Z" fill="url(#paint6_radial_3893_124825)"/> <path d="M4.00063 14.8293C4.00063 14.8293 4.00063 14.8292 4.00063 14.8293V14.8293Z" fill="url(#paint7_linear_3893_124825)"/> <defs> <linearGradient id="paint0_linear_3893_124825" x1="11.0932" y1="7.8282" x2="6.74492" y2="20.4869" gradientUnits="userSpaceOnUse"> <stop stop-color="#AE7FE2"/> <stop offset="1" stop-color="#0078D4"/> </linearGradient> <linearGradient id="paint1_linear_3893_124825" x1="9.44306" y1="17.2211" x2="8.6907" y2="15.8939" gradientUnits="userSpaceOnUse"> <stop offset="0.9999" stop-color="#114A8B"/> <stop offset="1" stop-color="#0078D4" stop-opacity="0"/> </linearGradient> <radialGradient id="paint2_radial_3893_124825" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(7.14608 16.7577) rotate(-13.0688) scale(12.7772 9.84272)"> <stop offset="0.140029" stop-color="#D59DFF"/> <stop offset="1" stop-color="#5E438F"/> </radialGradient> <linearGradient id="paint3_linear_3893_124825" x1="17.826" y1="11.8471" x2="17.1058" y2="13.0024" gradientUnits="userSpaceOnUse"> <stop offset="0.9999" stop-color="#493474"/> <stop offset="1" stop-color="#8C66BA" stop-opacity="0"/> </linearGradient> <radialGradient id="paint4_radial_3893_124825" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(18.5411 12.3179) rotate(-143.083) scale(11.412)"> <stop stop-color="#50E6FF"/> <stop offset="1" stop-color="#436DCD"/> </radialGradient> <linearGradient id="paint5_linear_3893_124825" x1="9.0174" y1="7.56496" x2="10.1821" y2="7.56496" gradientUnits="userSpaceOnUse"> <stop offset="0.9999" stop-color="#114A8B"/> <stop offset="1" stop-color="#0078D4" stop-opacity="0"/> </linearGradient> <radialGradient id="paint6_radial_3893_124825" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(18.5411 12.3179) rotate(-143.083) scale(11.412)"> <stop stop-color="#50E6FF"/> <stop offset="1" stop-color="#436DCD"/> </radialGradient> <linearGradient id="paint7_linear_3893_124825" x1="9.0174" y1="7.56496" x2="10.1821" y2="7.56496" gradientUnits="userSpaceOnUse"> <stop offset="0.9999" stop-color="#114A8B"/> <stop offset="1" stop-color="#0078D4" stop-opacity="0"/> </linearGradient> </defs> </svg>'

  if (!chatInput || !chatMessages) {
    return;
  }
  const autocompletePanel = document.createElement("div");
  autocompletePanel.classList.add("autocomplete-panel");
  chatInput.parentNode?.appendChild(autocompletePanel);

  const SendButton = document.getElementById("send-button");

  vscode.postMessage({ type: "webViewLoaded" });

  function parseCodeBlocks(responseText) {
    const resultDiv = document.createElement("div");
    console.log("responseText " + responseText);
    for (let i = 0; i < responseText.length; i++) {
      const textDiv = document.createElement("div");
      textDiv.innerText = responseText[i].displayText;
      resultDiv.appendChild(textDiv);

      if (responseText[i].Code === "" || responseText[i].Code === null || responseText[i].Code === undefined) {
        continue;
      }

      const codeDiv = document.createElement("div");
      codeDiv.classList.add("code-division");
      let codeBlock = responseText[i].Code;

      codeDiv.appendChild(createActionWrapper(codeBlock));

      const preFormatted = document.createElement("pre");
      const codeSnip = document.createElement("code");
      codeSnip.classList.add("code-snip");
      preFormatted.classList.add("code-pre");

      codeSnip.innerText = codeBlock;
      preFormatted.appendChild(codeSnip);

      codeDiv.appendChild(preFormatted);
      resultDiv.appendChild(codeDiv);
    }
    resultDiv.classList.add("result-div");
    return resultDiv;
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
    resultDiv.classList.add("result-div");
    return resultDiv;
  }

  function createActionWrapper(code) {
    const actionWrapper = document.createElement("div");
    actionWrapper.classList.add("action-wrapper");

    const copyButton = document.createElement("button");
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


    return actionWrapper;
  }

  function getInitials(name) {
    const nameArray = name.split(" ");
    const initials = nameArray.map((word) => word.charAt(0));
    return initials.join("");
  }


  function handleUserMessage(message) {
    const messageWrapper = document.createElement("div");
    messageWrapper.classList.add("message-wrapper");

    const messageElement = document.createElement("div");
    const makerElement = document.createElement("div");
    const user = document.createElement("div");
    user.classList.add('user-info');
    const profileIcon = document.createElement('div');
    profileIcon.innerText = getInitials(userName);
    profileIcon.classList.add('profile-icon');
    const usernameSpan = document.createElement('span');
    usernameSpan.classList.add('username');
    usernameSpan.textContent = `${userName}`;
    user.appendChild(profileIcon);
    user.appendChild(usernameSpan);
    makerElement.appendChild(user);
    messageElement.appendChild(makerElement);
    makerElement.appendChild(document.createElement("br"));
    messageElement.appendChild(formatCodeBlocks(message));

    messageElement.classList.add("message", "user-message");

    messageWrapper.appendChild(messageElement);

    if (!chatMessages) {
      return;
    }
    chatMessages.appendChild(messageWrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function createCopilotSection() {
    const makerElement = document.createElement("div");
    makerElement.classList.add("maker-element");

    const user = document.createElement("div");
    user.classList.add('user-info');
    const profileIcon = document.createElement('div');
    profileIcon.innerHTML = copilotSvg;
    profileIcon.classList.add('profile-icon');
    const usernameSpan = document.createElement('span');
    usernameSpan.classList.add('username');
    usernameSpan.textContent = 'Copilot';

    const activeOrg = document.createElement("div");
    activeOrg.classList.add("active-org");
    activeOrg.textContent = `${envrionment}`;

    user.appendChild(profileIcon);
    user.appendChild(usernameSpan);
    makerElement.appendChild(user);
    makerElement.appendChild(activeOrg);

    return makerElement;
  }

  function createFeedbackDiv() {
    const feedback = document.createElement("div");
    feedback.innerHTML = `<p class="feedback-statement">AI-generated content may be incorrect. <a href="https://example.com/learn-more" style="display: block;">Learn more</a></p>
      <div class="feedback-icons">
        <span class="codicon codicon-thumbsup" style="cursor: pointer;"></span>
        <span class="codicon codicon-thumbsdown" style="cursor: pointer;"></span>`;

    feedback.classList.add("feedback-div");

    return feedback;
  }

  function handleAPIResponse() {
    const messageWrapper = document.createElement("div");
    messageWrapper.classList.add("message-wrapper");

    const messageElement = document.createElement("div");
    const makerElement = createCopilotSection();
    messageElement.appendChild(makerElement);
    messageElement.appendChild(document.createElement("br"));

    messageElement.classList.add("message", "api-response");

    messageWrapper.appendChild(messageElement);

    if (!chatMessages) {
      return;
    }
    chatMessages.appendChild(messageWrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return {
      updateThinking: function (thinkingMessage) {
        const thinking = document.createElement("div");
        thinking.classList.add("thinking");
        thinking.innerText = thinkingMessage;

        messageElement.appendChild(thinking);
      },
      updateResponse: function (apiResponse) {
        const thinkingDiv = messageElement.querySelector(".thinking");
        if (thinkingDiv) {
          thinkingDiv.remove();
        }

        const apiResponseElement = parseCodeBlocks(apiResponse);
        messageElement.appendChild(apiResponseElement);

        // Add feedback session for the API response
        const feedback = createFeedbackDiv();
        messageWrapper.appendChild(feedback);
      }
    };
  }

  function setWelcomeScreen() {
    const messageWrapper = document.createElement("div");
    messageWrapper.classList.add("message-wrapper");

    const messageElement = document.createElement("div");
    const makerElement = createCopilotSection();
    messageElement.appendChild(makerElement);

    messageElement.classList.add("message", "api-response");

    messageWrapper.appendChild(messageElement);

    if (!copilotHeader) {
      return;
    }
    copilotHeader.appendChild(messageWrapper);

    return {
      userNotLoggedIn: function () {
        const notLoggedIn = document.createElement("div");
        notLoggedIn.classList.add("not-loggedIn");
        notLoggedIn.innerHTML = `<p id="greeting"></p>
        <p>Hi! Instantly generate code for Power Pages sites by typing in what you need. To start using Copilot, log in to your Microsoft account.</p>
        <button id="loginButton" >Login</button>
        <p>Copilot is powered by AI, so surprises and mistakes are possible. Make sure to verify the responses before using them. View <a href="#">Copilot capabilities and limitations</a>.</p>
        <p>To help improve Copilot, <a href="#">share your feedback</a>.</p>`;

        messageElement.appendChild(notLoggedIn);

        const loginButton = document.getElementById("loginButton");
        loginButton.addEventListener("click", handleLoginButtonClick);
      },
      userLoggedIn: function () {
        const notLoggedInDiv = messageElement.querySelector(".not-loggedIn");
        if (notLoggedInDiv) {
          notLoggedInDiv.remove();
        }
        const loggedInDiv = document.createElement("div");
        loggedInDiv.classList.add("loggedIn");
        loggedInDiv.innerHTML = `<p id="greeting">Hi <strong>@${userName}!</strong> In your own words, describe what you need. You can get help with writing code for Power Pages sites or learn about Visual Studio Code.</p>
        <p>Copilot is powered by AI, so surprises and mistakes are possible. Make sure to verify the responses before using them. View <a href="#">Copilot capabilities and limitations</a>.</p>
        <p>To help improve Copilot, <a href="#">share your feedback</a>.</p>`;
        messageElement.appendChild(loggedInDiv);
      }
    };
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
        apiResponseHandler.updateResponse(message.value);
        break;
      }
      case "env": {
        console.log("env received from extension : " + message.value);
        isDesktop = message.value;
        envrionment = message.envName;
        welcomeScreen = setWelcomeScreen();
        break;
      }
      case "userName": {
        console.log("userName received from extension : " + message.value);
        userName = message.value;
        break;
      }
      case "welcomeScreen": {
        if (userName != null && userName != undefined && userName != "") {
          welcomeScreen.userLoggedIn();
        } else {
          welcomeScreen.userNotLoggedIn();
        }
        break;
      }
      case "clearConversation": {
        console.log("clearConversation received from extension");
        chatMessages.innerHTML = "";
        break;
      }
    }
  });

  function handleLoginButtonClick() {
    vscode.postMessage({ type: "login" });
  }

  function getApiResponse(userPrompt) {
    apiResponseHandler = handleAPIResponse();
    apiResponseHandler.updateThinking("Thinking...");
    vscode.postMessage({ type: "newUserPrompt", value: userPrompt });
  }

  function insertCode(code) {
    vscode.postMessage({ type: "insertCode", value: code });
  }

  function copyCodeToClipboard(code) {
    vscode.postMessage({ type: "copyCodeToClipboard", value: code });
  }

  SendButton?.addEventListener("click", () => {
    if ((chatInput).value.trim()) {
      handleUserMessage((chatInput).value);
      getApiResponse((chatInput).value);
      (chatInput).value = "";
      (chatInput).focus();
    }
  });

  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (chatInput).value.trim()) {
      handleUserMessage((chatInput).value);
      getApiResponse((chatInput).value);
      (chatInput).value = "";
    }
  });

})();
