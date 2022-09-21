/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { dataverseAuthentication, getCustomRequestURL, getHeader } from "./authenticationProvider";
import { MULTI_ENTITY_URL_KEY, ORG_URL, pathParamToSchema, PORTALS_URI_SCHEME, PORTAL_LANGUAGES, PORTAL_LANGUAGE_DEFAULT, telemetryEventNames, WEBSITES, WEBSITE_LANGUAGES, WEBSITE_NAME } from "./constants";
import { getDataSourcePropertiesMap, getEntitiesFolderNameMap, getEntitiesSchemaMap } from "./portalSchemaReader";
import { showErrorDialog } from "./errorHandler";
import * as nls from 'vscode-nls';
import { sendErrorTelemetry } from "../telemetry/webExtensionTelemetry";
import { SaveEntityDetails } from "./portalSchemaInterface";
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export interface IPowerPlatformExtensionContext {
    dataSourcePropertiesMap: Map<string, string>; // dataSourceProperties in portal_schema_data
    entitiesSchemaMap: Map<string, Map<string, string>>;
    queryParamsMap: Map<string, string>;
    languageIdCodeMap: Map<string, string>;
    websiteLanguageIdToPortalLanguageMap: Map<string, string>;
    websiteIdToLanguage: Map<string, string>;
    entitiesFolderNameMap: Map<string, string> // FolderName for entity, schemaEntityName
    dataverseAccessToken: string;
    entityId: string;
    entity: string;
    rootDirectory: vscode.Uri;
    saveDataMap: Map<string, SaveEntityDetails>
}

class PowerPlatformExtensionContextManager {
    private entitiesSchemaMap = getEntitiesSchemaMap();
    private dataSourcePropertiesMap = getDataSourcePropertiesMap();
    private entitiesFolderNameMap = getEntitiesFolderNameMap(this.entitiesSchemaMap);

    private PowerPlatformExtensionContext: IPowerPlatformExtensionContext = {
        dataSourcePropertiesMap: this.dataSourcePropertiesMap,
        entitiesSchemaMap: this.entitiesSchemaMap,
        languageIdCodeMap: new Map<string, string>(),
        websiteLanguageIdToPortalLanguageMap: new Map<string, string>(),
        websiteIdToLanguage: new Map<string, string>(),
        queryParamsMap: new Map<string, string>(),
        entitiesFolderNameMap: this.entitiesFolderNameMap,
        entity: '',
        entityId: '',
        dataverseAccessToken: '',
        rootDirectory: vscode.Uri.parse(''),
        saveDataMap: new Map<string, SaveEntityDetails>()
    };

    public getPowerPlatformExtensionContext() {
        console.log("powerpagedebug getPowerPlatformExtensionContext", this.PowerPlatformExtensionContext.entitiesFolderNameMap.size);
        return this.PowerPlatformExtensionContext;
    }

    public async setPowerPlatformExtensionContext(pseudoEntityName: string, entityId: string, queryParamsMap: Map<string, string>) {
        this.PowerPlatformExtensionContext = {
            ...this.PowerPlatformExtensionContext,
            entity: pathParamToSchema.get(pseudoEntityName) as string,
            entityId: entityId,
            queryParamsMap: queryParamsMap,
            rootDirectory: vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/${queryParamsMap.get(WEBSITE_NAME) as string}/`, true)
        };
    }

    public async authenticateAndUpdateDataverseProperties() {
        const dataverseOrgUrl = this.PowerPlatformExtensionContext.queryParamsMap.get(ORG_URL) as string;
        const accessToken: string = await dataverseAuthentication(dataverseOrgUrl);
        if (!accessToken) {
            {
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.init.error", "There was a problem opening the workspace"), localize("microsoft-powerapps-portals.webExtension.init.error.desc", "Try refreshing the browser"));
                sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_NO_ACCESS_TOKEN);
                return;
            }
        }
        console.log("authenticateAndUpdateDataverseProperties got token");
        console.log("powerpagedebug authenticateAndUpdateDataverseProperties:", dataverseOrgUrl);
        this.PowerPlatformExtensionContext = {
            ... this.PowerPlatformExtensionContext,
            websiteIdToLanguage: await this.websiteIdToLanguageMap(accessToken, dataverseOrgUrl),
            websiteLanguageIdToPortalLanguageMap: await this.websiteLanguageIdToPortalLanguage(accessToken, dataverseOrgUrl),
            languageIdCodeMap: await this.languageIdToCode(accessToken, dataverseOrgUrl),
            dataverseAccessToken: accessToken,
        };
        console.log("powerpagedebug authenticateAndUpdateDataverseProperties:",
            this.PowerPlatformExtensionContext.websiteIdToLanguage.size,
            this.PowerPlatformExtensionContext.websiteLanguageIdToPortalLanguageMap.size,
            this.PowerPlatformExtensionContext.languageIdCodeMap.size);
    }

    public async updatSaveDataDetailsInContext(dataMap: Map<string, SaveEntityDetails>) {
        this.PowerPlatformExtensionContext = {
            ...this.PowerPlatformExtensionContext,
            saveDataMap: dataMap
        };
    }


    private async languageIdToCode(accessToken: string, dataverseOrgUrl: string): Promise<Map<string, string>> {
        const languageIdCodeMap = new Map<string, string>();
        try {
            const requestUrl = getCustomRequestURL(dataverseOrgUrl, PORTAL_LANGUAGES, MULTI_ENTITY_URL_KEY);
            const response = await fetch(requestUrl, {
                headers: getHeader(accessToken),
            });
            if (!response.ok) {
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.backend.error", "There’s a problem on the back end"), localize("microsoft-powerapps-portals.webExtension.backend.desc", "Try again"));
            }
            const result = await response.json();
            if (result) {
                if (result.value?.length > 0) {
                    for (let counter = 0; counter < result.value.length; counter++) {
                        const adx_lcid = result.value[counter].adx_lcid ? result.value[counter].adx_lcid : PORTAL_LANGUAGE_DEFAULT;
                        const adx_languagecode = result.value[counter].adx_languagecode;
                        languageIdCodeMap.set(adx_lcid, adx_languagecode);
                    }
                }
            }
        } catch (error) {
            if (typeof error === "string" && error.includes("Unauthorized")) {
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.unauthorized.error", "Authorization Failed. Please run again to authorize it"), localize("microsoft-powerapps-portals.webExtension.unauthorized.desc", "There was a permissions problem with the server"));
            }
            else {
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.parameter.error", "One or more commands are invalid or malformed"), localize("microsoft-powerapps-portals.webExtension.parameter.desc", "Check the parameters and try again"));
            }
        }
        return languageIdCodeMap;
    }

    private async websiteLanguageIdToPortalLanguage(accessToken: string, dataverseOrgUrl: string): Promise<Map<string, string>> {
        const websiteLanguageIdToPortalLanguageMap = new Map<string, string>();
        try {
            const requestUrl = getCustomRequestURL(dataverseOrgUrl, WEBSITE_LANGUAGES, MULTI_ENTITY_URL_KEY);
            const response = await fetch(requestUrl, {
                headers: getHeader(accessToken),
            });
            if (!response.ok) {
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.backend.error", "One or more commands are invalid or malformed"), localize("microsoft-powerapps-portals.webExtension.backend.desc", "Check the parameters and try again"));
            }
            const result = await response.json();
            if (result) {
                if (result.value?.length > 0) {
                    for (let counter = 0; counter < result.value.length; counter++) {
                        const adx_portalLanguageId_value = result.value[counter].adx_portallanguageid_value ? result.value[counter].adx_portallanguageid_value : PORTAL_LANGUAGE_DEFAULT;
                        const adx_websitelanguageid = result.value[counter].adx_websitelanguageid;
                        websiteLanguageIdToPortalLanguageMap.set(adx_websitelanguageid, adx_portalLanguageId_value);
                    }
                }
            }
        } catch (error) {
            if (typeof error === "string" && error.includes("Unauthorized")) {
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.unauthorized.error", "Authorization Failed. Please run again to authorize it"), localize("microsoft-powerapps-portals.webExtension.unauthorized.desc", "There was a permissions problem with the server"));
            }
            else {
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.parameter.error", "One or more commands are invalid or malformed"), localize("microsoft-powerapps-portals.webExtension.parameter.desc", "Check the parameters and try again"));
            }
        }
        return websiteLanguageIdToPortalLanguageMap;
    }

    private async websiteIdToLanguageMap(accessToken: string, dataverseOrgUrl: string): Promise<Map<string, string>> {
        const websiteIdToLanguage = new Map<string, string>();
        try {
            const requestUrl = getCustomRequestURL(dataverseOrgUrl, WEBSITES, MULTI_ENTITY_URL_KEY);
            const response = await fetch(requestUrl, {
                headers: getHeader(accessToken),
            });

            if (!response.ok) {
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.backend.error", "One or more commands are invalid or malformed"), localize("microsoft-powerapps-portals.webExtension.backend.desc", "Check the parameters and try again"));
            }
            const result = await response.json();

            if (result) {
                if (result.value?.length > 0) {
                    for (let counter = 0; counter < result.value.length; counter++) {
                        const adx_websiteId = result.value[counter].adx_websiteid ? result.value[counter].adx_websiteid : null;
                        const adx_website_language = result.value[counter].adx_website_language;
                        websiteIdToLanguage.set(adx_websiteId, adx_website_language);
                    }
                }
            }

        } catch (error) {
            if (typeof error === "string" && error.includes("Unauthorized")) {
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.unauthorized.error", "Authorization Failed. Please run again to authorize it"), localize("microsoft-powerapps-portals.webExtension.unauthorized.desc", "There was a permissions problem with the server"));
            }
            else {
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.parameter.error", "One or more commands are invalid or malformed"), localize("microsoft-powerapps-portals.webExtension.parameter.desc", "Check the parameters and try again"));
            }
        }
        return websiteIdToLanguage;
    }
}

export default new PowerPlatformExtensionContextManager();
