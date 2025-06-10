/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export type PacOutput = {
    Status: string;
    Errors: string[];
    Information: string[];
}

export type PacOutputWithResult<TResults> = PacOutput & {
    Results: TResults
}

export type PacOutputWithResultList<TListItem> = PacOutput & {
    Results: TListItem[]
}

export type AuthProfileListing = {
    Index: number;
    IsActive: boolean;
    Kind: string;
    Name: string;
    UserDisplayName: string;
    CloudInstance: string;
    ActiveOrganization?: { // Three item tuple, not serialized with item names
        Item1: string;  // Friendly Name
        Item2: string;  // Environment URL
        Item3?: string; // Environment ID
    };
}

export type PacAuthListOutput = PacOutputWithResultList<AuthProfileListing>;

export type AdminEnvironmentListing = {
    DisplayName: string;
    EnvironmentId: string;
    EnvironmentUrl: string;
    Type: string;
    OrganizationId: string;
}

export type PacAdminListOutput = PacOutputWithResultList<AdminEnvironmentListing>;

export type SolutionListing = {
    SolutionUniqueName: string;
    FriendlyName: string;
    VersionNumber: string;
    IsManaged: boolean;
}

export type PacSolutionListOutput = PacOutputWithResultList<SolutionListing>;

export type OrgListOutput = {
    FriendlyName: string,
    OrganizationId: string,
    EnvironmentId: string,
    EnvironmentUrl: string,
    IsActive: boolean
}

export type PacOrgListOutput = PacOutputWithResultList<OrgListOutput>;

export type ActiveOrgOutput = {
    OrgId: string,
    UniqueName: string,
    FriendlyName: string,
    OrgUrl: string,
    UserEmail: string,
    UserId : string,
    EnvironmentId: string,
}

export type WebsiteListOutput = PacOutput & {
    Results: WebsiteListing[];
}

export type WebsiteListing = {
    WebsiteId: string;
    FriendlyName: string;
    ModelVersion: number;
}


export type PacOrgWhoOutput = PacOutputWithResult<ActiveOrgOutput>;


