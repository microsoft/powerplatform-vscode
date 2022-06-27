/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

import { UserDataDir } from "./UserDataDir";

/**
 * Interface to store dev tools settings.
 */
export interface IDevToolsSettings {
    /**
     * Port to use to connect to local devTools.
     * @example 9222
     */
    port: number;

    /**
     * By default, Microsoft Edge is launched with a separate user profile in a temp folder.
     * Use this option to override the path.
     * You can also set to false to launch with your default user profile instead.
     *
     * Values:
     * - `"PATH"` - Use the path specified in the `userDataDir` property.
     * - `undefined` (no value set) - Launch with a temporary user profile.
     */
    userDataDir: UserDataDir;

    /**
     * Set this property to true to use your default browser user profile for debugging. Otherwise, a temporary user profile will be created or the path specified in 'User Data Dir' will be used.
     *
     * Values:
     * - `false` - Launch with the default user profile.
     * - `true` - Launch with a temporary user profile created in the extension.
     */
    useDefaultUserDataProfile: boolean;
}
