/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import jwt_decode from 'jwt-decode';
import { npsAuthentication } from "../common/authenticationProvider";
import {CESSurvey, queryParameters} from '../common/constants';
import fetch,{RequestInit} from 'node-fetch'
import WebExtensionContext from '../WebExtensionContext';

export class NPSService{
    public static getCesHeader(accessToken: string) {
        return {
            authorization: "Bearer " + accessToken,
            Accept: 'application/json',
           'Content-Type': 'application/json',
        };
    }

    public static async getEligibility()  {
        const region = WebExtensionContext.urlParametersMap?.get(queryParameters.REGION)
        const baseApiUrl = region === 'test' ? "https://ces-int.microsoftcloud.com/api/v1": "https://ces.microsoftcloud.com/api/v1";
        const accessToken: string = await npsAuthentication(CESSurvey.AUTHORIZATION_ENDPOINT);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsedToken = jwt_decode(accessToken) as any;
        WebExtensionContext.setUserId(parsedToken?.oid)
        const apiEndpoint = `${baseApiUrl}/${CESSurvey.TEAM_NAME}/Eligibilities/${CESSurvey.SURVEY_NAME}?userId=${parsedToken?.oid}&eventName=${CESSurvey.EVENT_NAME}&tenantId=${parsedToken.tid}`;
        const requestInitPost: RequestInit = {
            method: 'POST',
            body:'{}',
            headers:NPSService.getCesHeader(accessToken)
        };
        const response = await fetch(apiEndpoint, requestInitPost);
        const result = await response?.json();
        // TODO: telemetry
        if( result?.eligibility){
          WebExtensionContext.setNPSEligibility(true);
        }
    }
}