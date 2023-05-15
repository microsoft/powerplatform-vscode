/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ExtensionContext } from "vscode";

function convertSemanticVersionToSystemVersion(version: string) : string {
    // BatchedTelemetry currently only supports System.Version, not semantic versioning, so remove any -labels
    const indx = version.indexOf('-');
    return indx > 0 ? version.substring(0, indx) : version;
}

export function buildAgentString(context: ExtensionContext): string {
    return `${context.extension.packageJSON.name}/${convertSemanticVersionToSystemVersion(context.extension.packageJSON.version)}`;
}
