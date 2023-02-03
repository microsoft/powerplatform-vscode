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
    fileName,
    getPortalContext,
    getWebTemplates,
} from "./utils/CommonUtils";
import { QuickPickItem } from "vscode";
import { MultiStepInput } from "./utils/MultiStepInput";
import path from "path";
import { pageTemplate, TableFolder, yoPath } from "./constants";
import { YoSubGenerator } from "../powerpages/constants";

// export const createPageTemplate = async (
//     context: vscode.ExtensionContext,
//     selectedWorkspaceFolder: string
// ) => {

//     // Get the web templates from the portal directory
//     const portalDir = selectedWorkspaceFolder;
//     const portalContext = getPortalContext(portalDir);
//     const { webTemplateNames, webTemplateMap } = await getWebTemplates(
//         portalContext
//     );

//     // Show a quick pick to enter name select the web template
//     const pageTemplateInputs = await getPageTemplateInputs(webTemplateNames);

//     const webtemplateId = webTemplateMap.get(pageTemplateInputs.type);

//     const pageTemplateName = pageTemplateInputs.name;

//     // Create the page template using the yo command
//     if (!isNullOrEmpty(pageTemplateName)) {
//         const file = fileName(pageTemplateName);
//         const watcherPattern = path.join(
//             TableFolder.PAGETEMPLATE_FOLDER,
//             `${file}.pagetemplate.yml`
//         );
//         const watcher = createFileWatcher(
//             context,
//             selectedWorkspaceFolder,
//             watcherPattern
//         );

//         const portalDir = selectedWorkspaceFolder;
//         const command = `${yoPath} ${YoSubGenerator.PAGETEMPLATE} "${pageTemplateName}" "${webtemplateId}"`;

//         await createRecord(pageTemplate, command, portalDir, watcher);

//     }
// };

export const createPageTemplate = async (
    context: vscode.ExtensionContext,
    selectedWorkspaceFolder: string
): Promise<void> => {
    try {
        const portalDir = selectedWorkspaceFolder;
        const portalContext = getPortalContext(portalDir);

        const { webTemplateNames, webTemplateMap } = await getWebTemplates(
            portalContext
        );

        const pageTemplateInputs = await getPageTemplateInputs(
            webTemplateNames
        );
        const webtemplateId = webTemplateMap.get(pageTemplateInputs.type);
        const pageTemplateName = pageTemplateInputs.name;

        if (!pageTemplateName) {
            throw new Error("Page Template name cannot be empty.");
        }

        const file = fileName(pageTemplateName);
        const watcherPattern = path.join(
            TableFolder.PAGETEMPLATE_FOLDER,
            `${file}.pagetemplate.yml`
        );
        const watcher = createFileWatcher(
            context,
            selectedWorkspaceFolder,
            watcherPattern
        );

        const command = `${yoPath} ${YoSubGenerator.PAGETEMPLATE} "${pageTemplateName}" "${webtemplateId}"`;
        await createRecord(pageTemplate, command, portalDir, watcher);
    } catch (error: any) {
        throw new Error(error);
    }
};

async function getPageTemplateInputs(webTemplateNames: string[]) {
    const webTemplates: QuickPickItem[] = webTemplateNames.map((label) => ({
        label,
    }));

    interface State {
        title: string;
        step: number;
        totalSteps: number;
        type: string;
        name: string;
    }

    async function collectInputs() {
        const state = {} as Partial<State>;
        await MultiStepInput.run((input) => inputName(input, state));
        return state as State;
    }

    const title = localize(
        "microsoft-powerapps-portals.webExtension.pagetemplate.quickpick.title",
        "New Page Template"
    );

    async function inputName(input: MultiStepInput, state: Partial<State>) {
        state.name = await input.showInputBox({
            title,
            step: 1,
            totalSteps: 2,
            value: state.name || "",
            placeholder: localize(
                "microsoft-powerapps-portals.webExtension.pagetemplate.quickpick.name.placeholder",
                "Enter name"
            ),
            validate: validateNameIsUnique,
        });
        return (input: MultiStepInput) => pickWebtemplate(input, state);
    }

    async function pickWebtemplate(
        input: MultiStepInput,
        state: Partial<State>
    ) {
        const pick = await input.showQuickPick({
            title,
            step: 2,
            totalSteps: 2,
            placeholder: localize(
                "microsoft-powerapps-portals.webExtension.pagetemplate.quickpick.webtemplate.placeholder",
                "Choose web template"
            ),
            items: webTemplates,
            activeItem: typeof state.type !== "string" ? state.type : undefined,
        });
        state.type = pick.label;
    }

    async function validateNameIsUnique(
        name: string
    ): Promise<string | undefined> {
        const file = fileName(name);
        return await vscode.workspace
            .findFiles(
                path.join("page-templates", `${file}.pagetemplate.yml`),
                "",
                1
            )
            .then((uris) => {
                if (uris.length > 0) {
                    return "Name not unique";
                }
                return undefined;
            });
    }

    const state = await collectInputs();
    return state;
}
