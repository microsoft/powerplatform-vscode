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
    User: string;
    CloudInstance: string;
    ActiveOrganization?: {
        FriendlyName: string;
        EnvironmentUrl: string;
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

export type PacOrgWhoOutput = PacOutputWithResult<ActiveOrgOutput>;
