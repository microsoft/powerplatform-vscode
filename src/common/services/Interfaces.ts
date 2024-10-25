/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ServiceEndpointCategory, WebsiteApplicationType } from "./Constants";

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

export interface IArtemisServiceResponse {
    stamp: ServiceEndpointCategory;
    response: IArtemisAPIOrgResponse;
}

export interface IIntelligenceAPIEndpointInformation {
    intelligenceEndpoint: string | null,
    geoName: string | null,
    crossGeoDataMovementEnabledPPACFlag: boolean
}

export interface IWebsiteDetails {
    websiteUrl: string;
    dataverseInstanceUrl: string;
    dataverseOrganizationId: string;
    environmentId: string;
    id: string;
    siteVisibility: string;
    tenantId: string;
    websiteRecordId: string;
    type: WebsiteApplicationType;
}
