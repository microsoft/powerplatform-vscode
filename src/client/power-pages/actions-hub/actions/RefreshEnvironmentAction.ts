/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { PacTerminal } from '../../../lib/PacTerminal';
import { traceError, traceInfo } from '../TelemetryHelper';
import { Constants } from '../Constants';
import { extractAuthInfo } from '../../commonUtility';
import { SUCCESS } from '../../../../common/constants';
import PacContext from '../../../pac/PacContext';

export const refreshEnvironment = async (pacTerminal: PacTerminal) => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_REFRESH_ENVIRONMENT_CALLED, { methodName: refreshEnvironment.name });
    const pacWrapper = pacTerminal.getWrapper();
    try {
        const pacActiveAuth = await pacWrapper.activeAuth();
        if (pacActiveAuth && pacActiveAuth.Status === SUCCESS) {
            const authInfo = extractAuthInfo(pacActiveAuth.Results);
            PacContext.setContext(authInfo);
        }
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_REFRESH_FAILED, error as Error, { methodName: refreshEnvironment.name });
    }
}
