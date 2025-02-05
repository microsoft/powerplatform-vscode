/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as vscode from "vscode";
import {
  getParentPagePaths,
  getPortalContext,
  logErrorAndNotifyUser,
} from "./utils/CommonUtils";
import { QuickPickItem } from "vscode";
import { MultiStepInput } from "../../../common/utilities/MultiStepInput";
import { exec } from "child_process";
import { Tables, WEBFILE, YoSubGenerator } from "./CreateOperationConstants";
import { FileCreateEvent, sendTelemetryEvent, UserFileCreateEvent } from "../../../common/OneDSLoggerTelemetry/telemetry/telemetry";
import path from "path";
import { statSync } from "fs";

interface IWebfileInputState {
  title: string;
  step: number;
  totalSteps: number;
  id: string;
}

export const createWebfile = async (
  selectedWorkspaceFolder: string | undefined,
  yoGenPath: string | null
) => {
  try {
    if (!selectedWorkspaceFolder || !yoGenPath) {
      return;
    }

    const portalContext = getPortalContext(selectedWorkspaceFolder);
    await portalContext.init([Tables.WEBPAGE]);

    const { paths, pathsMap } = getParentPagePaths(portalContext);

    if (paths.length === 0) {
      vscode.window.showErrorMessage(
        vscode.l10n.t("No parent pages found for adding webfile")
      );
      return;
    }

    // Show a quick pick to enter name select the web template
    const webfileInputs = await getWebfileInputs(paths);

    const parentPageId = pathsMap.get(webfileInputs.id);

    if (!parentPageId) {
      return;
    }

    const selectedFiles = await getSelectedFiles();

    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    const filteredFiles = filterExistingWebfiles(selectedFiles, selectedWorkspaceFolder);

    if (!filteredFiles || filteredFiles.length === 0) {
      vscode.window.showInformationMessage(vscode.l10n.t("File(s) already exist. No new files to add"));
      return;
    }

    addWebfiles(yoGenPath, parentPageId, filteredFiles, selectedWorkspaceFolder);

  } catch (error: any) {
    sendTelemetryEvent({
      methodName: createWebfile.name,
      eventName: UserFileCreateEvent,
      fileEntityType: WEBFILE,
      exception: error as Error,
    });
  }
};

async function getWebfileInputs(parentPage: string[]) {
  const parentPages: QuickPickItem[] = parentPage.map((label) => ({
    label,
  }));

  const title = vscode.l10n.t("Web files");

  async function collectInputs() {
    const state = {} as Partial<IWebfileInputState>;
    await MultiStepInput.run((input) => pickParentPage(input, state));
    return state as IWebfileInputState;
  }

  async function pickParentPage(
    input: MultiStepInput,
    state: Partial<IWebfileInputState>
  ) {
    const pick = await input.showQuickPick({
      title,
      step: 1,
      totalSteps: 1,
      placeholder: vscode.l10n.t("Choose parent page"),
      items: parentPages,
      activeItem: typeof state.id !== "string" ? state.id : undefined,
    });
    state.id = pick.label;
  }
  const state = await collectInputs();
  return state;
}

const getSelectedFiles = async () => {
  const openDialogOptions = { canSelectMany: true };
  return vscode.window.showOpenDialog(openDialogOptions);
};

const filterExistingWebfiles = (selectedFiles: vscode.Uri[], selectedWorkspaceFolder: string): vscode.Uri[] | undefined => {

  for (let i = 0; i < selectedFiles.length; i++) {
    const webfilePath = selectedFiles[i].fsPath;
    const webfileName = path.basename(webfilePath);
    const filePath = path.join(selectedWorkspaceFolder, "web-files", webfileName);

    try {
      const stat = statSync(filePath);
      if (stat) {
        selectedFiles.splice(i, 1);
        i--;
      }
    } catch (error) {
      // File does not exist
    }
  }
  return selectedFiles;
}


const addWebfiles = async (
  yoGenPath: string,
  parentPageId: string,
  selectedFiles: vscode.Uri[],
  selectedWorkspaceFolder: string
) => {
  try {
    const webfileCount = selectedFiles.length;
    const startTime = performance.now();
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: vscode.l10n.t({
          message: `Adding {0} web file(s). Existing files will be skipped`,
          args: [webfileCount],
          comment: ["{0} represents the number of web files"],
        }),
        cancellable: false
      },
      async () => {
        const promises = selectedFiles.map((file) => {
          const webfilePath = file.fsPath;
          const command = `"${yoGenPath}" ${YoSubGenerator.WEBFILE} "${webfilePath}" "${parentPageId}"`;
          return new Promise((resolve, reject) => {
            exec(
              command,
              { cwd: selectedWorkspaceFolder },
              (error, stdout, stderr) => {
                if (error || stdout.toString().includes("Error")) {
                  const errorMsg = error?.message || stdout;
                  reject(new Error(`Failed to add webfile: ${errorMsg}`));
                } else {
                  resolve(stderr);
                }
              }
            );
          });
        });
        await Promise.all(promises);
        sendTelemetryEvent({ methodName: addWebfiles.name, eventName: FileCreateEvent, fileEntityType: WEBFILE, numberOfFiles: webfileCount.toString(), durationInMills: (performance.now() - startTime) })
        vscode.window.showInformationMessage(
          vscode.l10n.t("Webfile(s) added successfully")
        );
      }
    );
  } catch (error: any) {
    logErrorAndNotifyUser(error);
    sendTelemetryEvent({
      methodName: addWebfiles.name,
      eventName: FileCreateEvent,
      fileEntityType: WEBFILE,
      exception: error as Error,
    });
  }
};
