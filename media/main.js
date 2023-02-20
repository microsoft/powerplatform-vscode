/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// "use strict";
// const path = require('path');
// const cancel = path.resolve('../src/web/client/assets/cancel.svg');

function renderSurvey(parentElementId,FirstName, LastName, locale, environmentId, geo, UserId, TenantId, prompted)
{
    // eslint-disable-next-line no-undef
    const se = new window['SurveyEmbed']("v4j5cvGGr0GRqy180BHbRytFqxSnvs1AqKx-mFT6qLBUOE5POUVGTVRDUDI1SEVaOFVaV1RGM0k4VyQlQCN0PWcu",
    "https://customervoice.microsoft.com/","https://mfpembedcdnmsit.azureedge.net/mfpembedcontmsit","true");
    const context = {
        "First Name": FirstName,
        "Last Name": LastName,
        "locale": locale,
        "environmentId": environmentId,
        "geo": geo,
        "UserId": UserId,
        "TenantId": TenantId,
        "prompted": prompted,
    };
    se.renderPopup(context);
}

function resizeSurvey() {
    // eslint-disable-next-line no-undef
    const embedPopup = document.getElementById('MfpEmbed_Popup');
    if (embedPopup) {
      // eslint-disable-next-line no-undef
      if (window.innerHeight <= 600) {
        embedPopup.style.maxWidth = '80%';
        embedPopup.style.height = '90%';
      } else {
        embedPopup.style.maxWidth = '420px';
        embedPopup.style.height = '460px';
      }
    }
  }

  // Apply custom styles to modal div and exit button
function applyCustomStyles() {
    // eslint-disable-next-line no-undef
    const iconDiv = document.getElementById('mfpembed_iconDiv');
    if (iconDiv) {
      iconDiv.style.width = '21px';
      iconDiv.style.height = '21px';
      iconDiv.style.border = '0px';
      iconDiv.style.right = '6px';
      iconDiv.style.top = '6px';
      iconDiv.style.position = 'absolute';
      iconDiv.style.marginRight = '0';
      iconDiv.style.marginTop = '0';
      iconDiv.style.fontStyle = 'normal';
      iconDiv.style.borderRadius = '50%';
      iconDiv.style.borderColor = 'white';
    }
  
    // eslint-disable-next-line no-undef
    const crossButtonDiv = document.getElementById('MfpEmbed_CrossButton');
    if (crossButtonDiv) {
      // TODO: need to render cancel button
     // crossButtonDiv.setAttribute('src',cancel.toString());
      crossButtonDiv.style.width = '14px';
      crossButtonDiv.style.height = '14px';
      crossButtonDiv.style.boxSizing = 'unset';
      crossButtonDiv.style.cursor = 'pointer';
    }
  
    // eslint-disable-next-line no-undef
    const iFrame = document.getElementById('MfpEmbed_Popup_Iframe');
    if (iFrame) {
      iFrame.style.borderRadius = '2px';
      iFrame.addEventListener('load', () => {
        iFrame.focus();
        iFrame.setAttribute('tabindex', '1');
      });
      // TODO: Localization
      if (!iFrame.hasAttribute('title')) {
        iFrame.setAttribute('title','SurveyTile');
      }
      // TODO: Localization
      if (!iFrame.hasAttribute('aria-label')) {
        iFrame.setAttribute('aria-label', 'SurveyTile');
      }
    }
  
    // eslint-disable-next-line no-undef
    const closeButton = document.getElementById('MfpEmbed_CrossButton');
    // eslint-disable-next-line no-undef
    const embedPopup = document.getElementById('MfpEmbed_Popup');
    if (closeButton) {
      closeButton.setAttribute('tabindex', '1');
      if (!closeButton.hasAttribute('alt')) {
        // TODO: Localization
        closeButton.setAttribute('alt', 'Close');
      }
      closeButton.addEventListener('focusout', () => {
        embedPopup?.focus();
        iFrame?.focus();
      });
      closeButton.addEventListener('keypress', () => {
        closeButton.click();
      });
    }
  }
  
  function loadSurvey(){
    renderSurvey("surveyDiv", "Bert", "Hair", "en-US", "123", "IND", "bert.hair@contoso.com", "12345", "Product Overview");
    resizeSurvey();
    applyCustomStyles();
  }

loadSurvey();