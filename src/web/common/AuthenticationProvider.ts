import * as vscode from 'vscode';


export async function dataverseAuthentication(dataverseOrg: any) {
   let accessToken = '';

   // try  for the Dataverse session.
   try {
       const session = await vscode.authentication.getSession("microsoft", ["https://"+ dataverseOrg + "//.default"], { createIfNone: true });
       console.log(session.accessToken);
       accessToken = session.accessToken;
       console.log('Successfully logged in to dataverse ');
   }catch(e: any) {
       console.log(e.toString());
       vscode.window.showErrorMessage("Authentication to dataverse failed!, Please retry...");
   }
   return accessToken;
}
