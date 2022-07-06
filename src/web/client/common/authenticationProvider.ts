/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as vscode from 'vscode';


export async function dataverseAuthentication(dataverseOrg: any) {
   let accessToken = '';
   try {
       const session = await vscode.authentication.getSession("microsoft", ["https://"+ dataverseOrg + "//.default"], { createIfNone: true });
       accessToken = session.accessToken;
   }catch(e: any) {
       vscode.window.showErrorMessage("Authentication to dataverse failed!, Please retry...");
   }
   return accessToken;
}
