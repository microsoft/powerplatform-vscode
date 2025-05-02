/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { OrgInfo } from "../../client/pac/PacTypes";
import { Constants } from "../../client/power-pages/actions-hub/Constants";
import { ADX_WEBSITE_RECORDS_API_PATH, ADX_WEBSITE_RECORDS_FETCH_FAILED, GET_ALL_WEBSITES_FAILED, POWERPAGES_SITE_RECORDS_FETCH_FAILED, POWERPAGES_SITE_RECORDS_API_PATH, APP_MODULES_PATH, APP_MODULES_FETCH_FAILED } from "../constants";
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
    createdon: string;
    owninguser: {
        fullname: string;
    };
}

type AdxWebsiteRecords = {
    adx_name: string;
    adx_primarydomainname: string;
    adx_websiteid: string;
    createdon: string;
    owninguser: {
        fullname: string;
    };
}

type AppModule = {
    appmoduleid: string;
    uniquename: string;
}

const getSiteManagementUrl = (orgUrl: string, appId: string, dataModel: WebsiteDataModel, websiteId: string): string => {
    if (!appId) {
        return "";
    }

    const entity = dataModel === WebsiteDataModel.Enhanced ? Constants.EntityNames.MSPP_WEBSITE : Constants.EntityNames.ADX_WEBSITE;
    const url = `${orgUrl.endsWith('/') ? orgUrl : orgUrl.concat('/')}main.aspx?appid=${appId}&pagetype=entityrecord&etn=${entity}&id=${websiteId}`;

    return url;
}

const getPowerPagesManagementAppId = (appModules: AppModule[]): string => {
    const appName = Constants.AppNames.POWER_PAGES_MANAGEMENT;
    const appId = appModules.find(appModule => appModule.uniquename.toLowerCase() === appName)?.appmoduleid;

    return appId ?? "";
}

const getPortalManagementAppId = (appModules: AppModule[]): string => {
    const appName = Constants.AppNames.PORTAL_MANAGEMENT;
    const appId = appModules.find(appModule => appModule.uniquename.toLowerCase() === appName)?.appmoduleid;

    return appId ?? "";
}

export async function getActiveWebsites(serviceEndpointStamp: ServiceEndpointCategory, environmentId: string): Promise<IWebsiteDetails[]> {
    return await PPAPIService.getAllWebsiteDetails(serviceEndpointStamp, environmentId);
}

export async function getAllWebsites(orgDetails: OrgInfo): Promise<IWebsiteDetails[]> {
    const websites: IWebsiteDetails[] = [];
    try {
        const dataverseToken = (await dataverseAuthentication(orgDetails.OrgUrl ?? '', true)).accessToken;

        if (!dataverseToken) {
            throw new Error("Dataverse token is not available.");
        }

        const [adxWebsiteRecords, powerPagesSiteRecords, appModules] = await Promise.all([
            getAdxWebsiteRecords(orgDetails.OrgUrl, dataverseToken),
            getPowerPagesSiteRecords(orgDetails.OrgUrl, dataverseToken),
            getAppModules(orgDetails.OrgUrl, dataverseToken)
        ]);

        const powerPagesManagementAppId = getPowerPagesManagementAppId(appModules);
        const portalManagementAppId = getPortalManagementAppId(appModules);

        adxWebsiteRecords.forEach(adxWebsite => {
            websites.push({
                name: adxWebsite.adx_name,
                websiteUrl: adxWebsite.adx_primarydomainname,
                dataverseInstanceUrl: orgDetails.OrgUrl,
                dataverseOrganizationId: orgDetails.OrgId,
                dataModel: WebsiteDataModel.Standard,
                environmentId: orgDetails.EnvironmentId,
                websiteRecordId: adxWebsite.adx_websiteid,
                siteManagementUrl: getSiteManagementUrl(orgDetails.OrgUrl, portalManagementAppId, WebsiteDataModel.Standard, adxWebsite.adx_websiteid) || '',
                createdOn: adxWebsite.createdon || '',
                creator: adxWebsite.owninguser?.fullname || '',
                siteVisibility: undefined
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
                siteManagementUrl: getSiteManagementUrl(orgDetails.OrgUrl, powerPagesManagementAppId, WebsiteDataModel.Enhanced, powerPagesSite.powerpagesiteid) || '',
                createdOn: powerPagesSite.createdon || '',
                creator: powerPagesSite.owninguser?.fullname || '',
                siteVisibility: undefined
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
        const response = await callApi(dataverseUrl, token);

        if (response.ok) {
            // TODO: perform response format validation
            const data = await response.json() as { value: AdxWebsiteRecords[] };
            return data.value;
        }

        if (response.status !== 404) {
            throw new Error(`Failed to fetch ADX website records. Status: ${response.status}`);
        }
    } catch (error) {
        oneDSLoggerWrapper.getLogger().traceError(ADX_WEBSITE_RECORDS_FETCH_FAILED, ADX_WEBSITE_RECORDS_FETCH_FAILED, error as Error);
    }

    return [];
}

async function getPowerPagesSiteRecords(orgUrl: string, token: string) {
    try {
        const dataverseUrl = `${orgUrl.endsWith('/') ? orgUrl : orgUrl.concat('/')}${POWERPAGES_SITE_RECORDS_API_PATH}`;
        const response = await callApi(dataverseUrl, token);

        if (response.ok) {
            // TODO: perform response format validation
            const data = await response.json() as { value: PowerPagesSiteRecords[] };
            return data.value;
        }

        if (response.status !== 404) {
            throw new Error(`Failed to fetch PowerPages site records. Status: ${response.status}`);
        }
    } catch (error) {
        oneDSLoggerWrapper.getLogger().traceError(POWERPAGES_SITE_RECORDS_FETCH_FAILED, POWERPAGES_SITE_RECORDS_FETCH_FAILED, error as Error);
    }

    return [];
}

async function getAppModules(orgUrl: string, accessToken: string) {
    try {
        const dataverseUrl = `${orgUrl.endsWith('/') ? orgUrl : orgUrl.concat('/')}${APP_MODULES_PATH}`;
        const response = await callApi(dataverseUrl, accessToken);

        if (response.ok) {
            const data = await response.json() as { value: AppModule[] };
            return data.value;
        }

        throw new Error(`Failed to fetch app modules. Status: ${response.status}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        oneDSLoggerWrapper.getLogger().traceError(APP_MODULES_FETCH_FAILED, errorMessage, error as Error);
    }
    return [];
}

async function callApi(url: string, token: string) {
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
