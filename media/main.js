/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable no-undef */

function renderSurvey(
    TenantId,
    EnvironmentId,
    Geo,
    ProductVersion,
    Culture,
    DeviceType,
    UrlReferrer,
    FormsProEligibilityId
) {
    // eslint-disable-next-line no-undef
    const se = new window["SurveyEmbed"](
        "v4j5cvGGr0GRqy180BHbRytFqxSnvs1AqKx-mFT6qLBUOE5POUVGTVRDUDI1SEVaOFVaV1RGM0k4VyQlQCN0PWcu",
        "https://customervoice.microsoft.com/",
        "https://mfpembedcdnmsit.azureedge.net/mfpembedcontmsit/",
        "true"
    );
    const context = {
        TenantId: TenantId,
        EnvironmentId: EnvironmentId,
        Geo: Geo,
        ProductVersion: ProductVersion,
        Culture: Culture,
        DeviceType: DeviceType,
        UrlReferrer: UrlReferrer,
    };
    if (FormsProEligibilityId) {
        context.FormsProEligibilityId = FormsProEligibilityId;
    }
    se.renderPopup(context);
}

function resizeSurvey() {
    // eslint-disable-next-line no-undef
    const embedPopup = document.getElementById("MfpEmbed_Popup");
    if (embedPopup) {
        // eslint-disable-next-line no-undef
        if (window.innerHeight <= 600) {
            embedPopup.style.maxWidth = "80%";
            embedPopup.style.height = "90%";
        } else {
            embedPopup.style.maxWidth = "420px";
            embedPopup.style.height = "460px";
        }
    }
}

// Apply custom styles to modal div and exit button
function applyCustomStyles() {
    // eslint-disable-next-line no-undef
    const iconDiv = document.getElementById("mfpembed_iconDiv");
    if (iconDiv) {
        iconDiv.style.width = "21px";
        iconDiv.style.height = "21px";
        iconDiv.style.border = "0px";
        iconDiv.style.right = "6px";
        iconDiv.style.top = "6px";
        iconDiv.style.position = "absolute";
        iconDiv.style.marginRight = "0";
        iconDiv.style.marginTop = "0";
        iconDiv.style.fontStyle = "normal";
        iconDiv.style.borderRadius = "50%";
        iconDiv.style.borderColor = "white";
    }

    // eslint-disable-next-line no-undef
    const crossButtonDiv = document.getElementById("MfpEmbed_CrossButton");
    if (crossButtonDiv) {
        crossButtonDiv.remove();
        const cancelSvgDiv = document.createElement("div");
        cancelSvgDiv.innerHTML = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.1016 1.60156L8.20312 7.5L14.1016 13.3984L13.3984 14.1016L7.5 8.20312L1.60156 14.1016L0.898438 13.3984L6.79688 7.5L0.898438 1.60156L1.60156 0.898438L7.5 6.79688L13.3984 0.898438L14.1016 1.60156Z" fill="#323130"/>
      </svg>`;
        cancelSvgDiv.style.width = "14px";
        cancelSvgDiv.style.height = "14px";
        cancelSvgDiv.style.boxSizing = "unset";
        cancelSvgDiv.style.cursor = "pointer";
        iconDiv.appendChild(cancelSvgDiv);
    }

    // eslint-disable-next-line no-undef
    const iFrame = document.getElementById("MfpEmbed_Popup_Iframe");
    if (iFrame) {
        iFrame.style.borderRadius = "2px";
        iFrame.addEventListener("load", () => {
            iFrame.focus();
            iFrame.setAttribute("tabindex", "1");
        });
        // TODO: Localization
        if (!iFrame.hasAttribute("title")) {
            iFrame.setAttribute("title", "SurveyTile");
        }
        // TODO: Localization
        if (!iFrame.hasAttribute("aria-label")) {
            iFrame.setAttribute("aria-label", "SurveyTile");
        }
    }

    // eslint-disable-next-line no-undef
    const closeButton = document.getElementById("MfpEmbed_CrossButton");
    // eslint-disable-next-line no-undef
    const embedPopup = document.getElementById("MfpEmbed_Popup");
    if (closeButton) {
        closeButton.setAttribute("tabindex", "1");
        if (!closeButton.hasAttribute("alt")) {
            // TODO: Localization
            closeButton.setAttribute("alt", "Close");
        }
        closeButton.addEventListener("focusout", () => {
            embedPopup?.focus();
            iFrame?.focus();
        });
        closeButton.addEventListener("keypress", () => {
            closeButton.click();
        });
    }
}

function loadSurvey() {
    const el = document.querySelector("#npsContext");
    const tenantId = el.dataset.tid;
    const urlReferrer = el.dataset.urlReferrer;
    const envId = el.dataset.envId;
    const geo = el.dataset.geo;
    const culture = el.dataset.culture;
    const productVersion = el.dataset.productVersion;
    const deviceType = el.dataset.deviceType;
    const formsProEligibilityId = el.dataset.formsProEligibilityId;
    renderSurvey(
        tenantId,
        envId,
        geo,
        productVersion,
        culture,
        deviceType,
        urlReferrer,
        formsProEligibilityId
    );
    resizeSurvey();
    applyCustomStyles();
}

loadSurvey();
