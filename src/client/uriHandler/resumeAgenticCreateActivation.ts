/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { PacWrapper } from '../pac/PacWrapper';
import { URI_HANDLER_STRINGS } from './constants/uriStrings';
import { AgenticCreateHandler } from './handlers/agenticCreateHandler';
import {
    buildCreateFlowTelemetry,
    CreateFlowParameters
} from './handlers/createFlowParams';
import { runCreateFlowCommonStages } from './handlers/createFlowCommonStages';
import { emitCreateFlowEvent } from './telemetry/createFlowTelemetry';
import { AgentHost, detectAgentHost } from './utils/detectAgentHost';
import {
    resumeAgenticCreate,
    ResumeAgenticCreateStrings
} from './utils/resumeAgenticCreate';
import {
    clearResumeMarker,
    ResumeMarkerStore
} from './utils/resumeMarker';
import { confirmAndLaunchSelectedAgentHost } from './utils/agenticCreateLaunch';

const RESUME_STRINGS: ResumeAgenticCreateStrings = {
    resumePrompt: URI_HANDLER_STRINGS.PROMPTS.AGENT_HOST_INSTALL_RESUME,
    resume: URI_HANDLER_STRINGS.BUTTONS.RESUME,
    notNow: URI_HANDLER_STRINGS.BUTTONS.NOT_NOW,
    hostDisplayNames: {
        [AgentHost.Copilot]: URI_HANDLER_STRINGS.AGENT_HOSTS.COPILOT,
        [AgentHost.Claude]: URI_HANDLER_STRINGS.AGENT_HOSTS.CLAUDE
    }
};

/**
 * Checks for and resumes an agentic-create flow during desktop-extension activation.
 * @param store VS Code global state containing a possible resume marker.
 * @param pacWrapper PAC CLI wrapper used by the shared create-flow stages.
 */
export async function resumeAgenticCreateOnActivation(
    store: ResumeMarkerStore,
    pacWrapper: PacWrapper
): Promise<void> {
    try {
        await resumeAgenticCreate({
            store,
            strings: RESUME_STRINGS,
            isEnabled: AgenticCreateHandler.isEnabled,
            detectHost: detectAgentHost,
            now: Date.now,
            showInformationMessage: (message, ...buttons) =>
                vscode.window.showInformationMessage(message, ...buttons),
            emitEvent: emitCreateFlowEvent,
            runStages: async (params: CreateFlowParameters, host: AgentHost) => {
                const folderUri = await runCreateFlowCommonStages(
                    params,
                    'agent',
                    buildCreateFlowTelemetry(params),
                    pacWrapper
                );
                if (!folderUri) {
                    return;
                }

                await confirmAndLaunchSelectedAgentHost(host, folderUri, params);
            },
            clearMarker: clearResumeMarker
        });
    } catch (error) {
        console.error('Failed to resume agentic create after reload.', error);
        try {
            await clearResumeMarker(store);
        } catch (clearError) {
            console.error('Failed to clear the agentic create resume marker.', clearError);
        }
    }
}
