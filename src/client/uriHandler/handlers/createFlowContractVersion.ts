/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { URI_CONSTANTS } from "../constants/uriConstants";

/**
 * Determines whether a create-flow contract version can be handled by this extension.
 * Missing and empty versions remain supported for backward compatibility.
 * @param version Contract version parsed from the deep link.
 * @returns Whether the create flow may proceed.
 */
export function isSupportedContractVersion(version: string | null): boolean {
    if (!version) {
        return true;
    }

    return URI_CONSTANTS.CONTRACT_VERSION.SUPPORTED.some(
        (supportedVersion) => supportedVersion === version
    );
}
