/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { PacWrapper } from "../../client/pac/PacWrapper";
import { SUCCESS } from "../constants";
import { AUTH_CREATE_FAILED, AUTH_CREATE_MESSAGE } from "../copilot/constants";
import { showInputBoxAndGetOrgUrl, showProgressWithNotification } from "./Utils";


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

     return pacAuthCreateOutput;
 }
