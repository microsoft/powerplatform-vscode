/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();

import * as vscode from "vscode";
import TelemetryReporter from "@vscode/extension-telemetry";
import { AI_KEY } from '../../common/telemetry/generated/telemetryConfiguration';
import { dataverseAuthentication } from "./common/authenticationProvider";
// import { setContext } from "./common/localStore";
import { ORG_URL, PORTALS_URI_SCHEME, telemetryEventNames, SITE_VISIBILITY, PUBLIC } from "./common/constants";
import { Directory, Entry, PortalsFS } from "./common/fileSystemProvider";
import { checkMandatoryParameters, removeEncodingFromParameters, ERRORS, showErrorDialog } from "./common/errorHandler";
import { sendErrorTelemetry, sendExtensionInitPathParametersTelemetry, sendExtensionInitQueryParametersTelemetry, sendPerfTelemetry, setTelemetryReporter } from "./telemetry/webExtensionTelemetry";
import { GetDefaultFileUri } from './utility/CommonUtility';
let _telemetry: TelemetryReporter;
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export function activate(context: vscode.ExtensionContext): void {
    // setup telemetry
    _telemetry = new TelemetryReporter(context.extension.id, context.extension.packageJSON.version, AI_KEY);
    context.subscriptions.push(_telemetry);

    setTelemetryReporter(_telemetry);
    _telemetry.sendTelemetryEvent("Start");
    _telemetry.sendTelemetryEvent("activated");
    const serverBackedRootDirectory = new ServerBackedDirectory(vscode.Uri.parse('myTestUri'), '');
    const portalsFS = new PortalsFS(PORTALS_URI_SCHEME, serverBackedRootDirectory);
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider(PORTALS_URI_SCHEME, portalsFS, { isCaseSensitive: true }));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "microsoft-powerapps-portals.webExtension.init",
            async (args) => {
                _telemetry.sendTelemetryEvent("StartCommand", { 'commandId': 'microsoft-powerapps-portals.webExtension.init' });

                const { appName, entity, entityId, searchParams } = args;
                sendExtensionInitPathParametersTelemetry(appName, entity, entityId);
                const queryParamsMap = new Map<string, string>();

                if (searchParams) {
                    const queryParams = new URLSearchParams(searchParams);
                    for (const pair of queryParams.entries()) {
                        queryParamsMap.set(pair[0], pair[1]);
                    }
                }

                if (queryParamsMap.get(SITE_VISIBILITY) === PUBLIC) {
                    const edit: vscode.MessageItem = { isCloseAffordance: true, title: localize("microsoft-powerapps-portals.webExtension.init.sitevisibility.edit","Edit the site") };
                    const siteMessage = localize("microsoft-powerapps-portals.webExtension.init.sitevisibility.edit.desc","Be careful making changes. Anyone can see the changes you make immediately. Choose Edit the site to make edits, or close the editor tab to cancel without editing.");
                    const options = { detail: siteMessage, modal: true };
                    await vscode.window.showWarningMessage(localize("microsoft-powerapps-portals.webExtension.init.sitevisibility.edit.title","You are editing a live, public site "), options, edit);
                }

                let accessToken: string;
                if (appName) {
                    switch (appName) {
                        case 'portal': {
                            sendExtensionInitQueryParametersTelemetry(searchParams);
                            if (!checkMandatoryParameters(appName, entity, entityId, queryParamsMap)) return;
                            removeEncodingFromParameters(queryParamsMap);

                            accessToken = await dataverseAuthentication(queryParamsMap.get(ORG_URL) as string);
                            if (!accessToken) {
                                {
                                    showErrorDialog(localize("microsoft-powerapps-portals.webExtension.init.error", "There was a problem opening the workspace"), localize("microsoft-powerapps-portals.webExtension.init.error.desc", "Try refreshing the browser"));
                                    sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_NO_ACCESS_TOKEN);
                                    return;
                                }
                            }
                            const timeStampBeforeSettingContext = new Date().getTime();
                            // await setContext(accessToken, entity, entityId, queryParamsMap, portalsFS);
                            const timeTakenToSetContext = new Date().getTime() - timeStampBeforeSettingContext;
                            sendPerfTelemetry(telemetryEventNames.WEB_EXTENSION_SET_CONTEXT_PERF, timeTakenToSetContext);
                        }
                            break;
                        case 'default':
                        default:
                            vscode.window.showInformationMessage(localize("microsoft-powerapps-portals.webExtension.init.app-not-found", "Unable to find that app"));
                    }
                } else {
                    vscode.window.showErrorMessage(localize("microsoft-powerapps-portals.webExtension.init.app-not-found", "Unable to find that app"));
                    throw new Error(ERRORS.UNKNOWN_APP);
                }
            }
        )
    );
	context.subscriptions.push(vscode.commands.registerCommand('powerplatform-walkthrough.overview-learn-more', async () => {
		vscode.env.openExternal(vscode.Uri.parse("https://go.microsoft.com/fwlink/?linkid=2207914"));
	}));

	context.subscriptions.push(vscode.commands.registerCommand('powerplatform-walkthrough.fileSystem-documentation', async () => {
		vscode.env.openExternal(vscode.Uri.parse("https://go.microsoft.com/fwlink/?linkid=2206616"));
	}));

	context.subscriptions.push(vscode.commands.registerCommand('powerplatform-walkthrough.fileSystem-open-folder', async () => {
		vscode.commands.executeCommand("workbench.view.explorer");
	}));

	context.subscriptions.push(vscode.commands.registerCommand('powerplatform-walkthrough.advancedCapabilities-learn-more', async () => {
		vscode.env.openExternal(vscode.Uri.parse("https://go.microsoft.com/fwlink/?linkid=2206366"));
	}));

	context.subscriptions.push(vscode.commands.registerCommand('powerplatform-walkthrough.advancedCapabilities-start-coding', async () => {
		vscode.window.showTextDocument(GetDefaultFileUri());
	}));
}

// class ServerBackedFile implements File {
// 	readonly type = vscode.FileType.File;
// 	readonly stats = Promise.resolve({ type: vscode.FileType.File, ctime: Date.now(), mtime: Date.now(), size: 0 });
// 	private _content: Promise<Uint8Array> | undefined;
// 	constructor(private readonly _serverUri: vscode.Uri, public name: string) {
// 	}
// 	get content(): Promise<Uint8Array> {
// 		console.log('ServerBackedFile getContent');
// 		if (this._content === undefined) {
// 			this._content = Promise.resolve(vscode.workspace.fs.readFile(this._serverUri));
// 		}
// 		return this._content;
// 	}
// 	set content(content: Promise<Uint8Array>) {
// 		console.log('ServerBackedFile setContent');
// 		this._content = content;
// 	}
// }

class ServerBackedDirectory implements Directory {
	readonly type = vscode.FileType.Directory;
	readonly stats = Promise.resolve({ type: vscode.FileType.Directory, ctime: Date.now(), mtime: Date.now(), size: 0 });
	private _entries: Promise<Map<string, Entry>> | undefined;
	constructor(private readonly _serverUri: vscode.Uri, public name: string) {
	}
	get entries(): Promise<Map<string, Entry>> {
		console.log('ServerBackedDirectory getEntries');
		if (this._entries === undefined) {
			this._entries = getEntries(this._serverUri);
		}
		return this._entries;
	}
	set entries(entries: Promise<Map<string, Entry>>) {
		console.log('ServerBackedDirectory setEntries');
		this._entries = entries;
	}
}

async function getEntries(contentUri: vscode.Uri): Promise<Map<string, Entry>> {
	console.log('getEntries contentUri= '+ contentUri.toString());

	const result = new Map();
	return result;
}

export async function deactivate(): Promise<void> {
    if (_telemetry) {
        _telemetry.sendTelemetryEvent("End");
        _telemetry.dispose();
    }
}
