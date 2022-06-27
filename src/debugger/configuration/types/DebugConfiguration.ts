/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

import { DebugConfiguration as vscodeDebugConfiguration } from "vscode";

/**
 * Reexports the {@link vscodeDebugConfiguration DebugConfiguration} from vscode without the index type.
 */
export type DebugConfiguration = Pick<vscodeDebugConfiguration, "type" | "name" | "request">;
