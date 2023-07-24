/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable no-undef */

(function script() {
  const vscode = acquireVsCodeApi();

  // const copilotHeader = document.getElementById("copilot-header");
  const chatMessages = document.getElementById("chat-messages");
  const chatInput = document.getElementById("chat-input");
  const chatInputComponent = document.getElementById("input-component");

  let userName;
  let apiResponseHandler;
  let welcomeScreen;
  let isCopilotEnabled = true;

  const clipboardSvg = `<svg  width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 3L3.01333 1.98667H8.4L12.0267 5.56V12.9733L11.0133 13.9867H3.01333L2 12.9733V3ZM11.0133 5.98667L8.02667 3H3.01333V12.9733H11.0133V5.98667ZM0.986667 0.0133333L0.0266666 0.973333V11L0.986667 12.0133V0.973333H7.44L6.42667 0.0133333H0.986667Z"  class="copyIcon"/>
    </svg>`;


  const insertSvg = `<svg  width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_7_7)">
    <path d="M14 6H5C4.73487 5.99972 4.48068 5.89428 4.2932 5.7068C4.10572 5.51932 4.00028 5.26513 4 5V2C4.00028 1.73487 4.10572 1.48068 4.2932 1.2932C4.48068 1.10572 4.73487 1.00028 5 1H14C14.2651 1.00028 14.5193 1.10572 14.7068 1.2932C14.8943 1.48068 14.9997 1.73487 15 2V5C14.9997 5.26513 14.8943 5.51932 14.7068 5.7068C14.5193 5.89428 14.2651 5.99972 14 6ZM5 2V5H14V2H5Z" class="insertIcon"/>
    <path d="M14 15H5C4.73487 14.9997 4.48068 14.8943 4.2932 14.7068C4.10572 14.5193 4.00028 14.2651 4 14V11C4.00028 10.7349 4.10572 10.4807 4.2932 10.2932C4.48068 10.1057 4.73487 10.0003 5 10H14C14.2651 10.0003 14.5193 10.1057 14.7068 10.2932C14.8943 10.4807 14.9997 10.7349 15 11V14C14.9997 14.2651 14.8943 14.5193 14.7068 14.7068C14.5193 14.8943 14.2651 14.9997 14 15ZM5 11V14H14V11H5Z" class="insertIcon"/>
    <path d="M4.5 8L1.707 5.207L1 5.914L3.086 8L1 10.086L1.707 10.793L4.5 8Z" class="insertIcon"/>
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
   
    for (let i = 0; i < responseText.length; i++) {
      const textDiv = document.createElement("div");
      textDiv.innerText = responseText[i].displayText;
      resultDiv.appendChild(textDiv);

      if(responseText[i].displayText === "Feature is not enabled for this geo.") {
        chatInputComponent.classList.add("hide")
        textDiv.innerText = "Your Microsoft account doesn’t currently support Copilot. Contact your admin for details."
        isCopilotEnabled = false;
        return resultDiv;
      }

      if (responseText[i].code === "" || responseText[i].code === null || responseText[i].code === undefined || responseText[i].code === "violation" || responseText[i].code === "unclear") {
        continue;
      }

      const codeDiv = document.createElement("div");
      codeDiv.classList.add("code-division");
      let codeBlock = responseText[i].code;

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
    const truncatedInitials = initials.slice(0, 2);
    return truncatedInitials.join("");
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

    user.appendChild(profileIcon);
    user.appendChild(usernameSpan);
    makerElement.appendChild(user);

    return makerElement;
  }

  function createFeedbackDiv() {
    const feedback = document.createElement("div");
    if(!isCopilotEnabled) {
      return feedback;
    }
    feedback.innerHTML = `<p class="feedback-statement">AI-generated content can contain mistakes</p>
      <div class="feedback-icons">
      <svg class="thumbsup" cursor="pointer" width="22" height="23" viewBox="0 0 22 23" fill="none" xmlns="http://www.w3.org/2000/svg">
        <title>Thumbs Up</title>
        <path d="M13.5584 5.47363C13.8428 5.50919 14.1095 5.61586 14.3584 5.79363C14.6073 5.97141 14.7673 6.2203 14.8384 6.5403C14.9451 6.82474 14.9273 7.12697 14.7851 7.44697L13.8251 9.63363H16.5984C16.8473 9.59808 17.0784 9.65141 17.2917 9.79363C17.5051 9.9003 17.6651 10.0603 17.7717 10.2736C17.914 10.4514 17.9851 10.6647 17.9851 10.9136C18.0206 11.127 17.9851 11.3403 17.8784 11.5536C16.634 14.1847 15.8695 15.9092 15.5851 16.727C15.4784 16.9759 15.3006 17.1892 15.0517 17.367C14.8384 17.5447 14.5895 17.6336 14.3051 17.6336H5.39839C5.00728 17.5981 4.6695 17.4559 4.38506 17.207C4.13617 16.9225 4.01172 16.5847 4.01172 16.1936V12.6736C4.01172 12.3181 4.13617 12.0159 4.38506 11.767C4.6695 11.4825 5.00728 11.3403 5.39839 11.3403H6.78506L12.5984 5.84697C12.8828 5.63363 13.2028 5.50919 13.5584 5.47363ZM14.3051 16.6203C14.4828 16.6203 14.6073 16.5314 14.6784 16.3536C15.0695 15.2514 15.8517 13.5092 17.0251 11.127C17.0606 10.9847 17.0428 10.8603 16.9717 10.7536C16.9006 10.6114 16.7762 10.5581 16.5984 10.5936H13.3451L12.8117 9.95363V9.47363L13.8784 7.0203C13.914 6.94919 13.914 6.87808 13.8784 6.80697C13.8784 6.7003 13.8428 6.62919 13.7717 6.59363C13.7006 6.52252 13.6117 6.48697 13.5051 6.48697C13.434 6.48697 13.3628 6.52252 13.2917 6.59363L7.21172 12.1403L6.73172 12.3003H5.39839C5.29172 12.3003 5.18506 12.3359 5.07839 12.407C5.00728 12.4781 4.9895 12.567 5.02506 12.6736V16.1936C4.9895 16.3003 5.00728 16.407 5.07839 16.5136C5.18506 16.5847 5.29172 16.6203 5.39839 16.6203H14.3051Z" class = "thumbsup-clicked" />
        <path d="M14.3051 16.6203C14.4828 16.6203 14.6073 16.5314 14.6784 16.3536C15.0695 15.2514 15.8517 13.5092 17.0251 11.127C17.0606 10.9847 17.0428 10.8603 16.9717 10.7536C16.9006 10.6114 16.7762 10.5581 16.5984 10.5936H13.3451L12.8117 9.95363V9.47363L13.8784 7.0203C13.914 6.94919 13.914 6.87808 13.8784 6.80697C13.8784 6.7003 13.8428 6.62919 13.7717 6.59363C13.7006 6.52252 13.6117 6.48697 13.5051 6.48697C13.434 6.48697 13.3628 6.52252 13.2917 6.59363L7.21172 12.1403L6.73172 12.3003H5.39839C5.29172 12.3003 5.18506 12.3359 5.07839 12.407C5.00728 12.4781 4.9895 12.567 5.02506 12.6736V16.1936C4.9895 16.3003 5.00728 16.407 5.07839 16.5136C5.18506 16.5847 5.29172 16.6203 5.39839 16.6203H14.3051Z" fill="none" id="thumbsup-path"/>
      </svg>

      
      <svg class="thumbsdown" cursor="pointer" width="22" height="23" viewBox="0 0 22 23" fill="none" xmlns="http://www.w3.org/2000/svg">
        <title>Thumbs Down</title>
        <path d="M8.48 17.6336C8.19556 17.6336 7.92889 17.5447 7.68 17.367C7.43111 17.1536 7.25333 16.9047 7.14667 16.6203C7.07556 16.3003 7.11111 15.9803 7.25333 15.6603L8.21333 13.4736H5.44C5.19111 13.5092 4.96 13.4736 4.74667 13.367C4.53333 13.2603 4.35556 13.1181 4.21333 12.9403C4.10667 12.727 4.03556 12.4959 4 12.247C4 11.9981 4.05333 11.767 4.16 11.5536C5.40444 8.92252 6.16889 7.19808 6.45333 6.3803C6.56 6.13141 6.72 5.93586 6.93333 5.79363C7.18222 5.61586 7.44889 5.50919 7.73333 5.47363H16.64C17.0311 5.50919 17.3511 5.66919 17.6 5.95363C17.8844 6.20252 18.0267 6.52252 18.0267 6.91363V10.4336C18.0267 10.7892 17.8844 11.1092 17.6 11.3936C17.3511 11.6425 17.0311 11.767 16.64 11.767H15.3067L9.44 17.2603C9.15556 17.5092 8.83556 17.6336 8.48 17.6336ZM7.73333 6.48697C7.55556 6.48697 7.43111 6.57586 7.36 6.75363C6.96889 7.85586 6.20444 9.59808 5.06667 11.9803C4.99556 12.1225 4.99556 12.2647 5.06667 12.407C5.13778 12.5136 5.26222 12.5492 5.44 12.5136H8.74667L9.22667 13.1536V13.6336L8.16 16.087C8.12444 16.1581 8.10667 16.247 8.10667 16.3536C8.14222 16.4247 8.19556 16.4959 8.26667 16.567C8.33778 16.6025 8.40889 16.6203 8.48 16.6203C8.58667 16.6203 8.67556 16.5847 8.74667 16.5136L14.8267 10.967L15.3067 10.807H16.64C16.7467 10.807 16.8356 10.7714 16.9067 10.7003C17.0133 10.6292 17.0667 10.5403 17.0667 10.4336V6.91363C17.0667 6.80697 17.0133 6.71808 16.9067 6.64697C16.8356 6.5403 16.7467 6.48697 16.64 6.48697H7.73333Z" class = "thumbsdown-clicked"/>
        <path d="M7.73333 6.48697C7.55556 6.48697 7.43111 6.57586 7.36 6.75363C6.96889 7.85586 6.20444 9.59808 5.06667 11.9803C4.99556 12.1225 4.99556 12.2647 5.06667 12.407C5.13778 12.5136 5.26222 12.5492 5.44 12.5136H8.74667L9.22667 13.1536V13.6336L8.16 16.087C8.12444 16.1581 8.10667 16.247 8.10667 16.3536C8.14222 16.4247 8.19556 16.4959 8.26667 16.567C8.33778 16.6025 8.40889 16.6203 8.48 16.6203C8.58667 16.6203 8.67556 16.5847 8.74667 16.5136L14.8267 10.967L15.3067 10.807H16.64C16.7467 10.807 16.8356 10.7714 16.9067 10.7003C17.0133 10.6292 17.0667 10.5403 17.0667 10.4336V6.91363C17.0667 6.80697 17.0133 6.71808 16.9067 6.64697C16.8356 6.5403 16.7467 6.48697 16.64 6.48697H7.73333Z" fill="none" id="thumbsdown-path"/>
      </svg>
`;

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

        messageWrapper.appendChild(document.createElement("hr"));

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

    chatMessages.appendChild(messageWrapper);

    return {
      userNotLoggedIn: function () {
        const notLoggedIn = document.createElement("div");
        notLoggedIn.classList.add("not-loggedIn");
        notLoggedIn.innerHTML = `<p id="greeting"></p>
        <p>Hi! Instantly generate code for Power Pages sites by typing in what you need. To start using Copilot, log in to your Microsoft account.</p>
        <button id="loginButton" >Login</button>`;

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
        loggedInDiv.innerHTML = `<p id="greeting">Hi <strong>${userName}!</strong> In your own words, describe what you need. You can get help with writing code for Power Pages sites in HTML, CSS, and JS languages.</p>`;
        messageElement.appendChild(loggedInDiv);
      }
    };
  }

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The JSON data our extension sent
   
    switch (message.type) {
      case "apiResponse": {
        apiResponseHandler.updateResponse(message.value);
        break;
      }
      case "env": {
    
        welcomeScreen = setWelcomeScreen();
        break;
      }
      case "userName": {
       
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
        chatMessages.innerHTML = "";
        welcomeScreen = setWelcomeScreen();
        welcomeScreen.userLoggedIn();
        break;
      }
      case "enableInput": {
        chatInput.disabled = false;
      }
    }
  });

  function handleLoginButtonClick() {
    vscode.postMessage({ type: "login" });
  }

  function getApiResponse(userPrompt) {
    apiResponseHandler = handleAPIResponse();
    apiResponseHandler.updateThinking("Working on it...");
    vscode.postMessage({ type: "newUserPrompt", value: userPrompt });
  }

  function insertCode(code) {
    vscode.postMessage({ type: "insertCode", value: code });
  }

  function copyCodeToClipboard(code) {
    vscode.postMessage({ type: "copyCodeToClipboard", value: code });
  }

  function sendUserFeedback(feedback) {
    vscode.postMessage({ type: "userFeedback", value: feedback });
  }

  SendButton?.addEventListener("click", () => {
    if ((chatInput).value.trim()) {
      handleUserMessage((chatInput).value);
      chatInput.disabled = true;
      getApiResponse((chatInput).value);
      (chatInput).value = "";
      (chatInput).focus();
    }
  });

  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (chatInput).value.trim()) {
      handleUserMessage((chatInput).value);
      chatInput.disabled = true;
      getApiResponse((chatInput).value);
      (chatInput).value = "";
    }
  });
  chatMessages.addEventListener("click", handleFeedbackClick);

  function handleFeedbackClick(event) {
    const target = event.target;

    if (target.classList.contains("thumbsup")) {
      handleThumbsUpClick(target);
    }

    if (target.classList.contains("thumbsdown")) {
      handleThumbsDownClick(target);
    }
  }

  function handleThumbsUpClick(element) {
    if (element.classList.contains("thumbsup-clicked")) {
      return; // Do nothing if it already has the class
    }

    const thumbsDownPath= element.parentNode.querySelector("#thumbsdown-path")

    const thumpsUpPath = element.parentNode.querySelector("#thumbsup-path")
    thumpsUpPath.classList.add("thumbsup-clicked");
    thumbsDownPath.classList.remove("thumbsdown-clicked");

    sendUserFeedback("thumbsUp");
  }

  function handleThumbsDownClick(element) {
    if (element.classList.contains("thumbsdown-clicked")) {
      return; // Do nothing if it already has the class
    }

    const thumbsUpPath= element.parentNode.querySelector("#thumbsup-path")

    const thumbsDownPath= element.parentNode.querySelector("#thumbsdown-path")
    thumbsDownPath.classList.add("thumbsdown-clicked");
    thumbsUpPath.classList.remove("thumbsup-clicked");

 
    sendUserFeedback("thumbsDown");
  }



})();
