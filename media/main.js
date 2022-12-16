/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

function renderSurvey(parentElementId,FirstName, LastName, locale, environmentId, geo, UserId, TenantId, prompted)
{
    // eslint-disable-next-line no-undef
    const se = new window['SurveyEmbed']("v4j5cvGGr0GRqy180BHbRytFqxSnvs1AqKx-mFT6qLBUOE5POUVGTVRDUDI1SEVaOFVaV1RGM0k4VyQlQCN0PWcu",
    "https://customervoice.microsoft.com/","https://mfpembedcdnmsit.azureedge.net/mfpembedcontmsit/","true");
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

// eslint-disable-next-line no-undef
window.addEventListener('load', () => {
    renderSurvey("surveyDiv", "Bert", "Hair", "en-US", "123", "IND", "bert.hair@contoso.com", "12345", "Product Overview");
   }, false);
