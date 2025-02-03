/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { ITelemetry } from '../../../common/OneDSLoggerTelemetry/telemetry/ITelemetry';
import { CliAcquisitionContext } from '../../lib/CliAcquisitionContext';
import { expect } from 'chai';
import sinon from 'sinon';

describe('CliAcquisitionContext', () => {
    let context: vscode.ExtensionContext;
    let telemetry: ITelemetry;
    let showInformationMessageSpy: sinon.SinonSpy;
    let showErrorMessageSpy: sinon.SinonSpy;

    beforeEach(() => {
        context = {
            extensionPath: 'testExtensionPath',
            globalStorageUri: {
                fsPath: 'testGlobalStorageUri'
            }
        } as vscode.ExtensionContext;

        telemetry = {} as ITelemetry;

        showInformationMessageSpy = sinon.spy(vscode.window, "showInformationMessage");
        showErrorMessageSpy = sinon.spy(vscode.window, "showErrorMessage");
    });

    afterEach(() => {
        showInformationMessageSpy.restore();
        showErrorMessageSpy.restore();
    });

    it('should return the extension path', () => {
        const cliAcquisitionContext = new CliAcquisitionContext(context, telemetry);

        expect(cliAcquisitionContext.extensionPath).to.equal('testExtensionPath');
    });

    it('should return the global storage local path', () => {
        const cliAcquisitionContext = new CliAcquisitionContext(context, telemetry);

        expect(cliAcquisitionContext.globalStorageLocalPath).to.equal('testGlobalStorageUri');
    });

    it('should return the telemetry', () => {
        const cliAcquisitionContext = new CliAcquisitionContext(context, telemetry);

        expect(cliAcquisitionContext.telemetry).to.equal(telemetry);
    });

    it('should show information message', () => {
        const message = 'testMessage';
        const cliAcquisitionContext = new CliAcquisitionContext(context, telemetry);

        cliAcquisitionContext.showInformationMessage(message);

        const showInformationMessageArgs = showInformationMessageSpy.getCalls()[0].args;

        expect(showInformationMessageArgs[0]).eq("testMessage");
    });

    it('should show error message', () => {
        const message = 'testMessage';
        const cliAcquisitionContext = new CliAcquisitionContext(context, telemetry);

        cliAcquisitionContext.showErrorMessage(message);

        const showErrorMessageArgs = showErrorMessageSpy.getCalls()[0].args;

        expect(showErrorMessageArgs[0]).eq("testMessage");
    });

    it('should show cli preparing message', () => {
        const version = 'testVersion';
        const cliAcquisitionContext = new CliAcquisitionContext(context, telemetry);

        cliAcquisitionContext.showCliPreparingMessage(version);

        const showInformationMessageArgs = showInformationMessageSpy.getCalls()[0].args;

        expect(showInformationMessageArgs[0]).eq("Preparing pac CLI (vtestVersion)...");
    });

    it('should show cli ready message', () => {
        const cliAcquisitionContext = new CliAcquisitionContext(context, telemetry);

        cliAcquisitionContext.showCliReadyMessage();

        const showInformationMessageArgs = showInformationMessageSpy.getCalls()[0].args;

        expect(showInformationMessageArgs[0]).eq("The pac CLI is ready for use in your VS Code terminal!");
    });

    it('should show cli install failed error', () => {
        const err = 'testError';
        const cliAcquisitionContext = new CliAcquisitionContext(context, telemetry);

        cliAcquisitionContext.showCliInstallFailedError(err);

        const showErrorMessageArgs = showErrorMessageSpy.getCalls()[0].args;

        expect(showErrorMessageArgs[0]).eq("Cannot install pac CLI: testError");
    });

    it('should show generator installing message', () => {
        const version = 'testVersion';
        const cliAcquisitionContext = new CliAcquisitionContext(context, telemetry);

        cliAcquisitionContext.showGeneratorInstallingMessage(version);

        const showInformationMessageArgs = showInformationMessageSpy.getCalls()[0].args;

        expect(showInformationMessageArgs[0]).eq("Installing Power Pages generator(vtestVersion)...");
    });

    it('should return loc dotnet not installed or insufficient', () => {
        const cliAcquisitionContext = new CliAcquisitionContext(context, telemetry);

        expect(cliAcquisitionContext.locDotnetNotInstalledOrInsufficient()).eq("dotnet sdk 6.0 or greater must be installed");
    });
});
