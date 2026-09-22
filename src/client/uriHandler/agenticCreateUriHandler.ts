/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { PacWrapper } from "../pac/PacWrapper";
import { URI_CONSTANTS, UriPath } from "./constants/uriConstants";
import { AgenticCreateHandler } from "./handlers/agenticCreateHandler";
import { UriHandler } from "./uriHandler";
import { ResumeMarkerStore } from "./utils/resumeMarker";

export const AGENTIC_CREATE_COMMAND =
    "microsoft.powerplatform.agenticCreate";
export const AGENTIC_CREATE_COMMAND_ENABLED_CONTEXT =
    "powerPlatform.agenticCreate.commandEnabled";

/**
 * Builds the secret-free URI contract used by the Agentic Create command.
 */
export function buildAgenticCreateCommandUri(now: number = Date.now()): vscode.Uri {
    const query = new URLSearchParams({
        [URI_CONSTANTS.PARAMETERS.REFERRER_SESSION_ID]: `command-${now}`,
        [URI_CONSTANTS.PARAMETERS.SOURCE]:
            URI_CONSTANTS.SOURCE_VALUES.COMMAND_PALETTE,
        [URI_CONSTANTS.PARAMETERS.VERSION]: URI_CONSTANTS.CONTRACT_VERSION.CURRENT
    });
    return vscode.Uri.parse(
        `vscode://${URI_CONSTANTS.EXTENSION_ID}${UriPath.AgenticCreate}?${query.toString()}`
    );
}

/**
 * Handles Agentic Create before PAC initialization, then delegates all URI routes to the existing
 * PAC-backed handler after the wrapper becomes available.
 */
export class AgenticCreateUriHandler implements vscode.UriHandler {
    private readonly agenticCreateHandler: AgenticCreateHandler;
    private readonly resumeMarkerStore: ResumeMarkerStore;
    private delegate?: UriHandler;

    constructor(resumeMarkerStore: ResumeMarkerStore) {
        this.resumeMarkerStore = resumeMarkerStore;
        this.agenticCreateHandler = new AgenticCreateHandler(resumeMarkerStore);
    }

    /**
     * Enables the existing PAC-backed URI routes without changing their initialization behavior.
     */
    public initializePacWrapper(pacWrapper: PacWrapper): void {
        if (!this.delegate) {
            this.delegate = new UriHandler(pacWrapper, this.resumeMarkerStore);
        }
    }

    public async handleUri(uri: vscode.Uri): Promise<void> {
        if (this.delegate) {
            await this.delegate.handleUri(uri);
        } else if (uri.path === UriPath.AgenticCreate) {
            await this.agenticCreateHandler.handle(uri);
        }
    }

    /**
     * Runs the Agentic Create command through the same handler as the URI route.
     */
    public triggerCommand(): Promise<void> {
        return this.agenticCreateHandler.handle(
            buildAgenticCreateCommandUri()
        );
    }
}
