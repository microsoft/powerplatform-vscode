/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

/**
 * Remove a '/' from the end of the specified string if it exists.
 * @param uri The string from which to remove the trailing slash (if any).
 * @returns The string without the trailing slash.
 */
export function removeTrailingSlash(uri: string): string {
    return uri.endsWith("/") ? uri.slice(0, -1) : uri;
}

/**
 * Replaces the workspaceFolder placeholder in a specified path, returns the
 * given path with file disk path.
 * @param customPath The path that will be replaced.
 * @returns The path with the workspaceFolder placeholder replaced.
 */
export function replaceWorkSpaceFolderPlaceholder(customPath: string) {
    return customPath.replace("${workspaceFolder}/", "");
}

/**
 * Sleep for the specified number of milliseconds.
 * @param ms The number of milliseconds to sleep.
 * @returns A promise that resolves after the specified number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

