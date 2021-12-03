// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export type PacOutput = {
    Status: string;
    Errors: string[];
    Information: string[];
}

export type AuthProfileListing = {
    Index: number;
    IsActive: boolean;
    Kind: string;
    Name: string;
    Resource: string;
    User: string;
    CloudInstance: string;
}

export type PacOutputWithResultList<T> = PacOutput & {
    Results: T[]
}

export type PacAuthListOutput = PacOutput & {
    Results: AuthProfileListing[];
}

export type AdminEnvironmentListing = {
    DisplayName: string;
    EnvironmentId: string;
    EnvironmentUrl: string;
    Type: string;
    OrganizationId: string;
}

export type PacAdminListOutput = PacOutput & {
    Results: AdminEnvironmentListing[];
}

export type SolutionListing = {
    SolutionUniqueName: string;
    FriendlyName: string;
    VersionNumber: string;
}

export type PacSolutionListOutput = PacOutput & {
    Results: SolutionListing[];
}

export type OrgListOutput = {
    FriendlyName: string,
    OrganizationId: string,
    EnvironmentId: string,
    EnvironmentUrl: string
}

export type PacOrgListOutput = PacOutput & {
    Results: OrgListOutput[];
}
