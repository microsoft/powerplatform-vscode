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
  let isLoggedIn = false;
  let apiResponseInProgress = false;
  let selectedCode = "";
  let copilotStrings = {};


  const inputHistory = [];
  let currentIndex = -1;


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

  const bookIconSvg = '<svg class="play-icon" width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.5067 0.973333L13.9867 1.50667V11.48L13.5067 12.0133H8.22667L7.37333 12.8667H6.62667L5.77333 12.0133H0.493333L0.0133333 11.48V1.50667L0.493333 0.973333H5.98667L6.36 1.13333L7 1.77333L7.64 1.13333L8.01333 0.973333H13.5067ZM6.52 11.32V2.73333L5.77333 1.98667H1.02667V11H5.98667L6.30667 11.16L6.52 11.32ZM13.0267 11V1.98667H8.22667L7.53333 2.68V11.2667L7.64 11.16L8.01333 11H13.0267ZM5.02667 4.01333V4.97333H1.98667V4.01333H5.02667ZM5.02667 8.01333V8.97333H1.98667V8.01333H5.02667ZM1.98667 5.98667V7H5.02667V5.98667H1.98667ZM12.0133 4.01333V4.97333H9.02667V4.01333H12.0133ZM9.02667 5.98667V7H12.0133V5.98667H9.02667ZM9.02667 8.01333V8.97333H12.0133V8.01333H9.02667Z" class="play-icon-path"/></svg>';

  const starIconSvg = '<svg class="star-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none"> <path d="M4.39804 9.80821C4.57428 9.93252 4.78476 9.99907 5.00043 9.99869C5.21633 9.99885 5.42686 9.93136 5.60243 9.80569C5.77993 9.67521 5.91464 9.49491 5.98943 9.28769L6.43643 7.91469C6.55086 7.5704 6.74391 7.25749 7.00028 7.00078C7.25665 6.74406 7.56929 6.55059 7.91343 6.43569L9.30443 5.98469C9.45636 5.93034 9.59364 5.84153 9.70551 5.72525C9.81738 5.60896 9.9008 5.46834 9.94924 5.31442C9.99767 5.1605 10.0098 4.99745 9.98468 4.83806C9.95955 4.67866 9.89786 4.52725 9.80443 4.39569C9.67034 4.20977 9.47939 4.07253 9.26043 4.00469L7.88543 3.55769C7.54091 3.44346 7.22777 3.2505 6.97087 2.99411C6.71396 2.73772 6.52035 2.42497 6.40543 2.08069L5.95343 0.69269C5.88113 0.490387 5.74761 0.315626 5.57143 0.19269C5.43877 0.0989638 5.28607 0.0374828 5.12548 0.0131369C4.96489 -0.0112087 4.80083 0.00225189 4.64636 0.0524493C4.49188 0.102647 4.35125 0.188195 4.23564 0.302292C4.12004 0.416389 4.03265 0.555887 3.98043 0.709691L3.52343 2.10969C3.40884 2.44451 3.21967 2.74893 2.97022 2.99994C2.72076 3.25096 2.41753 3.44202 2.08343 3.55869L0.692428 4.00669C0.540653 4.06109 0.403522 4.14987 0.291767 4.26608C0.180011 4.38229 0.0966621 4.52279 0.0482407 4.67658C-0.000180673 4.83036 -0.0123605 4.99327 0.0126534 5.15254C0.0376676 5.31182 0.0991972 5.46315 0.192428 5.59469C0.320272 5.77414 0.501046 5.90911 0.709428 5.98069L2.08343 6.42569C2.52354 6.57217 2.90999 6.84652 3.19343 7.21369C3.35585 7.42433 3.4813 7.66103 3.56443 7.91369L4.01643 9.30469C4.08846 9.50798 4.22179 9.68391 4.39804 9.80821ZM4.48343 2.39369L5.01043 1.01669L5.44943 2.39369C5.61312 2.88684 5.88991 3.33485 6.25767 3.70192C6.62544 4.06899 7.07397 4.34493 7.56743 4.50769L8.97343 5.03669L7.59143 5.48469C7.09866 5.64899 6.65095 5.92585 6.28382 6.29332C5.9167 6.6608 5.64026 7.10876 5.47643 7.60169L4.95343 8.97969L4.50443 7.60069C4.34335 7.10742 4.06943 6.65852 3.70443 6.28969C3.3356 5.92165 2.88653 5.64406 2.39243 5.47869L1.01443 4.95669L2.40043 4.50669C2.88672 4.33806 3.32775 4.0599 3.68943 3.69369C4.04901 3.32599 4.32049 2.8815 4.48343 2.39369ZM10.5353 13.8507C10.6713 13.9469 10.8337 13.9986 11.0003 13.9987C11.1654 13.9988 11.3264 13.9478 11.4613 13.8527C11.6008 13.7542 11.7058 13.6143 11.7613 13.4527L12.0093 12.6907C12.0625 12.5323 12.1515 12.3882 12.2693 12.2697C12.3867 12.1512 12.5307 12.0624 12.6893 12.0107L13.4613 11.7587C13.619 11.7042 13.7557 11.6018 13.8523 11.4657C13.9257 11.3627 13.9736 11.2438 13.9921 11.1187C14.0106 10.9936 13.9992 10.8659 13.9588 10.746C13.9184 10.6262 13.8501 10.5177 13.7597 10.4293C13.6692 10.3409 13.5591 10.2753 13.4383 10.2377L12.6743 9.98872C12.5162 9.93615 12.3724 9.84753 12.2544 9.72987C12.1364 9.6122 12.0473 9.46871 11.9943 9.31072L11.7423 8.53772C11.6886 8.37987 11.586 8.24325 11.4493 8.14772C11.3473 8.07477 11.2295 8.02683 11.1056 8.00777C10.9816 7.98871 10.8549 7.99906 10.7357 8.03799C10.6164 8.07692 10.508 8.14334 10.4192 8.23188C10.3304 8.32043 10.2636 8.42862 10.2243 8.54772L9.97731 9.30972C9.92502 9.46737 9.83747 9.61101 9.72131 9.72972C9.60657 9.84619 9.46665 9.9348 9.31231 9.98872L8.53931 10.2407C8.38025 10.2946 8.2422 10.3972 8.1447 10.534C8.04721 10.6707 7.99522 10.8347 7.99611 11.0026C7.99699 11.1705 8.0507 11.3339 8.14963 11.4697C8.24856 11.6054 8.38769 11.7065 8.54731 11.7587L9.31031 12.0057C9.46917 12.0591 9.61358 12.1484 9.73231 12.2667C9.85053 12.385 9.93896 12.5296 9.99031 12.6887L10.2433 13.4627C10.2981 13.6192 10.4001 13.7548 10.5353 13.8507ZM9.62231 11.0577L9.44331 10.9987L9.62731 10.9347C9.92907 10.8297 10.2027 10.657 10.4273 10.4297C10.6537 10.2007 10.8248 9.92298 10.9273 9.61772L10.9853 9.43972L11.0443 9.62072C11.1463 9.92742 11.3185 10.2061 11.5471 10.4346C11.7757 10.663 12.0545 10.835 12.3613 10.9367L12.5563 10.9997L12.3763 11.0587C12.0689 11.1609 11.7898 11.3336 11.5611 11.563C11.3324 11.7923 11.1606 12.0721 11.0593 12.3797L11.0003 12.5607L10.9423 12.3797C10.8409 12.0715 10.6687 11.7914 10.4394 11.5618C10.2102 11.3323 9.93033 11.1596 9.62231 11.0577Z" class="play-icon-path"/> </svg>'

  if (!chatInput || !chatMessages) {
    return;
  }
  const autocompletePanel = document.createElement("div");
  autocompletePanel.classList.add("autocomplete-panel");
  chatInput.parentNode?.appendChild(autocompletePanel);

  const SendButton = document.getElementById("send-button");

  vscode.postMessage({ type: "webViewLoaded" });

  function parseCodeBlocks(responseText, isUserCode) {
    const resultDiv = document.createElement("div");
    let codeLineCount = 0;

    for (let i = 0; i < responseText.length; i++) {
      const textDiv = document.createElement("div");
      textDiv.innerText = responseText[i].displayText;
      resultDiv.appendChild(textDiv);

      if (responseText[i].displayText === "Feature is not enabled for this geo.") {
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

      isUserCode ? codeDiv.classList.add("user-code") : codeDiv.classList.add("copilot-code");

      let codeBlock = responseText[i].code;

      codeLineCount += countLines(codeBlock);

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
    vscode.postMessage({ type: "codeLineCount", value: codeLineCount });
    resultDiv.classList.add("result-div");
    return resultDiv;
  }

  function countLines(str) {
    const lines = str.split('\n');
    return lines.length;
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
    messageElement.appendChild(parseCodeBlocks(message, true));

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
    if (!isCopilotEnabled) {
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
    </div>
`;

    feedback.classList.add("feedback-div");

    return feedback;
  }

  function createSuggestedPromptDiv() {
    const suggestedPrompt = document.createElement("div");
    suggestedPrompt.classList.add("suggested-prompts");

    const formPrompt = 'Write JavaScript code for form field validation to check phone field value is in the valid format.';
    const webApiPrompt = 'Write web API code to query active contact records.';
    const listPrompt = 'Write JavaScript code to highlight the row where email field is empty in table list.';

    suggestedPrompt.innerHTML = `<p class="suggested-title">Here are a few suggestions to get you started</p>
                                <a href='#' class="suggested-prompt">
                                <span class="icon-container">
                                    ${starIconSvg}
                                </span>
                                    ${formPrompt}
                                </a>
                                <br>
                                <a href='#' class="suggested-prompt">
                                <span class="icon-container">
                                    ${starIconSvg}
                                </span>
                                    ${webApiPrompt}
                                </a>
                                <br>
                                <a href='#' class="suggested-prompt">
                                <span class="icon-container">
                                    ${starIconSvg}
                                </span>
                                    ${listPrompt}
                                </a>`;

    return suggestedPrompt;
  }

  function createWalkthroughDiv() {
    const walkthrough = document.createElement("div");
    walkthrough.classList.add("walkthrough-div");
    walkthrough.innerHTML = `<p class="walkthrough-title">GETTING STARTED</p>
                            <a href="#" class="walkthrough-content">
                                ${bookIconSvg}
                                <span id="walk-text">Learn more about Copilot</span>
                            </a>`;
    return walkthrough;
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

    return {
      updateThinking: function (thinkingMessage) {
        const thinking = document.createElement("div");
        thinking.classList.add("thinking");
        thinking.innerText = thinkingMessage;

        messageElement.appendChild(thinking);
        chatMessages.scrollTop = chatMessages.scrollHeight - chatMessages.clientHeight;
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
        chatMessages.scrollTop = chatMessages.scrollHeight - chatMessages.clientHeight;
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
        loggedInDiv.innerHTML = `<p id="greeting">Hi <strong>${userName}!</strong> In your own words, describe what you need. You can get help with writing code for Power Pages sites in HTML, CSS, and JS languages.</p>
                                `;
        messageElement.appendChild(loggedInDiv);

        const suggestedPromptDiv = createSuggestedPromptDiv();
        messageElement.appendChild(suggestedPromptDiv);

        const suggestedPrompts = document.querySelectorAll(".suggested-prompt");
        suggestedPrompts.forEach((suggestedPrompt) => {
          suggestedPrompt.addEventListener("click", handleSuggestionsClick);
        });

        const walkthroughDiv = createWalkthroughDiv();
        messageElement.appendChild(walkthroughDiv);

        const walkthroughContent = document.getElementById("walk-text");
        walkthroughContent.addEventListener("click", handleWalkthroughClick);

      }
    };
  }

  function setDiabledScreen() {
    const messageWrapper = document.createElement("div");
    messageWrapper.classList.add("message-wrapper");

    const messageElement = document.createElement("div");
    const makerElement = createCopilotSection();
    messageElement.appendChild(makerElement);

    messageElement.classList.add("message", "api-response");

    messageWrapper.appendChild(messageElement);

    chatMessages.appendChild(messageWrapper);

    const notAvailabel = document.createElement("div");
    notAvailabel.classList.add("not-available");
    notAvailabel.innerHTML = `<p id="notAvailableGreeting"></p>
    <p>Hi! Your Microsoft account doesn’t currently support Copilot. Contact your admin for details</p>
    <p>To know more, see <a href="https://go.microsoft.com/fwlink/?linkid=2206366">Copilot in Power Pages documentation.<a></p>`;

    messageElement.appendChild(notAvailabel);

  }

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The JSON data our extension sent

    switch (message.type) {
      case "copilotStrings": {
        copilotStrings = message.value; //Localized string values object
        break;
      }
      case "apiResponse": {
        apiResponseHandler.updateResponse(message.value);
        apiResponseInProgress = false;
        break;
      }
      case "env": {

        welcomeScreen = setWelcomeScreen();
        break;
      }
      case "isLoggedIn": {
        isLoggedIn = message.value;
        break;
      }
      case "userName": {
        userName = message.value;
        break;
      }
      case "welcomeScreen": {
        if (isLoggedIn) {
          welcomeScreen.userLoggedIn();
        } else {
          welcomeScreen.userNotLoggedIn();
        }
        break;
      }
      case "clearConversation": {
        if(isCopilotEnabled) {
        chatMessages.innerHTML = "";
        welcomeScreen = setWelcomeScreen();
        welcomeScreen.userLoggedIn();
        }
        break;
      }
      case "enableInput": {
        chatInput.disabled = false;
        break;
      }
      case "Unavailable": {
        isCopilotEnabled = false;
        chatMessages.innerHTML = "";
        setDiabledScreen();
        chatInputComponent.classList.add("hide");
        break;
      }
      case "Available": {
        if(isCopilotEnabled== false) {
          isCopilotEnabled = true;
          chatInputComponent.classList.remove("hide");
          chatMessages.innerHTML = "";
          welcomeScreen = setWelcomeScreen();
          welcomeScreen.userLoggedIn();
        }
        break;
    }
        case "selectedCodeInfo": {
            const chatInputLabel = document.getElementById("input-label-id");
            selectedCode = message.value.selectedCode;
            if (message.value.start == message.value.end && selectedCode.length == 0) {
                chatInputLabel.classList.add("hide");
                break;
            }
            chatInputLabel.classList.remove("hide");
            chatInputLabel.innerText = `Lines: ${message.value.start + 1} - ${message.value.end + 1} selected`;
            break;
        }
        case "explainCode": {
            selectedCode = message.value.selectedCode;
            const explainPrompt = copilotStrings.EXPLAIN_CODE_PROMPT;
            processUserInput(explainPrompt);
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

  function handleWalkthroughClick() {
    vscode.postMessage({ type: "walkthrough" });
  }

  function processUserInput(input) {
    if (apiResponseInProgress) {
      return;
    }
    if (input) {
      const userPrompt = [{ displayText: input, code: selectedCode }];
      handleUserMessage(userPrompt);
      chatInput.disabled = true;
      saveInputToHistory(input);
      apiResponseInProgress = true;
      getApiResponse(input + ': ' + selectedCode); //TODO: userPrompt object should be passed
      chatInput.value = "";
      chatInput.focus();
    }
  }


  SendButton?.addEventListener("click", () => {
    processUserInput(chatInput.value.trim());
  });

  chatInput.addEventListener("keydown", (event) => {
    if(apiResponseInProgress && event.key !== "Enter") {
      return;
    }
    if (event.key === "Enter") {
      processUserInput(chatInput.value.trim());
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

    const thumbsDownPath = element.parentNode.querySelector("#thumbsdown-path")

    const thumpsUpPath = element.parentNode.querySelector("#thumbsup-path")
    thumpsUpPath.classList.add("thumbsup-clicked");
    thumbsDownPath.classList.remove("thumbsdown-clicked");

    sendUserFeedback("thumbsUp");
  }

  function handleThumbsDownClick(element) {
    if (element.classList.contains("thumbsdown-clicked")) {
      return; // Do nothing if it already has the class
    }

    const thumbsUpPath = element.parentNode.querySelector("#thumbsup-path")

    const thumbsDownPath = element.parentNode.querySelector("#thumbsdown-path")
    thumbsDownPath.classList.add("thumbsdown-clicked");
    thumbsUpPath.classList.remove("thumbsup-clicked");


    sendUserFeedback("thumbsDown");
  }

  function handleSuggestionsClick() {
    const suggestedPrompt = this.innerText.trim();
    processUserInput(suggestedPrompt);
  }

  chatInput.addEventListener('keydown', handleArrowKeys);

  function handleArrowKeys(event) {
    if (document.activeElement !== chatInput) {
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      handleArrowUp();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      handleArrowDown();
    }
  }

  function handleArrowUp() {
    if (currentIndex < inputHistory.length - 1) {
      currentIndex++;
    }
    updateInputBoxValue();
  }

  function handleArrowDown() {
    if (currentIndex >= 0) {
      currentIndex--;
    }
    updateInputBoxValue();
  }

  function updateInputBoxValue() {
    if (currentIndex >= 0) {
      chatInput.value = inputHistory[inputHistory.length - 1 - currentIndex];
    } else {
      chatInput.value = '';
    }
  }

  function saveInputToHistory(inputValue) {
    if (inputHistory.length >= 50) {
      inputHistory.shift();
    }
    inputHistory.push(inputValue);
    currentIndex = -1;
  }


})();
