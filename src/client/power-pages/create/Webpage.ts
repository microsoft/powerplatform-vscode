/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
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

import { MultiStepInput } from "../../../common/utilities/MultiStepInput";
import { TableFolder, Tables, YoSubGenerator } from "./CreateOperationConstants";
import path from "path";
import { sendTelemetryEvent, UserFileCreateEvent } from "../../../common/OneDSLoggerTelemetry/telemetry/telemetry";

interface IWebpageInputState {
    title: string;
    step: number;
    totalSteps: number;
    pageTemplate: string;
    name: string;
    parentPage: string;
}

export const createWebpage = async (
    context: vscode.ExtensionContext,
    selectedWorkspaceFolder: string | undefined,
    yoGenPath: string | null
) => {
    try {
        if (!selectedWorkspaceFolder) {
            return
        }
        const portalContext = getPortalContext(selectedWorkspaceFolder);
        // Get the page templates & webpages from the portal directory
        await portalContext.init([Tables.PAGETEMPLATE, Tables.WEBPAGE]);

        const { pageTemplateNames, pageTemplateMap } =
            getPageTemplate(portalContext);

        if (pageTemplateNames.length === 0) {
            vscode.window.showErrorMessage(vscode.l10n.t("No page templates found"));
            return;
        }

        const { paths, pathsMap, webpageNames } =
            getParentPagePaths(portalContext);

        if (paths.length === 0) {
            vscode.window.showErrorMessage(vscode.l10n.t("No webpages found"));
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

            const watcherPattern = path.join(
                TableFolder.WEBPAGE_FOLDER,
                folder,
                "content-pages",
                `${file}.*.webpage.copy.html`
            );
            const watcher = createFileWatcher(
                context,
                selectedWorkspaceFolder,
                watcherPattern
            );

            const command = `"${yoGenPath}" ${YoSubGenerator.WEBPAGE} "${webpageName}" "${parentPageId}" "${pageTemplateId}"`;
            await createRecord(
                Tables.WEBPAGE,
                command,
                selectedWorkspaceFolder,
                watcher
            );
        }
    } catch (error: any) {
        sendTelemetryEvent({ methodName: createWebpage.name, eventName: UserFileCreateEvent, fileEntityType: Tables.WEBPAGE, exception: error as Error })
        throw new Error(error);
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

    const title = vscode.l10n.t("New Webpage");

    async function collectInputs() {
        const state = {} as Partial<IWebpageInputState>;
        await MultiStepInput.run((input) => inputWebpageName(input, state));
        return state as IWebpageInputState;
    }


    async function inputWebpageName(
        input: MultiStepInput,
        state: Partial<IWebpageInputState>
    ) {
        state.name = await input.showInputBox({
            title,
            step: 1,
            totalSteps: 3,
            value: state.name || "",
            placeholder: vscode.l10n.t("Enter name"),
            validate: validateNameIsUnique,
        });
        return (input: MultiStepInput) => pickPageTemplate(input, state);
    }

    async function pickPageTemplate(
        input: MultiStepInput,
        state: Partial<IWebpageInputState>
    ) {
        const pick = await input.showQuickPick({
            title,
            step: 2,
            totalSteps: 3,
            placeholder: vscode.l10n.t("Choose page template"),
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
        state: Partial<IWebpageInputState>
    ) {
        const pick = await input.showQuickPick({
            title,
            step: 3,
            totalSteps: 3,
            placeholder: vscode.l10n.t("Choose parent page"),
            items: parentPages,
            activeItem:
                typeof state.parentPage !== "string"
                    ? state.parentPage
                    : undefined,
        });
        state.parentPage = pick.label;
    }

    async function validateNameIsUnique(name: string) {
        if (!name) {
            return vscode.l10n.t("Please enter a name for the webpage.");
        }
        if (!/^[A-Za-z0-9-_]+$/.test(name)) {
            return vscode.l10n.t("Webpage names should contain only letters, numbers, hyphens, or underscores.");
        }
        if (
            webpageNames
                .map((n) => n.toLowerCase())
                .includes(name.toLowerCase())
        ) {
            return vscode.l10n.t("A webpage with the same name already exists. Please enter a different name.");
        }

        return undefined;
    }

    const state = await collectInputs();
    return state;
}
