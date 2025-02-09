/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ActionsHubTreeItem } from "./tree-items/ActionsHubTreeItem";
import { OtherSitesGroupTreeItem } from "./tree-items/OtherSitesGroupTreeItem";
import { Constants } from "./Constants";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { EnvironmentGroupTreeItem } from "./tree-items/EnvironmentGroupTreeItem";
import { IEnvironmentInfo } from "./models/IEnvironmentInfo";
import { pacAuthManager } from "../../pac/PacAuthManager";
import { IArtemisServiceResponse, IWebsiteDetails } from "../../../common/services/Interfaces";
import { ActiveOrgOutput } from "../../pac/PacTypes";
import { getActiveWebsites, getAllWebsites } from "../../../common/utilities/WebsiteUtil";

export class ActionsHubTreeDataProvider implements vscode.TreeDataProvider<ActionsHubTreeItem> {
    private readonly _disposables: vscode.Disposable[] = [];
    private readonly _context: vscode.ExtensionContext;
    private readonly _artemisResponse: IArtemisServiceResponse | null;
    private readonly _orgDetails: ActiveOrgOutput;

    private constructor(context: vscode.ExtensionContext, artemisResponse: IArtemisServiceResponse | null, orgDetails: ActiveOrgOutput) {
        this._disposables.push(
            vscode.window.registerTreeDataProvider("powerpages.actionsHub", this)
        );

        this._context = context;
        this._artemisResponse = artemisResponse;
        this._orgDetails = orgDetails;
    }

    public static initialize(context: vscode.ExtensionContext, artemisResponse: IArtemisServiceResponse | null, orgDetails: ActiveOrgOutput): ActionsHubTreeDataProvider {
        const actionsHubTreeDataProvider = new ActionsHubTreeDataProvider(context, artemisResponse, orgDetails);
        oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_INITIALIZED);

        return actionsHubTreeDataProvider;
    }

    getTreeItem(element: ActionsHubTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: ActionsHubTreeItem): Promise<ActionsHubTreeItem[] | null | undefined> {
        if (!element) {
            try {

                const orgFriendlyName = Constants.Strings.NO_ENVIRONMENTS_FOUND; // Login experience scenario
                let currentEnvInfo: IEnvironmentInfo = { currentEnvironmentName: orgFriendlyName };
                const authInfo = pacAuthManager.getAuthInfo();
                if (authInfo) {
                    currentEnvInfo = { currentEnvironmentName: authInfo.organizationFriendlyName };
                }
                
                let activeSites: IWebsiteDetails[] = [];
                let inactiveSites: IWebsiteDetails[] = [];
                
                if (this._artemisResponse?.stamp) {
                    activeSites = await getActiveWebsites(this._artemisResponse?.stamp, this._orgDetails.EnvironmentId) || []; //Need to handle failure case
                    const allSites = await getAllWebsites(this._orgDetails);
                    const activeSiteIds = new Set(activeSites.map(activeSite => activeSite.websiteRecordId));
                    inactiveSites = allSites?.filter(site => !activeSiteIds.has(site.websiteRecordId)) || []; //Need to handle failure case
                }
                else {
                    //TODO: Handle the case when artemis response is not available
                    // Log the scenario
                    // Question: Should we show any message to the user? or just show the empty list of sites
                }

                //TODO: Handle the case when the user is not logged in

                return [
                    new EnvironmentGroupTreeItem(currentEnvInfo, this._context, activeSites, inactiveSites),
                    new OtherSitesGroupTreeItem()
                ];
            } catch (error) {
                oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.ACTIONS_HUB_CURRENT_ENV_FETCH_FAILED, error as string, error as Error, { methodName: this.getChildren }, {});
                return null;
            }
        } else {
            return element.getChildren();
        }
    }

    public dispose(): void {
        this._disposables.forEach(d => d.dispose());
    }
}
