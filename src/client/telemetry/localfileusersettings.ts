/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as fs from 'fs-extra';
import { getAppDataPath } from './appdata';
import * as path from 'path';
import { v4 } from 'uuid';

interface IUserSettings {
    readonly uniqueId: string;
    readonly settingVersion: string;
    readonly telemetryEnabled: boolean;
}

const settingVersionId = '1.0';
const userSettingsFileName = 'usersettings.json';
let settings: IUserSettings = {
    uniqueId: v4(),
    settingVersion: settingVersionId,
    telemetryEnabled: true
};

// Application Path and User settings file name should be consistent with CLI
export function readUserSettings(applicationPath?: string | undefined): IUserSettings {
    if (!applicationPath) {
        applicationPath = path.join(getAppDataPath(), 'Microsoft', 'PowerAppsCli');
    }
    const userSettingFilePath = path.join(applicationPath, userSettingsFileName);
    if (fs.existsSync(userSettingFilePath)) {
        const stream = fs.readFileSync(userSettingFilePath, 'utf8');
        try {
            settings = JSON.parse(stream) as IUserSettings;
            if (settings.uniqueId === '') {
                writeUserSettings(settings, applicationPath);
            }
        } catch (err) {
            try {
                fs.unlinkSync(userSettingFilePath);
            } catch {
                // Ignore error on delete
            }
            writeUserSettings(settings, applicationPath);
        }
    } else {
        writeUserSettings(settings, applicationPath);
    }
    return settings;
}

function writeUserSettings(userSettings: IUserSettings, applicationPath: string): void {
    userSettings = userSettings || settings;
    try {
        fs.ensureDirSync(applicationPath);
        fs.writeFileSync(path.join(applicationPath, userSettingsFileName), JSON.stringify(userSettings));
    } catch (err) {
        // catch err
    }
}
