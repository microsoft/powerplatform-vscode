/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

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
    Name: string;
    WebsiteUrl: string;
    DataverseInstanceUrl: string;
    DataverseOrganizationId: string;
    DataModel: WebsiteDataModel;
    EnvironmentId: string;
    Id?: string;
    SiteVisibility?: string;
    TenantId?: string;
    WebsiteRecordId: string;
    Type?: WebsiteApplicationType;
}
