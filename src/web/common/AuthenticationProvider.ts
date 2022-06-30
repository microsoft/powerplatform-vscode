import * as vscode from 'vscode';

export function getHeader(accessToken: string) {
    return {
        authorization: "Bearer " + accessToken,
        'content-type': "application/json; charset=utf-8",
       accept: "application/json",
       'OData-MaxVersion': "4.0",
       'OData-Version': "4.0",
   };
}

export function getRequestUrl(method: string, dataverseOrg: string, api: string, data: string, version: string, entity: string, entityId: string, schemamap: any) {
   let requestUrl = `https://${dataverseOrg}/${api}/${data}/${version}/${entity}(${entityId})`;
   switch (method) {
       case 'GET':
           requestUrl = requestUrl + schemamap['entity']['query'];
           break;
       default:
           break;
   }
   return requestUrl;
}

export async function dataverseAuthentication(dataverseOrg: any) {
   let accessToken = '';
   try {
       const session = await vscode.authentication.getSession("microsoft", ["https://"+ dataverseOrg + "//.default"], { createIfNone: true });
       console.log(session.accessToken);
       accessToken = session.accessToken;
   }catch(e: any) {
       console.log(e.toString());
   }
   return accessToken;
}
