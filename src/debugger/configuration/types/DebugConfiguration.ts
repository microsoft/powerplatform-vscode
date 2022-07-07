/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { DebugConfiguration as vscodeDebugConfiguration } from "vscode";

/**
 * Reexports the {@link vscodeDebugConfiguration DebugConfiguration} from vscode without the index type.
 */
export type DebugConfiguration = Pick<vscodeDebugConfiguration, "type" | "name" | "request">;
