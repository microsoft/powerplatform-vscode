/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import jwt_decode from 'jwt-decode';
import { npsAuthentication } from "../common/authenticationProvider";
import {SurveyConstants, httpMethod, queryParameters} from '../common/constants';
import fetch,{RequestInit} from 'node-fetch'
import WebExtensionContext from '../WebExtensionContext';
import { telemetryEventNames } from '../telemetry/constants';

export class NPSService{
    public static getCesHeader(accessToken: string) {
        return {
            authorization: "Bearer " + accessToken,
            Accept: 'application/json',
           'Content-Type': 'application/json',
        };
    }

    public static async setEligibility()  {
        const region = WebExtensionContext.urlParametersMap?.get(queryParameters.REGION)
        const baseApiUrl = region === 'test' ? "https://ces-int.microsoftcloud.com/api/v1": "https://ces.microsoftcloud.com/api/v1";
        
        try{
                const accessToken: string = await npsAuthentication(SurveyConstants.AUTHORIZATION_ENDPOINT);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const parsedToken = jwt_decode(accessToken) as any;
                WebExtensionContext.setUserId(parsedToken?.oid)
                const apiEndpoint = `${baseApiUrl}/${SurveyConstants.TEAM_NAME}/Eligibilities/${SurveyConstants.SURVEY_NAME}?userId=${parsedToken?.oid}&eventName=${SurveyConstants.EVENT_NAME}&tenantId=${parsedToken.tid}`;
                const requestInitPost: RequestInit = {
                    method: httpMethod.POST,
                    body:'{}',
                    headers:NPSService.getCesHeader(accessToken)
                };
                const requestSentAtTime = new Date().getTime();
                const response = await fetch(apiEndpoint, requestInitPost);
                const result = await response?.json();
                if( result?.eligibility){
                    console.log("djshdjshdjshdjhsjdhjshdjhsjh")
                    WebExtensionContext.telemetry.sendAPISuccessTelemetry(telemetryEventNames.NPS_USER_ELIGIBLE, "NPS Api",httpMethod.POST,new Date().getTime() - requestSentAtTime);
                    WebExtensionContext.setNPSEligibility(true);
                }
        }catch(error){
            WebExtensionContext.telemetry.sendErrorTelemetry(telemetryEventNames.NPS_API_FAILED, (error as Error)?.message);
        }
    }
}