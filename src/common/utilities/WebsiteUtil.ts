/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { OrgInfo } from "../../client/pac/PacTypes";
import { Constants } from "../../client/power-pages/actions-hub/Constants";
import { ADX_WEBSITE_RECORDS_API_PATH, ADX_WEBSITE_RECORDS_FETCH_FAILED, GET_ALL_WEBSITES_FAILED, POWERPAGES_SITE_RECORDS_FETCH_FAILED, POWERPAGES_SITE_RECORDS_API_PATH, APP_MODULES_PATH, APP_MODULES_FETCH_FAILED, POWERPAGES_SITE_RECORDS_CONTENT_PARSE_FAILED, POWERPAGES_SITE_SETTINGS_API_PATH, POWERPAGES_SITE_SETTINGS_FETCH_FAILED, CODE_SITE_SETTING_NAME } from "../constants";
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
    content?: string;
}

type PowerPagesSiteSettings = {
    mspp_name: string;
    mspp_value: string;
    _mspp_websiteid_value: string;
    statecode: number;
    statuscode: number;
}


type AdxWebsiteRecords = {
    adx_name: string;
    adx_primarydomainname: string;
    adx_websiteid: string;
    createdon: string;
    owninguser: {
        fullname: string;
    };
    adx_website_language: string;
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

        const [adxWebsiteRecords, powerPagesSiteRecords, appModules, powerPagesSiteSettings] = await Promise.all([
            getAdxWebsiteRecords(orgDetails.OrgUrl, dataverseToken),
            getPowerPagesSiteRecords(orgDetails.OrgUrl, dataverseToken),
            getAppModules(orgDetails.OrgUrl, dataverseToken),
            getAllPowerPagesSiteSettings(orgDetails.OrgUrl, dataverseToken)
        ]);

        const powerPagesManagementAppId = getPowerPagesManagementAppId(appModules);
        const portalManagementAppId = getPortalManagementAppId(appModules);
        const codeSites = getWebsitesWithCodeSiteEnabled(powerPagesSiteSettings);

        adxWebsiteRecords.forEach(adxWebsite => {
            websites.push({
                name: adxWebsite.adx_name,
                websiteUrl: adxWebsite.adx_primarydomainname,
                dataverseInstanceUrl: orgDetails.OrgUrl,
                dataverseOrganizationId: orgDetails.OrgId,
                dataModel: WebsiteDataModel.Standard,
                environmentId: orgDetails.EnvironmentId,
                websiteRecordId: adxWebsite.adx_websiteid,
                siteManagementUrl: getSiteManagementUrl(orgDetails.OrgUrl, portalManagementAppId, WebsiteDataModel.Standard, adxWebsite.adx_websiteid),
                languageCode: adxWebsite.adx_website_language || '',
                createdOn: adxWebsite.createdon || '',
                creator: adxWebsite.owninguser?.fullname || '',
                siteVisibility: undefined,
                isCodeSite: false
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
                siteManagementUrl: getSiteManagementUrl(orgDetails.OrgUrl, powerPagesManagementAppId, WebsiteDataModel.Enhanced, powerPagesSite.powerpagesiteid),
                languageCode: powerPagesSite.website_language ?? "1033",
                createdOn: powerPagesSite.createdon || '',
                creator: powerPagesSite.owninguser?.fullname || '',
                siteVisibility: undefined,
                isCodeSite: codeSites.has(powerPagesSite.powerpagesiteid)
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
            const data = await response.json() as { value: PowerPagesSiteRecords[] };

            // Extract website_language from the content field if it exists
            return (data?.value ?? []).map(record => {
                let websiteLanguage = null;

                if (record.content) {
                    try {
                        const contentJson = JSON.parse(record.content);
                        websiteLanguage = contentJson.website_language || null;
                    } catch (error) {
                        oneDSLoggerWrapper.getLogger().traceError(
                            POWERPAGES_SITE_RECORDS_CONTENT_PARSE_FAILED,
                            `Failed to parse content field for record ${record.powerpagesiteid}`,
                            error as Error
                        );
                    }
                }

                return {
                    ...record,
                    website_language: websiteLanguage
                };
            });
        }

        if (response.status !== 404) {
            throw new Error(`Failed to fetch PowerPages site records. Status: ${response.status}`);
        }
    } catch (error) {
        oneDSLoggerWrapper.getLogger().traceError(POWERPAGES_SITE_RECORDS_FETCH_FAILED, POWERPAGES_SITE_RECORDS_FETCH_FAILED, error as Error);
    }

    return [];
}

const getWebsitesWithCodeSiteEnabled = (siteSettings: PowerPagesSiteSettings[]): Set<string> =>
    new Set(siteSettings
        .filter(setting => setting.mspp_name === CODE_SITE_SETTING_NAME
            && setting.mspp_value.toLowerCase() === "true"
            && setting.statecode === 0
            && setting.statuscode === 1)
        .map(setting => setting._mspp_websiteid_value));

async function getAllPowerPagesSiteSettings(orgUrl: string, token: string) {
    try {
        const dataverseUrl = `${orgUrl.endsWith('/') ? orgUrl : orgUrl.concat('/')}${POWERPAGES_SITE_SETTINGS_API_PATH}`;
        const response = await callApi(dataverseUrl, token);

        if (response.ok) {
            const data = await response.json() as { value: PowerPagesSiteSettings[] };
            return data.value;
        }
    } catch (error) {
        oneDSLoggerWrapper.getLogger().traceError(POWERPAGES_SITE_SETTINGS_FETCH_FAILED, POWERPAGES_SITE_SETTINGS_FETCH_FAILED, error as Error);
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
