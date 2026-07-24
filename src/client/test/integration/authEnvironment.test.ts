/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { AuthEnvironmentService } from "../../uriHandler/utils/authEnvironment";
import { UriParameters } from "../../uriHandler/utils/uriHandlerUtils";
import { PacWrapper } from "../../pac/PacWrapper";

type ProgressReporter = vscode.Progress<{ message?: string; increment?: number }>;
type ProgressTask = (progress: ProgressReporter, token: vscode.CancellationToken) => Thenable<void>;

// Minimal stubbed surface of PacWrapper that the service depends on.
interface PacWrapperStub {
    activeOrg: sinon.SinonStub;
    orgSelect: sinon.SinonStub;
    authCreateNewAuthProfileForOrg: sinon.SinonStub;
    resetPacProcess: sinon.SinonStub;
}

describe("AuthEnvironmentService", () => {
    let sandbox: sinon.SinonSandbox;
    let pacWrapperStub: PacWrapperStub;
    let service: AuthEnvironmentService;
    let warningStub: sinon.SinonStub;

    const uriParams = {
        environmentId: "env-1",
        orgUrl: "https://org.crm.dynamics.com/"
    } as unknown as UriParameters;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        pacWrapperStub = {
            activeOrg: sandbox.stub(),
            orgSelect: sandbox.stub().resolves(),
            authCreateNewAuthProfileForOrg: sandbox.stub().resolves(),
            resetPacProcess: sandbox.stub().resolves()
        };

        // Run the progress task immediately with a no-op reporter.
        sandbox.stub(vscode.window, "withProgress").callsFake(
            ((_options: vscode.ProgressOptions, task: ProgressTask): Thenable<void> =>
                task({ report: () => undefined }, new vscode.CancellationTokenSource().token)
            ) as unknown as typeof vscode.window.withProgress
        );

        warningStub = sandbox.stub(vscode.window, "showWarningMessage");
        sandbox.stub(vscode.window, "showInformationMessage");

        service = new AuthEnvironmentService(pacWrapperStub as unknown as PacWrapper);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("does not prompt when already authenticated to the requested environment", async () => {
        pacWrapperStub.activeOrg.resolves({
            Status: "Success",
            Results: { EnvironmentId: "env-1" }
        });

        await service.prepareAuthenticationAndEnvironment(uriParams, {});

        expect(warningStub.called).to.be.false;
        expect(pacWrapperStub.orgSelect.called).to.be.false;
        expect(pacWrapperStub.authCreateNewAuthProfileForOrg.called).to.be.false;
    });

    it("switches environment when the active org points at a different environment", async () => {
        pacWrapperStub.activeOrg
            .onFirstCall().resolves({ Status: "Success", Results: { EnvironmentId: "env-1" } })
            .onSecondCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onThirdCall().resolves({ Status: "Success", Results: { EnvironmentId: "env-1" } });
        warningStub.resolves("Yes");

        await service.prepareAuthenticationAndEnvironment(uriParams, {});

        expect(pacWrapperStub.orgSelect.calledOnceWith("https://org.crm.dynamics.com/")).to.be.true;
    });

    it("resetPacProcessSafely swallows reset errors", async () => {
        pacWrapperStub.resetPacProcess.rejects(new Error("reset boom"));

        await service.resetPacProcessSafely({});

        expect(pacWrapperStub.resetPacProcess.calledOnce).to.be.true;
    });

    it("resetPacProcessAndThrow resets and rethrows the original error", async () => {
        const original = new Error("boom");
        let thrown: unknown;

        try {
            await service.resetPacProcessAndThrow(original, {}, "message", "error_type");
        } catch (error) {
            thrown = error;
        }

        expect(thrown).to.equal(original);
        expect(pacWrapperStub.resetPacProcess.calledOnce).to.be.true;
    });
});
