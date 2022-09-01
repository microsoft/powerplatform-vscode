/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * Interface to store browser path information for different platforms.
 */
export interface IBrowserPath {
    /**
     * Path to the browser executable in debian linux.
     */
    debianLinux: string;
    /**
     * Path to the browser executable in windows.
     */
    windows: {
        /**
         * Primary browser path.
         */
        primary: string;
        /**
         * Secondary browser path.
         */
        secondary: string;
    };
    /**
     * Path to the browser executable in macOS.
     */
    osx: string;
}
