/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as nls from "vscode-nls";
nls.config({
    messageFormat: nls.MessageFormat.bundle,
    bundleFormat: nls.BundleFormat.standalone,
})();
const localize: nls.LocalizeFunc = nls.loadMessageBundle();
import * as vscode from "vscode";
import {
    createFileWatcher,
    createRecord,
    formatFileName,
    formatFolderName,
    getPageTemplate,
    getParentPagePaths,
    getPortalContext,
    isNullOrEmpty,
} from "./utils/CommonUtils";
import { QuickPickItem } from "vscode";

import { MultiStepInput } from "./utils/MultiStepInput";
import { Tables, webpage, YoSubGenerator } from "./constants";
import path from "path";

export const createWebpage = async (
    context: vscode.ExtensionContext,
    selectedWorkspaceFolder: string | undefined,
    yoGenPath: string | null
) => {
    try {
        const portalDir = `${selectedWorkspaceFolder}`;
        const portalContext = getPortalContext(portalDir);
         // Get the page templates & webpages from the portal directory
        await portalContext.init([Tables.WEBPAGE, Tables.PAGETEMPLATE]);

        const { pageTemplateNames, pageTemplateMap } =
            getPageTemplate(portalContext);

        if (pageTemplateNames.length === 0) {
            vscode.window.showErrorMessage("No page templates found");
            return;
        }

        const { paths, pathsMap, webpageNames } = getParentPagePaths(portalContext);

        if (paths.length === 0) {
            vscode.window.showErrorMessage("No webpages found");
            return;
        }

        // Show a quick pick
        const webpageInputs = await getWebpageInputs(
            pageTemplateNames,
            paths,
            webpageNames
        );

        const pageTemplateId = pageTemplateMap.get(webpageInputs.pageTemplate);

        const webpageName = webpageInputs.name;

        const parentPageId = pathsMap.get(webpageInputs.parentPage);

        // Create the webpage using the yo command
        if (!isNullOrEmpty(webpageName) && selectedWorkspaceFolder) {
            const file = formatFileName(webpageName);
            const folder = formatFolderName(webpageName);

            // const watcher: vscode.FileSystemWatcher =
            //     vscode.workspace.createFileSystemWatcher(
            //         new vscode.RelativePattern(
            //             selectedWorkspaceFolder,
            //             path.join("web-pages", folder, "content-pages", `${file}.*.webpage.copy.html`) // TODO: Use default language
            //         ),
            //         false,
            //         true,
            //         true
            //     );

            const watcherPattern = path.join(
                "web-pages",
                folder,
                "content-pages",
                `${file}.*.webpage.copy.html`
            );
            const watcher = createFileWatcher(
                context,
                selectedWorkspaceFolder,
                watcherPattern
            );
            // const yoWebpageGenerator = "@microsoft/powerpages:webpage";
            const command = `"${yoGenPath}" ${YoSubGenerator.WEBPAGE} "${webpageName}" "${parentPageId}" "${pageTemplateId}"`;
            await createRecord(webpage, command, portalDir, watcher);
            // vscode.window
            //     .withProgress(
            //         {
            //             location: vscode.ProgressLocation.Notification,
            //             title: "Creating Webpage...",
            //         },
            //         () => {
            //             return new Promise((resolve, reject) => {
            //                 exec(command, { cwd: portalDir }, (error, stderr) => {
            //                     if (error) {
            //                         vscode.window.showErrorMessage(error.message);
            //                         reject(error);
            //                     } else {
            //                         resolve(stderr);
            //                     }
            //                 });
            //             });
            //         }
            //     )
            //     .then(() => {
            //         vscode.window.showInformationMessage(
            //             "Webpage Created!"
            //         );
            //     });

            // watcher.onDidCreate(async (uri) => {
            //     await vscode.window.showTextDocument(uri);
            // });
        }
    } catch (error: any) {
        vscode.window.showErrorMessage(error.message);
        return;
    }


};
async function getWebpageInputs(
    pageTemplateName: string[],
    parentPage: string[],
    webpageNames: string[]
) {
    const pageTemplates: QuickPickItem[] = pageTemplateName.map((label) => ({
        label,
    }));

    const parentPages: QuickPickItem[] = parentPage.map((label) => ({
        label,
    }));

    interface State {
        title: string;
        step: number;
        totalSteps: number;
        pageTemplate: string;
        name: string;
        parentPage: string;
    }

    async function collectInputs() {
        const state = {} as Partial<State>;
        await MultiStepInput.run((input) => inputWebpageName(input, state));
        return state as State;
    }

    const title = localize(
        "microsoft-powerapps-portals.webExtension.webpage.quickpick.title",
        "New Webpage"
    );

    async function inputWebpageName(
        input: MultiStepInput,
        state: Partial<State>
    ) {
        state.name = await input.showInputBox({
            title,
            step: 1,
            totalSteps: 3,
            value: state.name || "",
            placeholder: localize(
                "microsoft-powerapps-portals.webExtension.webpage.quickpick.name.placeholder",
                "Enter name"
            ),
            validate: validateNameIsUnique,
        });
        return (input: MultiStepInput) => pickPageTemplate(input, state);
    }

    async function pickPageTemplate(
        input: MultiStepInput,
        state: Partial<State>
    ) {
        const pick = await input.showQuickPick({
            title,
            step: 2,
            totalSteps: 3,
            placeholder: localize(
                "microsoft-powerapps-portals.webExtension.webpage.quickpick.pagetemplate.placeholder",
                "Choose page template"
            ),
            items: pageTemplates,
            activeItem:
                typeof state.pageTemplate !== "string"
                    ? state.pageTemplate
                    : undefined,
        });
        state.pageTemplate = pick.label;
        return (input: MultiStepInput) => pickParentPage(input, state);
    }

    async function pickParentPage(
        input: MultiStepInput,
        state: Partial<State>
    ) {
        const pick = await input.showQuickPick({
            title,
            step: 3,
            totalSteps: 3,
            placeholder: localize(
                "microsoft-powerapps-portals.webExtension.webpage.quickpick.parentpage.placeholder",
                "Choose parent page"
            ),
            items: parentPages,
            activeItem:
                typeof state.parentPage !== "string"
                    ? state.parentPage
                    : undefined,
        });
        state.parentPage = pick.label;
    }

    async function validateNameIsUnique(name: string) {
        // ...validate...
        if (
            webpageNames
                .map((n) => n.toLowerCase())
                .includes(name.toLowerCase())
        ) {
            return "A webpage with the same name already exists. Please enter a different name.";
        }

        return undefined;
    }

    const state = await collectInputs();
    return state;
}
