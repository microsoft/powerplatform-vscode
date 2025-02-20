/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import jwt_decode from 'jwt-decode';
import { npsAuthentication } from "../../../common/services/AuthenticationProvider";
import { httpMethod, queryParameters } from '../common/constants';
import { RequestInit } from 'node-fetch'
import WebExtensionContext from '../WebExtensionContext';
import { webExtensionTelemetryEventNames } from '../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents';
import { getCurrentDataBoundary } from '../utilities/dataBoundary';
import { SurveyConstants } from '../../../common/copilot/user-feedback/constants';

export class NPSService {
    public static getCesHeader(accessToken: string) {
        return {
            authorization: "Bearer " + accessToken,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        };
    }

    public static getNpsSurveyEndpoint(): string {
        const region = WebExtensionContext.urlParametersMap?.get(queryParameters.REGION)?.toLowerCase();
        const dataBoundary = getCurrentDataBoundary();
        let npsSurveyEndpoint = '';
        switch (region) {
            case 'tie':
            case 'test':
            case 'preprod':
                switch (dataBoundary) {
                    case 'eu':
                        npsSurveyEndpoint = 'https://europe.tip1.ces.microsoftcloud.com';
                        break;
                    default:
                        npsSurveyEndpoint = 'https://world.tip1.ces.microsoftcloud.com';
                }
                break;
            case 'prod':
            case 'preview':
                switch (dataBoundary) {
                    case 'eu':
                        npsSurveyEndpoint = 'https://europe.ces.microsoftcloud.com';
                        break;
                    default:
                        npsSurveyEndpoint = 'https://world.ces.microsoftcloud.com';
                }
                break;
            case 'gov':
            case 'high':
            case 'dod':
            case 'mooncake':
                npsSurveyEndpoint = 'https://world.ces.microsoftcloud.com';
                break;
            case 'ex':
            case 'rx':
            default:
                break;
        }

        return npsSurveyEndpoint;
    }

    public static async setEligibility() {
        try {

            const baseApiUrl = this.getNpsSurveyEndpoint();
            const accessToken: string = await npsAuthentication(SurveyConstants.AUTHORIZATION_ENDPOINT);

            if (accessToken) {
                WebExtensionContext.telemetry.sendInfoTelemetry(webExtensionTelemetryEventNames.WEB_EXTENSION_NPS_AUTHENTICATION_COMPLETED);
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const parsedToken = jwt_decode(accessToken) as any;
            WebExtensionContext.setUserId(parsedToken?.oid)
            const apiEndpoint = `${baseApiUrl}/api/v1/${SurveyConstants.TEAM_NAME}/Eligibilities/${SurveyConstants.SURVEY_NAME}?userId=${parsedToken?.oid}&eventName=${SurveyConstants.EVENT_NAME}&tenantId=${parsedToken.tid}`;
            const requestInitPost: RequestInit = {
                method: httpMethod.POST,
                body: '{}',
                headers: NPSService.getCesHeader(accessToken)
            };
            const requestSentAtTime = new Date().getTime();
            const response = await WebExtensionContext.concurrencyHandler.handleRequest(apiEndpoint, requestInitPost);
            const result = await response?.json();
            if (result?.Eligibility) {
                WebExtensionContext.telemetry.sendAPISuccessTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_NPS_USER_ELIGIBLE,
                    "NPS Api",
                    httpMethod.POST,
                    new Date().getTime() - requestSentAtTime,
                    this.setEligibility.name
                );
                WebExtensionContext.setNPSEligibility(true);
                WebExtensionContext.setFormsProEligibilityId(result?.FormsProEligibilityId);
            }
        } catch (error) {
            WebExtensionContext.telemetry.sendErrorTelemetry(webExtensionTelemetryEventNames.WEB_EXTENSION_NPS_API_FAILED, this.setEligibility.name, (error as Error)?.message, error as Error);
        }
    }
}
