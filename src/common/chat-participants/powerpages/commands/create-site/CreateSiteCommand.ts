/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { Command } from "../../../CommandRegistry";
import * as vscode from 'vscode';
import { createSite } from "./CreateSiteHelper";
import { FAILED_TO_CREATE_SITE, NL2SITE_GENERATING_SITE } from "../../PowerPagesChatParticipantConstants";
import { oneDSLoggerWrapper } from "../../../../OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { VSCODE_EXTENSION_CREATE_SITE_COMMAND_FAILED} from "../../PowerPagesChatParticipantTelemetryConstants";

export class CreateSiteCommand implements Command {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async execute(request: any, stream: vscode.ChatResponseStream): Promise<any> {
        const { prompt, intelligenceAPIEndpointInfo, intelligenceApiToken, powerPagesAgentSessionId, telemetry, orgId, envId, userId, extensionContext } = request;

        stream.progress(NL2SITE_GENERATING_SITE);
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const result = await createSite(
                intelligenceAPIEndpointInfo.intelligenceEndpoint,
                intelligenceApiToken,
                prompt,
                powerPagesAgentSessionId,
                stream,
                telemetry,
                orgId,
                envId,
                userId,
                extensionContext
            );
            // Process the result

            return {
                metadata: {
                    command: 'create-site',
                }
            };
        } catch (error) {
            stream.markdown(FAILED_TO_CREATE_SITE);
            telemetry.sendTelemetryEvent(VSCODE_EXTENSION_CREATE_SITE_COMMAND_FAILED, { sessionId: powerPagesAgentSessionId, orgId:orgId, envId: envId, userId: userId, error: error as string });
            oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_CREATE_SITE_COMMAND_FAILED, error as string, error as Error, { sessionId: powerPagesAgentSessionId, orgId:orgId, envId: envId, userId: userId}, {});
            return {
                metadata: {
                    command: ''
                }
            };
        }
    }
}
