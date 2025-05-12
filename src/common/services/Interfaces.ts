/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { SiteVisibility } from "../../client/power-pages/actions-hub/models/SiteVisibility";
import { ServiceEndpointCategory, WebsiteApplicationType, WebsiteDataModel } from "./Constants";

export interface IArtemisServiceEndpointInformation {
    stamp: ServiceEndpointCategory;
    endpoint: string;
}

export interface IArtemisServiceResponse {
    stamp: ServiceEndpointCategory;
    response: IArtemisAPIOrgResponse;
}

export interface IArtemisAPIOrgResponse {
    geoName: string,
    environment: string,
    clusterNumber: string,
    geoLongName: string,
    clusterCategory: string,
    clusterName: string,
    clusterType: string,
}

export interface IIntelligenceAPIEndpointInformation {
    intelligenceEndpoint: string | null,
    geoName: string | null,
    crossGeoDataMovementEnabledPPACFlag: boolean,
    endpointStamp?: ServiceEndpointCategory,
}

export interface IWebsiteDetails {
    name: string;
    websiteUrl: string;
    dataverseInstanceUrl: string;
    dataverseOrganizationId: string;
    dataModel: WebsiteDataModel;
    environmentId: string;
    id?: string;
    siteVisibility: SiteVisibility | undefined;
    tenantId?: string;
    websiteRecordId: string;
    type?: WebsiteApplicationType;
    siteManagementUrl: string;
    creator: string;
    createdOn: string;
    isCodeSite: boolean;
}

export interface IOtherSiteInfo {
    name: string;
    websiteId: string;
    folderPath: string;
    isCodeSite: boolean;
}

export interface WebsiteYaml {
    adx_defaultbotconsumerid?: string;
    adx_defaultlanguage?: string;
    adx_footerwebtemplateid?: string;
    adx_headerwebtemplateid?: string;
    adx_name?: string;
    adx_statecode?: number;
    adx_statuscode?: number;
    adx_website_language?: number | string;
    adx_websiteid?: string;
}
