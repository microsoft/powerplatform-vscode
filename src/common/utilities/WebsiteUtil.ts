/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ActiveOrgOutput } from "../../client/pac/PacTypes";
import { ADX_WEBSITE_RECORDS_API_PATH, ADX_WEBSITE_RECORDS_FETCH_FAILED, GET_ALL_WEBSITES_FAILED, POWERPAGES_SITE_RECORDS_FETCH_FAILED, POWERPAGES_SITE_RECORDS_API_PATH } from "../constants";
import { oneDSLoggerWrapper } from "../OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { dataverseAuthentication } from "../services/AuthenticationProvider";
import { ServiceEndpointCategory, WebsiteDataModel } from "../services/Constants";
import { IWebsiteDetails } from "../services/Interfaces";
import { PPAPIService } from "../services/PPAPIService";
import { getUserAgent } from "./Utils";

type PowerPagesSiteRecords = {
    name: string;
    primarydomainname: string;
    powerpagesiteid: string;
}

type AdxWebsiteRecords = {
    adx_name: string;
    adx_primarydomainname: string;
    adx_websiteid: string;
}

export async function getActiveWebsites(serviceEndpointStamp: ServiceEndpointCategory, environmentId: string): Promise<IWebsiteDetails[] | undefined> {
    const websites = await PPAPIService.getWebsiteDetails(serviceEndpointStamp, environmentId);
    return websites?.value;
}

export async function getAllWebsites(orgDetails: ActiveOrgOutput): Promise<IWebsiteDetails[] | undefined> {
    const websites: IWebsiteDetails[] = [];
    try {
        const dataverseToken = (await dataverseAuthentication(orgDetails.OrgUrl ?? '', true)).accessToken;
        const adxWebsiteRecords = await getAdxWebsiteRecords(orgDetails.OrgUrl, dataverseToken);
        const powerPagesSiteRecords = await getPowerPagesSiteRecords(orgDetails.OrgUrl, dataverseToken);

        adxWebsiteRecords.forEach(adxWebsite => {
            websites.push({
                name: adxWebsite.adx_name,
                websiteUrl: adxWebsite.adx_primarydomainname,
                dataverseInstanceUrl: orgDetails.OrgUrl,
                dataverseOrganizationId: orgDetails.OrgId,
                dataModel: WebsiteDataModel.Standard,
                environmentId: orgDetails.EnvironmentId,
                websiteRecordId: adxWebsite.adx_websiteid,
            });
        });

        powerPagesSiteRecords.forEach(powerPagesSite => {
            websites.push({
                name: powerPagesSite.name,
                websiteUrl: powerPagesSite.primarydomainname,
                dataverseInstanceUrl: orgDetails.OrgUrl,
                dataverseOrganizationId: orgDetails.OrgId,
                dataModel: WebsiteDataModel.Enhanced,
                environmentId: orgDetails.EnvironmentId,
                websiteRecordId: powerPagesSite.powerpagesiteid,
            });
        });
    }
    catch (error) {
        oneDSLoggerWrapper.getLogger().traceError(GET_ALL_WEBSITES_FAILED, GET_ALL_WEBSITES_FAILED, error as Error);
    }
    return websites; 
}

async function getAdxWebsiteRecords(orgUrl: string, token: string) {
    try {
        const dataverseUrl = `${orgUrl.endsWith('/') ? orgUrl : orgUrl.concat('/')}${ADX_WEBSITE_RECORDS_API_PATH}`;
        const response = await makeApiCall(dataverseUrl, token);

        if (response.ok) {
            // TODO: perform response format validation
            const data = await response.json() as { value: AdxWebsiteRecords[] };
            return data.value;
        }

        throw new Error(`Failed to fetch ADX website records. Status: ${response.status}`);
    } catch (error) {
        oneDSLoggerWrapper.getLogger().traceError(ADX_WEBSITE_RECORDS_FETCH_FAILED, ADX_WEBSITE_RECORDS_FETCH_FAILED, error as Error);
    }
    return [];
}

async function getPowerPagesSiteRecords(orgUrl: string, token: string) {
    try {
        const dataverseUrl = `${orgUrl.endsWith('/') ? orgUrl : orgUrl.concat('/')}${POWERPAGES_SITE_RECORDS_API_PATH}`;
        const response = await makeApiCall(dataverseUrl, token);

        if (response.ok) {
            // TODO: perform response format validation
            const data = await response.json() as { value: PowerPagesSiteRecords[] };
            return data.value;
        }

        throw new Error(`Failed to fetch PowerPages site records. Status: ${response.status}`);
    } catch (error) {
        oneDSLoggerWrapper.getLogger().traceError(POWERPAGES_SITE_RECORDS_FETCH_FAILED, POWERPAGES_SITE_RECORDS_FETCH_FAILED, error as Error);
    }
    return [];
}

async function makeApiCall(url: string, token: string) {
    const requestInit: RequestInit = {
        method: "GET",
        headers: {
            'Content-Type': "application/json",
            Authorization: `Bearer ${token}`,
            "x-ms-user-agent": getUserAgent()
        },
    };

    return await fetch(url, requestInit);
}
