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

export const AGENTIC_CREATE_LOCAL_TRIGGER_COMMAND =
    "microsoft.powerplatform.agenticCreate.testLocal";

/**
 * Builds a secret-free Studio-shaped URI for local Extension Development Host testing.
 */
export function buildLocalAgenticCreateUri(now: number = Date.now()): vscode.Uri {
    const query = new URLSearchParams({
        [URI_CONSTANTS.PARAMETERS.ENV_ID]: "local-test-environment",
        [URI_CONSTANTS.PARAMETERS.ORG_URL]: "https://local-test.crm.dynamics.com",
        [URI_CONSTANTS.PARAMETERS.REFERRER_SESSION_ID]: `local-${now}`,
        [URI_CONSTANTS.PARAMETERS.SOURCE]: URI_CONSTANTS.SOURCE_VALUES.STUDIO,
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
     * Runs the real Agentic Create flow while bypassing only the ECS gate.
     */
    public triggerLocalTest(): Promise<void> {
        return this.agenticCreateHandler.handle(
            buildLocalAgenticCreateUri(),
            { bypassFeatureGate: true }
        );
    }
}
