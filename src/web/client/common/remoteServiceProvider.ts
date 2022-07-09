/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use strict';
import * as vscode from 'vscode';
import { getHeader } from './authenticationProvider';
import { DEFAULT_LANGUAGE_CODE, pathparam_schemaMap, SINGLE_ENTITY_SAVE_URL_KEY, WEBPAGES_FILENAME } from './constants';
import { CONTENTPAGES, PORTALSFOLDERNAME, PORTALSURISCHEME, SINGLE_ENTITY_FETCH_URL_KEY, WEBPAGES, WEBTEMPLATES } from './constants';
import { PortalsFS } from './fileSystemProvider';
import { entitiesSchemaMap, dataSourcePropertiesMap } from './localStore';

export async function fetchData(accessToken: string, entity: string, entityId: string, queryParamsMap: any, entitiesSchemaMap: any, languageIdCodeMap: any, portalFs: PortalsFS) {
    try {
        const dataverseOrg = queryParamsMap.get('orgUrl');
        const requestUrl = getRequestURLSingleEntity(dataverseOrg, entity, entityId, SINGLE_ENTITY_FETCH_URL_KEY, entitiesSchemaMap);
        vscode.window.showInformationMessage(requestUrl);
        const response = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });
        if (!response.ok) {
            vscode.window.showInformationMessage("auth failed in fetch data");
            throw new Error(response.statusText);
        }
        const data = await response.json();
        switch (entity) {
            case 'adx_webpages':
                createsinglewebpage(data, entity, queryParamsMap, entitiesSchemaMap, languageIdCodeMap, portalFs);
                break;

            case 'adx_webfiles':
                createwebfile(data, entity, portalFs);
                break;

            case 'adx_webtemplates':
                createwebtemplate(data, entity, portalFs);
                break;
            default:
                vscode.window.showInformationMessage('None of the entity matched')
        }
        vscode.workspace.onDidSaveTextDocument(async (e) => {
            vscode.window.showInformationMessage('saving file: ' + e.uri);
            const newFileData = portalFs.readFile(e.uri);
            const patchRequestUrl = getSaveURLSingleEntity(dataverseOrg, entity, entityId, SINGLE_ENTITY_SAVE_URL_KEY);
            vscode.window.showInformationMessage(patchRequestUrl)
            await saveData(accessToken, patchRequestUrl, e.uri, entity, new TextDecoder('utf-8').decode(newFileData));
        });

    } catch (e: any) {
        if (e.message.includes('Unauthorized')) {
            vscode.window.showErrorMessage('Failed to authenticate');
        }
    }
}

function getRequestURLSingleEntity(dataverseOrg: any, entity: string, entityId: string, urlquery: string, entitiesSchemaMap: any) {
    const parameterizedUrl = dataSourcePropertiesMap.get(urlquery) as string;
    const requestUrl = parameterizedUrl.replace('{dataverseOrg}', dataverseOrg).replace('{entity}', entity).replace('{entityId}', entityId).replace('{api}', dataSourcePropertiesMap.get('api')).replace('{data}', dataSourcePropertiesMap.get('data')).replace('{version}', dataSourcePropertiesMap.get('version'));
    return requestUrl + entitiesSchemaMap.get(pathparam_schemaMap.get(entity)).get('_query');
}

function getSaveURLSingleEntity(dataverseOrg: any, entity: string, entityId: string, urlquery: string) {
    const parameterizedUrl = dataSourcePropertiesMap.get(urlquery) as string;
    const requestUrl = parameterizedUrl.replace('{dataverseOrg}', dataverseOrg).replace('{entity}', entity).replace('{entityId}', entityId).replace('{api}', dataSourcePropertiesMap.get('api')).replace('{data}', dataSourcePropertiesMap.get('data')).replace('{version}', dataSourcePropertiesMap.get('version'));
    return requestUrl;
}
function createsinglewebpage(res: any, entity: string, queryParamsMap: any, entitiesSchemaMap: any, languageIdCodeMap: any, portalsFS: PortalsFS) {
    portalsFS.createDirectory(vscode.Uri.parse(`${PORTALSURISCHEME}:/${PORTALSFOLDERNAME}/${WEBPAGES_FILENAME}/`, true));
    let languageCode;
    if (languageIdCodeMap.size) {
        languageCode = languageIdCodeMap.get(queryParamsMap.get('websiteId')) ? languageIdCodeMap.get(queryParamsMap.get('websiteId')) : DEFAULT_LANGUAGE_CODE;
    }
    const adxCopy = res['adx_copy'] ? res['adx_copy'] : ' ';
    const adxCustomJavascript = res['adx_customjavascript'] ? res['adx_customjavascript'] : ' ';
    const adxCustomCss = res['adx_customcss'] ? res['adx_customcss'] : ' ';
    const fileName = res['adx_name'] ? res['adx_name'] : 'defaultfilename';
    portalsFS.createDirectory(vscode.Uri.parse(`${PORTALSURISCHEME}:/${PORTALSFOLDERNAME}/${WEBPAGES_FILENAME}/${fileName}/`, true));
    portalsFS.createDirectory(vscode.Uri.parse(`${PORTALSURISCHEME}:/${PORTALSFOLDERNAME}/${WEBPAGES_FILENAME}/${fileName}/${CONTENTPAGES}/`, true));
    createVscodeFile(portalsFS, fileName, languageCode, adxCustomCss, 'customcss.cs');
    createVscodeFile(portalsFS, fileName, languageCode, adxCustomJavascript, 'customjs.js');
    createVscodeFile(portalsFS, fileName, languageCode, adxCopy, 'webpage.copy.html');
    vscode.window.showTextDocument(vscode.Uri.parse(`${PORTALSURISCHEME}:/${PORTALSFOLDERNAME}/${WEBPAGES_FILENAME}/${fileName}/${CONTENTPAGES}/${fileName}.${languageCode}.webpage.copy.html`))
}

function createVscodeFile(portalsFS: PortalsFS, fileName: string, languageCode: string, data: any, ext: any) {
    portalsFS.writeFile(vscode.Uri.parse(`${PORTALSURISCHEME}:/${PORTALSFOLDERNAME}/${WEBPAGES_FILENAME}/${fileName}/${CONTENTPAGES}/${fileName}.${languageCode}.${ext}`), new TextEncoder().encode(data), { create: true, overwrite: true });
}

function createwebtemplate(res: any, entity: string, portalFS: PortalsFS) {
    portalFS.createDirectory(vscode.Uri.parse(`${PORTALSURISCHEME}:/${PORTALSFOLDERNAME}/${WEBTEMPLATES}/`, true));
    const adxSource = res['adx_source'] ? res['adx_source'] : 'dummy source';
    const fileName = entitiesSchemaMap.get(entity)._name;
    portalFS.createDirectory(vscode.Uri.parse(`${PORTALSURISCHEME}:/${PORTALSFOLDERNAME}/${WEBTEMPLATES}/${fileName}/`, true));
    portalFS.writeFile(vscode.Uri.parse(`${PORTALSURISCHEME}:/${PORTALSFOLDERNAME}/${WEBTEMPLATES}/${fileName}/${fileName}.${WEBTEMPLATES}.source.html`), new TextEncoder().encode(adxSource), { create: true, overwrite: true });
}

function createwebfile(res: any, entity: string, portalFS: PortalsFS) {
    portalFS.createDirectory(vscode.Uri.parse(`${PORTALSURISCHEME}:/${PORTALSFOLDERNAME}/${entity}/`, true));
    const adxSource = res['adx_filecontent'] ? res['adx_filecontent'] : 'dummy content';
    const fileName = entitiesSchemaMap.get(entity)._name;
    portalFS.writeFile(vscode.Uri.parse(`${PORTALSURISCHEME}:/${PORTALSFOLDERNAME}/${entity}/${fileName}.webfile.yml`), new TextEncoder().encode(adxSource), { create: true, overwrite: true });
}


async function saveData(accessToken: string, requestUrl: string, fileUri: vscode.Uri, entity: string, value: string) {
    let requestBody = '';
    const fileExtensionRX = /(?<extension>\.[0-9a-z]+$)/i;
    const fileExtensionMatch = fileExtensionRX.exec(fileUri.path);
    if (fileExtensionMatch?.groups === undefined) {
        return undefined;
    }
    const { extension } = fileExtensionMatch.groups;
    switch (extension) {
        case '.html':
            if (entity === WEBPAGES) {
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

export async function createfiles(accessToken: string, entity: string, entityId: string, queryParamMap: any, entitiesSchemaMap: any, languageIdCodeMap: any, portalFs: PortalsFS) {
    vscode.window.showInformationMessage('fetching portal data...');
    await fetchData(accessToken, entity, entityId, queryParamMap, entitiesSchemaMap, languageIdCodeMap, portalFs);
}



