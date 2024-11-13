/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { Command } from "../../../CommandRegistry";
import * as vscode from 'vscode';
import { createSite } from "./CreateSiteHelper";
import { NL2SITE_GENERATING_SITE } from "../../PowerPagesChatParticipantConstants";

export class CreateSiteCommand implements Command {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async execute(request: any, stream: vscode.ChatResponseStream): Promise<any> {
        const { prompt, intelligenceAPIEndpointInfo, intelligenceApiToken, powerPagesAgentSessionId, telemetry } = request;

        stream.progress(NL2SITE_GENERATING_SITE);
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const result = await createSite(
                intelligenceAPIEndpointInfo.intelligenceEndpoint,
                intelligenceApiToken,
                prompt,
                powerPagesAgentSessionId,
                stream,
                telemetry
            );
            // Process the result

            return {
                metadata: {
                    command: 'create-site',
                }
            };
        } catch (error) {
            //TODO: Handle error
            return {
                metadata: {
                    command: ''
                }
            };
        }
    }
}
