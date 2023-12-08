/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export interface IFeedbackData {
    TenantId: string;
    Geo: string;
    IsDismissed: boolean;
    ProductContext: { key: string, value: string }[];
    Feedbacks: { key: string, value: string }[];
}

export interface IActiveFileParams {
    dataverseEntity: string;
    entityField: string;
    fieldType: string;
}

export interface IActiveFileData {
    activeFileParams: IActiveFileParams;
    activeFileContent: string
}

export interface IOrgInfo {
    orgId: string;
    environmentName: string;
    activeOrgUrl: string;
    tenantId?: string;
}
