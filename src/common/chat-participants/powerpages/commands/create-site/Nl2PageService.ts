/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { oneDSLoggerWrapper } from "../../../../OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { getCommonHeaders } from "../../../../services/AuthenticationProvider";
import { ABOUT_PAGE_TYPE, FAQ_PAGE_TYPE, HOME_PAGE_TYPE, INFO_PAGE_TYPE, NL2PAGE_GENERATE_NEW_PAGE, NL2PAGE_REQUEST_FAILED, NL2PAGE_SCENARIO, NL2PAGE_SCOPE} from "../../PowerPagesChatParticipantConstants";
import { VSCODE_EXTENSION_NL2PAGE_REQUEST_FAILED, VSCODE_EXTENSION_NL2PAGE_REQUEST_SUCCESS } from "../../PowerPagesChatParticipantTelemetryConstants";

export async function getNL2PageData(aibEndpoint: string, aibToken: string, userPrompt: string, siteName: string, sitePagesList: string[], sessionId: string, orgId: string, envId: string, userId: string) {

    const constructRequestBody = (pageType: string, colorNumber:number, exampleNumber: number) => ({
        "crossGeoOptions": {
            "enableCrossGeoCall": true
        },
        "question": `${userPrompt} - ${pageType} page`,
        "context": {
            "shouldCheckBlockList": false,
            "sessionId": sessionId,
            "scenario": NL2PAGE_SCENARIO,
            "subScenario": NL2PAGE_GENERATE_NEW_PAGE,
            "version": "V1",
            "information": {
                "scope": NL2PAGE_SCOPE,
                "includeImages": true,
                "pageType": pageType === 'FAQ' ? 'FAQ' : 'Home', //Verify if this is correct
                "title": siteName,
                "pageName": pageType,
                "colorNumber": colorNumber,
                "shuffleImages": false,
                "exampleNumber": exampleNumber
            }
        }
    });

    const requests = sitePagesList.map(async pageType => {
        const colorNumber = generateRandomColorNumber();
        const exampleNumber = generateRandomExampleNumber(pageType);
        const requestBody = constructRequestBody(pageType, colorNumber, exampleNumber);

        const requestInit: RequestInit = {
            method: "POST",
            headers: getCommonHeaders(aibToken),
            body: JSON.stringify(requestBody)
        };

        try {
            const response = await fetch(aibEndpoint, requestInit);
            if (!response.ok) {
                throw new Error(`${NL2PAGE_REQUEST_FAILED} ${pageType}`);
            }

            const responseData = await response.json();

            if (responseData && responseData.additionalData[0]) {
                return responseData.additionalData[0].snippets[0];
            }
            return null;
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_NL2PAGE_REQUEST_FAILED, error as string, error as Error, { sessionId: sessionId, orgId:orgId, envId: envId, userId: userId, pageType: pageType}, {});
            return null;
        }
    });

    const responses = await Promise.all(requests);

    oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_NL2PAGE_REQUEST_SUCCESS, { sessionId });

    // TODO: Home page is mandatory, so if it is not generated, return null
    return responses.filter(response => response !== null);
}

export const generateRandomColorNumber = () => {
    const colorNumbers = [1, 2, 3, 5, 6, 7, 8];
    return colorNumbers[Math.floor(Math.random() * colorNumbers.length)];
  };

  export const generateRandomExampleNumber = (pageType: string) => {
    const isFaqOrAboutPage = pageType === FAQ_PAGE_TYPE || pageType === ABOUT_PAGE_TYPE;
    if (isFaqOrAboutPage) {
      return 0;
    } else if (pageType === HOME_PAGE_TYPE) {
      const homeExampleNumbers = [1, 2, 3, 4];
      return homeExampleNumbers[Math.floor(Math.random() * homeExampleNumbers.length)];
    } else if (pageType === INFO_PAGE_TYPE) {
      const infoExampleNumbers = [1, 2, 3];
      return infoExampleNumbers[Math.floor(Math.random() * infoExampleNumbers.length)];
    }
    return 0;
  };
