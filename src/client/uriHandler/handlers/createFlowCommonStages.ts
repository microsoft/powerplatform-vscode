/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { PacWrapper } from "../../pac/PacWrapper";
import { emitCreateFlowError, emitCreateFlowEvent } from "../telemetry/createFlowTelemetry";
import { uriHandlerTelemetryEventNames } from "../telemetry/uriHandlerTelemetryEvents";
import { AuthEnvironmentService, AuthEnvironmentTarget } from "../utils/authEnvironment";
import { isCreateFlowCancellation } from "../utils/createFlowErrors";
import { selectTargetFolder } from "../utils/selectTargetFolder";
import { URI_HANDLER_STRINGS } from "../constants/uriStrings";
import { CreateFlowParameters } from "./createFlowParams";

/**
 * Create-flow channel that is running the common stages.
 */
export type CreateFlowChannel = 'pac' | 'agent';

/**
 * Injectable dependencies for the common create-flow stages.
 */
export interface CreateFlowCommonStagesDependencies {
    createAuthEnvironmentService: (pacWrapper: PacWrapper) => AuthEnvironmentService;
    selectTargetFolder: typeof selectTargetFolder;
    emitCreateFlowEvent: typeof emitCreateFlowEvent;
    emitCreateFlowError: typeof emitCreateFlowError;
    showErrorMessage: (message: string) => Thenable<string | undefined>;
}

const DEFAULT_DEPENDENCIES: CreateFlowCommonStagesDependencies = {
    createAuthEnvironmentService: (pacWrapper) => new AuthEnvironmentService(pacWrapper),
    selectTargetFolder,
    emitCreateFlowEvent,
    emitCreateFlowError,
    showErrorMessage: (message) => vscode.window.showErrorMessage(message)
};

/**
 * Runs the authentication and environment stages shared by create flows.
 * @param params Parsed create-flow parameters.
 * @param channel Create-flow channel requesting the shared stages.
 * @param telemetryData Redacted telemetry passed to the authentication/environment service.
 * @param pacWrapper PAC CLI wrapper used by the authentication/environment service.
 * @param dependencies Injectable dependencies used by integration tests.
 * @returns Whether selection stages may proceed.
 */
export const prepareCreateFlowAuthenticationAndEnvironment = async (
    params: CreateFlowParameters,
    channel: CreateFlowChannel,
    telemetryData: Record<string, string>,
    pacWrapper: PacWrapper,
    dependencies: CreateFlowCommonStagesDependencies = DEFAULT_DEPENDENCIES
): Promise<boolean> => {
    dependencies.emitCreateFlowEvent(
        uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_AUTH_STARTED,
        params,
        channel
    );

    const target: AuthEnvironmentTarget = {
        environmentId: params.environmentId,
        orgUrl: params.orgUrl
    };

    try {
        const authEnvironmentService = dependencies.createAuthEnvironmentService(pacWrapper);
        await authEnvironmentService.prepareAuthenticationAndEnvironment(target, telemetryData);
    } catch (error) {
        dependencies.emitCreateFlowError(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_AUTH_FAILED,
            'Create flow authentication and environment preparation failed',
            error,
            params,
            channel
        );
        dependencies.emitCreateFlowEvent(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED,
            params,
            channel
        );

        // A declined prompt already showed its own notification, so only genuine failures are
        // reported here. Without this the flow ends in silence and looks like nothing happened.
        // The notification is deliberately not awaited so the caller is not held open until the
        // user dismisses it.
        if (!isCreateFlowCancellation(error)) {
            const reason = error instanceof Error ? error.message : String(error);
            void dependencies.showErrorMessage(
                URI_HANDLER_STRINGS.ERRORS.CREATE_FLOW_FAILED.replace('{0}', reason)
            );
        }

        return false;
    }

    dependencies.emitCreateFlowEvent(
        uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_AUTH_COMPLETED,
        params,
        channel
    );
    dependencies.emitCreateFlowEvent(
        uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_ENVIRONMENT_SET,
        params,
        channel
    );
    return true;
};

/**
 * Runs authentication, environment, and standalone target-folder selection.
 * @param params Parsed create-flow parameters.
 * @param channel Create-flow channel requesting the shared stages.
 * @param telemetryData Redacted telemetry passed to the authentication/environment service.
 * @param pacWrapper PAC CLI wrapper used by the authentication/environment service.
 * @param dependencies Injectable dependencies used by integration tests.
 * @returns The selected target folder, or undefined when the flow has already been dropped.
 */
export const runCreateFlowCommonStages = async (
    params: CreateFlowParameters,
    channel: CreateFlowChannel,
    telemetryData: Record<string, string>,
    pacWrapper: PacWrapper,
    dependencies: CreateFlowCommonStagesDependencies = DEFAULT_DEPENDENCIES
): Promise<vscode.Uri | undefined> => {
    const prepared = await prepareCreateFlowAuthenticationAndEnvironment(
        params,
        channel,
        telemetryData,
        pacWrapper,
        dependencies
    );
    if (!prepared) {
        return undefined;
    }

    const folderUri = await dependencies.selectTargetFolder();
    if (!folderUri) {
        dependencies.emitCreateFlowEvent(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FOLDER_CANCELLED,
            params,
            channel
        );
        dependencies.emitCreateFlowEvent(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED,
            params,
            channel
        );
        return undefined;
    }

    dependencies.emitCreateFlowEvent(
        uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FOLDER_SELECTED,
        params,
        channel
    );
    return folderUri;
};
