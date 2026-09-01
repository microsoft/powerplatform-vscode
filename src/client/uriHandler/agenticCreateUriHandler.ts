/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { PacWrapper } from "../pac/PacWrapper";
import { UriPath } from "./constants/uriConstants";
import { AgenticCreateHandler } from "./handlers/agenticCreateHandler";
import { UriHandler } from "./uriHandler";
import { ResumeMarkerStore } from "./utils/resumeMarker";

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
}
