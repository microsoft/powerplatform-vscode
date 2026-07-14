/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as path from "path";

/**
 * Result of validating the `filePath` query parameter of a
 * `/metadataDiffImport` URI.
 *
 * Kept free of any `vscode` dependency so the validation logic can be
 * exercised by the plain-mocha unit test runner (which cannot load the
 * `vscode` runtime module).
 */
export type MetadataDiffImportPathResult =
    | { ok: true; filePath: string }
    | { ok: false; reason: "missing" | "invalid" };

/**
 * Validates and decodes the `filePath` supplied on a metadata diff import URI.
 *
 * Defense-in-depth: only absolute paths without `..` segments are accepted.
 * Relative paths and path-traversal attempts are rejected. The user is
 * implicitly trusting whoever generated the URL — but we shouldn't make path
 * tricks easy.
 *
 * @param rawFilePath The raw, still-encoded value of the `filePath` query parameter.
 * @returns `{ ok: true, filePath }` with the decoded absolute path, or
 *          `{ ok: false, reason }` describing why it was rejected.
 */
export function resolveMetadataDiffImportFilePath(
    rawFilePath: string | null | undefined
): MetadataDiffImportPathResult {
    if (!rawFilePath) {
        return { ok: false, reason: "missing" };
    }

    const decoded = decodeURIComponent(rawFilePath);
    if (!path.isAbsolute(decoded) || decoded.includes("..")) {
        return { ok: false, reason: "invalid" };
    }

    return { ok: true, filePath: decoded };
}
