/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import WebExtensionContext from "../WebExtensionContext";
import { IEntityInfo } from "../common/interfaces";
import * as Constants from "../common/constants";

export function sendingMessageToWebWorkerForCoPresence(entityInfo: IEntityInfo) {
    if (WebExtensionContext.worker !== undefined) {
        WebExtensionContext.worker.postMessage({
            afrConfig: {
                swpId: WebExtensionContext.sharedWorkSpaceMap.get(
                    Constants.sharedWorkspaceParameters.SHAREWORKSPACE_ID
                ) as string,
                swptenantId: WebExtensionContext.sharedWorkSpaceMap.get(
                    Constants.sharedWorkspaceParameters.TENANT_ID
                ) as string,
                discoveryendpoint: WebExtensionContext.sharedWorkSpaceMap.get(
                    Constants.sharedWorkspaceParameters.DISCOVERY_ENDPOINT
                ) as string,
                swpAccessToken: WebExtensionContext.sharedWorkSpaceMap.get(
                    Constants.sharedWorkspaceParameters.ACCESS_TOKEN
                ) as string,
            },
            entityInfo
        });
    }
}
