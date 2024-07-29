/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { PacWrapper } from "../../../client/pac/PacWrapper";
import { ECSFeaturesClient } from "../../ecs-features/ecsFeatureClient";
import { CopilotDisableList, EnableProDevCopilot } from "../../ecs-features/ecsFeatureGates";
import { AUTH_CREATE_FAILED, AUTH_CREATE_MESSAGE } from "../constants";
import { showInputBoxAndGetOrgUrl, showProgressWithNotification } from "../../utilities/Utils";
import { SUCCESS } from "../../constants";
import { Localization, localizations } from "../assets/locales/copilotLocales";

export async function createAuthProfileExp(pacWrapper: PacWrapper | undefined) {
    const userOrgUrl = await showInputBoxAndGetOrgUrl();
    if (!userOrgUrl) {
        return;
    }

    if (!pacWrapper) {
        vscode.window.showErrorMessage(AUTH_CREATE_FAILED);
        return;
    }

    const pacAuthCreateOutput = await showProgressWithNotification(vscode.l10n.t(AUTH_CREATE_MESSAGE), async () => { return await pacWrapper?.authCreateNewAuthProfileForOrg(userOrgUrl) });
    if (pacAuthCreateOutput && pacAuthCreateOutput.Status !== SUCCESS) {
        vscode.window.showErrorMessage(AUTH_CREATE_FAILED);
        return;
    }
}

export function getDisabledOrgList() {
    const disallowedProDevCopilotOrgs = ECSFeaturesClient.getConfig(CopilotDisableList).disallowedProDevCopilotOrgs;

    if (disallowedProDevCopilotOrgs === undefined || disallowedProDevCopilotOrgs === "") {
        return [];
    }

    return disallowedProDevCopilotOrgs.split(',').map(org => org.trim());
}

export function getDisabledTenantList() {

    const disallowedProDevCopilotTenants = ECSFeaturesClient.getConfig(CopilotDisableList).disallowedProDevCopilotOrgs;

    if (disallowedProDevCopilotTenants === undefined || disallowedProDevCopilotTenants === "") {
        return [];
    }

    return disallowedProDevCopilotTenants.split(',').map(org => org.trim());
}

export function isCopilotSupportedInGeo() {
    const supportedGeoList = ECSFeaturesClient.getConfig(EnableProDevCopilot).capiSupportedProDevCopilotGeoList;

    if (supportedGeoList === undefined || supportedGeoList === "") {
        return [];
    }

    return supportedGeoList.split(',').map(org => org.trim());
}

export function isCopilotDisabledInGeo() {
    const disabledGeoList = ECSFeaturesClient.getConfig(EnableProDevCopilot).unsupportedProDevCopilotGeoList;

    if (disabledGeoList === undefined || disabledGeoList === "") {
        return [];
    }

    return disabledGeoList.split(',').map(org => org.trim());
}

export function enableCrossGeoDataFlowInGeo() {
    const enableCrossGeoDataFlowInGeo = ECSFeaturesClient.getConfig(EnableProDevCopilot).capiSupportedProDevCopilotGeoWithCrossGeoDataFlow;

    if (enableCrossGeoDataFlowInGeo === undefined || enableCrossGeoDataFlowInGeo === "") {
        return [];
    }

    return enableCrossGeoDataFlowInGeo.split(',').map(org => org.trim());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getTranslatedCopilotResponse(responseMessage: any, promptLanguage: string): Promise<any> {
    // Translate the response message
  const localization = loadLocalization(promptLanguage);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return responseMessage.map((item: any) => localizeObject(item, localization));

}

const loadLocalization = (language: string): Localization => {
    return localizations[language] || localizations['en'];
};

const localizeString = (str: string, localization: Localization): string => {
    for (const key in localization) {
        const regex = new RegExp(key, 'g');
        console.log(`Regex: ${regex}, Replacement: ${localization[key]}`); // Remove console.log

        str = str.replace(regex, localization[key]);
        console.log(`Updated string: ${str}`); // Remove console.log
    }
    return str;
};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const localizeObject = (obj: any, localization: Localization): any => {
    if (typeof obj === 'string') {
      return localizeString(obj, localization);
    } else if (Array.isArray(obj)) {
      return obj.map(item => localizeObject(item, localization));
    } else if (typeof obj === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newObj: any = {};
      for (const key in obj) {
        newObj[key] = localizeObject(obj[key], localization);
      }
      return newObj;
    }
    return obj;
  };

