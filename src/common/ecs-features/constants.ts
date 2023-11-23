/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


export const ECS_REQUEST_URL_TEMPLATE = "https://ecs.office.com/config/v1/PortalsMakerExperiences/1.0.0.0?AppName=powerpages-microsoft-com&EnvironmentID=${EnvironmentId}&UserID=${UserId}&TenantID=${TenantId}&region={Region}";
export const ONE_MINUTE = 60 * 1000;

export const ClientName = 'PortalsMakerExperiences'; // Project name in ECS Portal, Do not change this
export type ProjectTeam = typeof ClientName;
export const VisualStudioCodeDevInsidersUrl = 'https://insiders.vscode.dev/powerplatform/portal'; // VScode dev insiders/pre-prod env
export const VisualStudioCodeDevUrl = 'https://vscode.dev/powerplatform/portal'; // VScode dev GA/prod env
