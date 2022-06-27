/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

/**
 * By default, Microsoft Edge is launched with a separate user profile in a temp folder.
 * Use this option to override the path.
 * You can also set to false to launch with your default user profile instead.
 *
 * Values:
 * - `"PATH"` - Use the path specified in the `userDataDir` property.
 * - `undefined` (no value set) - Launch with a temporary user profile.
 */
export type UserDataDir = string | undefined;
