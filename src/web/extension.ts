'use strict';

import * as vscode from 'vscode';
import { PortalsFS } from './fileSystemProvider';

const portalsFolderName = 'StarterPortal';
const portalsUriScheme = 'portals';
const portalsWorkspaceName = 'Power Portals';
let fileName = '';


export function activate(context: vscode.ExtensionContext): void {

    console.log('Hello from - Portals WebExtension');

    const portalsFS = new PortalsFS();
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider(portalsUriScheme, portalsFS, { isCaseSensitive: true }));
    let initialized = false;
    let accessToken = '';

    // const messageProtocol = context.messagePassingProtocol;

    // if (messageProtocol) {
    //     vscode.window.showInformationMessage("Received Port from Portal Studio!");
    // }

    // messageProtocol?.onDidReceiveMessage(() => {
    //     vscode.window.showInformationMessage("received message from Studio!!!");
    // });

    context.subscriptions.push(vscode.commands.registerCommand('portals.init', async (args: any) => {
        if (initialized) {
            return;
        }
        initialized = true;

        if (!args) {
            return;
        }

        const { dataverseOrg, api, data, version, entity, entityId } = args;

        vscode.window.showInformationMessage('editing '+ entity);

        // uncomment this after pre-authorization of VSCode firstPartyApp(aebc6443-996d-45c2-90f0-388ff96faa56) in Dataverse
        // try {
        //     const session = await vscode.authentication.getSession("microsoft", ["https://org2e2e9cae.crm.dynamics.com" + "/.default"], { createIfNone: true });
        //     console.log(session.accessToken);
        // }catch(e: any) {
        //     console.log(e.toString());
        // }

        // Prompt for the Access Token.
        const token = await vscode.window.showInputBox({
            ignoreFocusOut: true,
            placeHolder: 'Portal/Dataverse access token',
            prompt: 'Enter a Portal/Dataverse access token.'
        });
        if (!token) {
            throw new Error('AccessToken is required');
        }
        accessToken = token;

        // some more files & folders
        vscode.window.showInformationMessage('creating portals folder');
        portalsFS.createDirectory(vscode.Uri.parse(`${portalsUriScheme}:/${portalsFolderName}/`, true));

        // Do something before delay
        vscode.window.showInformationMessage('fetching portal data...');

        let adxCopy = '';
        let adxCustomJavascript = '';
        let adxCustomCss = '';
        let adxSource = '';

        try {
            const requestUrl = getRequestUrl('GET', dataverseOrg, api, data, version, entity, entityId);
            vscode.window.showInformationMessage(requestUrl);
            const req = await fetch(requestUrl, {
                headers: getHeader(accessToken),
            });
            if (!req.ok) {
                throw new Error(req.statusText);
            }
            const res = await req.json();
            console.log(res);
            if (res) {
                fileName = res['adx_name'] ? res['adx_name'] : '';
                adxCopy = res['adx_copy'] ? res['adx_copy'] : '';
                adxCustomJavascript = res['adx_customjavascript'] ? res['adx_customjavascript'] : '';
                adxCustomCss = res['adx_customcss'] ? res['adx_customcss'] : '';
                adxSource = res['adx_source'] ? res['adx_source'] : '';
            }
            if (entity === 'adx_webpages') {
                portalsFS.writeFile(vscode.Uri.parse(`${portalsUriScheme}:/${portalsFolderName}/${fileName}.css`), new TextEncoder().encode(adxCustomCss), { create: true, overwrite: true });
                portalsFS.writeFile(vscode.Uri.parse(`${portalsUriScheme}:/${portalsFolderName}/${fileName}.js`), new TextEncoder().encode(adxCustomJavascript), { create: true, overwrite: true });
                portalsFS.writeFile(vscode.Uri.parse(`${portalsUriScheme}:/${portalsFolderName}/${fileName}.html`), new TextEncoder().encode(adxCopy), { create: true, overwrite: true });
            } else if (entity === 'adx_webtemplates') {
                portalsFS.writeFile(vscode.Uri.parse(`${portalsUriScheme}:/${portalsFolderName}/${fileName}.html`), new TextEncoder().encode(adxSource), { create: true, overwrite: true });
            }

            vscode.workspace.onDidSaveTextDocument(async (e) => {
                vscode.window.showInformationMessage('saving file: ' + e.uri);
                const newFileData = portalsFS.readFile(e.uri);
                console.log(new TextDecoder().decode(newFileData));

                const patchRequestUrl = getRequestUrl('PATCH', dataverseOrg, api, data, version, entity, entityId);
                vscode.window.showInformationMessage(patchRequestUrl);
                await saveCodeInDataverse(accessToken, patchRequestUrl, e.uri, entity, new TextDecoder().decode(newFileData));
            });
        } catch (e: any) {
            if (e.message === 'Unauthorized') {
                vscode.window.showErrorMessage('Failed to authenticate');
            }
            throw e;
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('portals.workspaceInit', async () => {
        vscode.window.showInformationMessage('creating PowerPortals workspace');
        vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, { uri: vscode.Uri.parse(`${portalsUriScheme}:/`), name: portalsWorkspaceName });
    }));

    // this is just for testing...remove this once pre-authorization is completed.
    context.subscriptions.push(vscode.commands.registerCommand('portals.login', async () => {
        try {
            const session = await vscode.authentication.getSession("microsoft", ["https://org2e2e9cae.crm.dynamics.com" + "/.default"], { createIfNone: true });
            console.log(session.accessToken);
        } catch (e: any) {
            console.log(e.toString());
        }
    }));

    // this is used for dynamically updating access token. Remove this after pre-authorization work is complete.
    context.subscriptions.push(vscode.commands.registerCommand('portals.accessToken', async () => {
        // Prompt for the Access Token.
        const token = await vscode.window.showInputBox({
            ignoreFocusOut: true,
            placeHolder: 'Portal/Dataverse access token',
            prompt: 'Enter a Portal/Dataverse access token.'
        });
        if (!token) {
            throw new Error('AccessToken is required');
        }
        accessToken = token;
    }));

    // context.subscriptions.push(vscode.commands.registerCommand('portals.ping',async () => {
    //     const pingMessage = await vscode.window.showInputBox({
    //         ignoreFocusOut: true,
    //         placeHolder: 'Enter Ping Message',
    //         prompt: 'Enter a Ping Message for Portal Studio'
    //     });
    //     messageProtocol?.postMessage(pingMessage);
    // }));

}

async function saveCodeInDataverse(accessToken: string, requestUrl: string, fileUri: vscode.Uri, entity: string, value: string) {
    let requestBody = '';

    const fileExtensionRX = /(?<extension>\.[0-9a-z]+$)/i;
    const fileExtensionMatch = fileExtensionRX.exec(fileUri.path);

    if (fileExtensionMatch?.groups === undefined) {
        return undefined;
    }

    const { extension } = fileExtensionMatch.groups;

    console.log(extension);

    switch (extension) {
        case '.html':
            if (entity === "adx_webpages") {
                requestBody = JSON.stringify({ "adx_copy": value });
            }
            else if (entity === "adx_webtemplates") {
                requestBody = JSON.stringify({ "adx_source": value });
            }
            break;
        case '.js':
            requestBody = JSON.stringify({ "adx_customjavascript": value });
            break;
        case '.css':
            requestBody = JSON.stringify({ "adx_customcss": value });
            break;
        default:
            break;
    }

    if (requestBody) {
        await fetch(requestUrl, {
            method: 'PATCH',
            headers: getHeader(accessToken),
            body: requestBody
        });
    }
}

function getHeader(accessToken: string) {
    return {
        authorization: "Bearer " + accessToken,
        'content-type': "application/json; charset=utf-8",
        accept: "application/json",
        'OData-MaxVersion': "4.0",
        'OData-Version': "4.0",
    };
}

function getRequestUrl(method: string, dataverseOrg: string, api: string, data: string, version: string, entity: string, entityId: string): string {
    let requestUrl = '';
    switch (method) {
        case 'GET':
            // TODO: move these checks to a common function
            if (entity === 'adx_webpages') {
                requestUrl = `https://${dataverseOrg}/${api}/${data}/${version}/${entity}(${entityId})?$select=adx_name,adx_copy,adx_customcss,adx_customjavascript`;
            }
            else if (entity === 'adx_webtemplates') {
                requestUrl = `https://${dataverseOrg}/${api}/${data}/${version}/${entity}(${entityId})?$select=adx_name,adx_source`;
            }
            break;
        case 'PATCH':
            requestUrl = `https://${dataverseOrg}/${api}/${data}/${version}/${entity}(${entityId})`;
            break;

        default:
            break;
    }
    return requestUrl;
}
