// Copyright (C) Microsoft Corporation. All rights reserved.

import * as process from "process";
import * as os from "os";

export function getAppDataPath(): string {
    const platform = os.platform();
    switch (platform) {
        case 'darwin':
            return '~/Library/';
        case 'linux':
            return `${process.env.HOME}/.config/`;
        case 'win32':
            return process.env.LOCALAPPDATA as string;
        default:
            throw new Error(`Platform "${platform}" is not currently supported`);
    }
}
