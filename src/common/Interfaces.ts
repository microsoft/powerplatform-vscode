/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { BAPServiceStamp } from "./constants";

export interface IArtemisServiceEndpointInformation {
    stamp: BAPServiceStamp;
    endpoint: string;
}

export interface IArtemisServiceResponse {
    stamp: BAPServiceStamp;
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
