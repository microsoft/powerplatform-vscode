/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ITelemetryUserSettings, ITelemetryUserSettingsProvider } from "./interfaces";
import * as fs from 'fs-extra';

import path = require('path');
import uuid = require('uuid');

interface IUserSettingsDataContract {
    settingVersion: string;
    uniqueId?: string; // May be undefined for some old installs
    telemetryEnabled: boolean;
}

const SettingVersionId = '1.0';

// The implementation of this class uses the same methods as implemented in the CRM.DevToolsCore repo to keep the reliability consistent.
// See: https://dev.azure.com/dynamicscrm/OneCRM/_git/CRM.DevToolsCore?path=src/GeneralTools/BatchedTelemetry/BatchedTelemetry/Extensibility/TelemetryUserSettingsFileProvider.cs&version=GBmaster&_a=contents

export class TelemetryUserSettingsFileProvider implements ITelemetryUserSettingsProvider {
    private readonly settingsFilePath: string;

    constructor(settingsFilePath: string) {
        if (!settingsFilePath) throw new Error('settingsFilePath is required.');

        // Note: We resolve the path to a full path to ensure that changes to Environment.CurrentDirectory won't cause unexpected, hard to trace IO exceptions.
        this.settingsFilePath = path.resolve(settingsFilePath);
    }

    public GetCurrent(): ITelemetryUserSettings {
        try {
            // Always load fresh from persisted file
            const settings = this.SafeLoadSettings();

            return {
                uniqueId: settings.uniqueId,
                telemetryEnabled: settings.telemetryEnabled,
            };
        } catch (e) {
            if (e instanceof Error) {
                if (e.message.startsWith("UserSettingsErrorReason.")) {
                    throw e;
                } else {
                    throw new Error(`UserSettingsErrorReason.Unspecified - ${e.message}`);
                }
            }

            throw new Error(`UserSettingsErrorReason.Unspecified`);
        }
    }

    private SafeLoadSettings(): IUserSettingsDataContract & { uniqueId: string } {
        this.EnsureSettingsFileExists();

        const settings = this.ReadSettings();

        // Some old files may not have the UniqueId set
        if (!settings.uniqueId || settings.uniqueId === "00000000-0000-0000-0000-000000000000") {
            // BatchedTelemetryTraceSource.TraceInformation($"{nameof(TelemetryUserSettingsFileProvider)} User settings file missing unique id. Generating and saving new id. Settings file path: {SettingsFilePath}.");
            settings.uniqueId = uuid.v4();
            this.WriteSettings(settings, /*allowOverwrite*/ true);
        }

        // uniqueId is now guaranteed
        return settings as IUserSettingsDataContract & { uniqueId: string };
    }

    private EnsureSettingsFileExists(): void {
        if (fs.existsSync(this.settingsFilePath)) {
            return;
        }

        // Ensure the folder path exists
        fs.ensureDirSync(path.dirname(this.settingsFilePath));

        // otherwise, we need to create the file, as long as no other process is also creating it
        const proposedUserSettings: IUserSettingsDataContract = {
            settingVersion: SettingVersionId,
            uniqueId: uuid.v4(),
            telemetryEnabled: true,
        };

        try {
            this.WriteSettings(proposedUserSettings, /*allowOverwrite*/ false);
        } catch (e) {
            // This indicates that between our call to File.Exists and WriteSettings that another process was able to successfully write the settings file.
            // In this case, we ignore the exception as now the exist condition for this function is satisfied.
        }
    }

    private ReadSettings(): IUserSettingsDataContract {
        // Note: This function assumes the file already exists.

        // TODO: use MultiProcessIO.FileReadAllTextWithRetries (in CRM.DevToolsCore) if we get errors from customers regarding multi-process write errors
        const json = fs.readFileSync(this.settingsFilePath, 'utf8');

        try {
            // Parse json and deserialize, with data contract validation
            const parsed = JSON.parse(json) as Partial<IUserSettingsDataContract>;
            if (parsed.settingVersion !== SettingVersionId) throw new Error(`settingVersion should be '${SettingVersionId}'.`);
            if (parsed.uniqueId && parsed.uniqueId.length !== 36) throw new Error(`uniqueId is allowed to be undefined or it should be a Guid of length 36.`);
            if (typeof parsed.telemetryEnabled !== "boolean") throw new Error(`telemetryEnabled should be a boolean.`);

            return parsed as IUserSettingsDataContract;
        } catch (e) {
            // Then the settings file is invalid or corrupted
            // This shouldn't happen unless there was a catastrophic disk error, invalid serialization logic, or user error.
            // In any of these cases, this indicates a bug in our code that we should fix or the user should be instructed to fix their installation.
            throw new Error("UserSettingsErrorReason.InvalidFileContents");
        }
    }

    private WriteSettings(proposedUserSettings: IUserSettingsDataContract, allowOverwrite: boolean): void {
        // Serialize the settings to json
        if (proposedUserSettings.settingVersion !== SettingVersionId) throw new Error(`settingVersion should be '${SettingVersionId}'.`);
        if (!proposedUserSettings.uniqueId || proposedUserSettings.uniqueId.length !== 36) throw new Error(`uniqueId should be a Guid of length 36.`);
        if (typeof proposedUserSettings.telemetryEnabled !== "boolean") throw new Error(`telemetryEnabled should be a boolean.`);
        const json = JSON.stringify(proposedUserSettings);

        // see: https://nodejs.org/api/fs.html#file-system-flags
        const fsFlag = allowOverwrite ? "w" : "wx";

        // TODO: use MultiProcessIO.CreateExclusiveFileStreamWithRetries (in CRM.DevToolsCore) if we get errors from customers regarding multi-process write errors
        fs.writeFileSync(this.settingsFilePath, json, {
            encoding: "utf8",
            flag: fsFlag,
        });
    }
}
