/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { AuthEnvironmentService } from "../../uriHandler/utils/authEnvironment";
import { UriParameters } from "../../uriHandler/utils/uriHandlerUtils";
import { CreateFlowParameters } from "../../uriHandler/handlers/createFlowParams";
import { PacWrapper } from "../../pac/PacWrapper";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { URI_HANDLER_STRINGS } from "../../uriHandler/constants/uriStrings";
import { CreateFlowCancellationError } from "../../uriHandler/utils/createFlowErrors";

type ProgressReporter = vscode.Progress<{ message?: string; increment?: number }>;
type ProgressTask = (progress: ProgressReporter, token: vscode.CancellationToken) => Thenable<void>;

// Minimal stubbed surface of PacWrapper that the service depends on.
interface PacWrapperStub {
    activeOrg: sinon.SinonStub;
    orgSelect: sinon.SinonStub;
    authCreateNewAuthProfileForOrg: sinon.SinonStub;
    authList: sinon.SinonStub;
    authSelectByIndex: sinon.SinonStub;
    resetPacProcess: sinon.SinonStub;
}

describe("AuthEnvironmentService", () => {
    let sandbox: sinon.SinonSandbox;
    let pacWrapperStub: PacWrapperStub;
    let service: AuthEnvironmentService;
    let warningStub: sinon.SinonStub;

    const OPEN_URI_PARAMS: UriParameters = {
        websiteId: "site-1",
        environmentId: "env-1",
        orgUrl: "https://org.crm.dynamics.com/",
        schema: null,
        siteName: null,
        siteUrl: null,
        modelVersion: 1
    };
    const CREATE_FLOW_PARAMS: CreateFlowParameters = {
        environmentId: "env-1",
        orgUrl: "https://org.crm.dynamics.com/",
        region: null,
        tenantId: null,
        websiteId: null,
        source: null,
        agentHost: null,
        version: null,
        correlationId: null
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        // The OneDS logger is never instantiated in the integration test host, so
        // `oneDSLoggerWrapper.getLogger()` would return undefined and any telemetry
        // call inside the service would throw. Stub it with a no-op logger.
        sandbox.stub(oneDSLoggerWrapper, "getLogger").returns({
            traceInfo: sandbox.stub(),
            traceWarning: sandbox.stub(),
            traceError: sandbox.stub(),
            featureUsage: sandbox.stub()
        } as unknown as ReturnType<typeof oneDSLoggerWrapper.getLogger>);

        pacWrapperStub = {
            activeOrg: sandbox.stub(),
            orgSelect: sandbox.stub().resolves(),
            authCreateNewAuthProfileForOrg: sandbox.stub().resolves(),
            // Default to no reusable profiles so tests opt in to the profile-reuse path.
            authList: sandbox.stub().resolves({ Status: "Success", Results: [], Errors: [], Information: [] }),
            authSelectByIndex: sandbox.stub().resolves({ Status: "Success", Errors: [], Information: [] }),
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

        await service.prepareAuthenticationAndEnvironment(OPEN_URI_PARAMS, {});

        expect(warningStub.called).to.be.false;
        expect(pacWrapperStub.orgSelect.called).to.be.false;
        expect(pacWrapperStub.authCreateNewAuthProfileForOrg.called).to.be.false;
    });

    it("authenticates when passed create-flow parameters", async () => {
        pacWrapperStub.activeOrg
            .onFirstCall().resolves({ Status: "Failure" })
            .onSecondCall().resolves({ Status: "Success", Results: { EnvironmentId: "env-1" } })
            .onThirdCall().resolves({ Status: "Success", Results: { EnvironmentId: "env-1" } });
        warningStub.resolves("Yes");

        await service.prepareAuthenticationAndEnvironment(CREATE_FLOW_PARAMS, {});

        expect(pacWrapperStub.authCreateNewAuthProfileForOrg.calledOnceWith("https://org.crm.dynamics.com/")).to.be.true;
        expect(pacWrapperStub.orgSelect.called).to.be.false;
    });

    it("rejects create-flow parameters without an environment ID", async () => {
        const incompleteParams: CreateFlowParameters = {
            ...CREATE_FLOW_PARAMS,
            environmentId: null
        };

        let thrown: unknown;
        try {
            await service.prepareAuthenticationAndEnvironment(incompleteParams, {});
        } catch (error) {
            thrown = error;
        }

        expect(thrown).to.be.an("error").with.property("message", URI_HANDLER_STRINGS.ERRORS.ENVIRONMENT_ID_REQUIRED);
        expect(pacWrapperStub.activeOrg.called).to.be.false;
    });

    it("rejects create-flow parameters without an organization URL", async () => {
        const incompleteParams: CreateFlowParameters = {
            ...CREATE_FLOW_PARAMS,
            orgUrl: null
        };

        let thrown: unknown;
        try {
            await service.prepareAuthenticationAndEnvironment(incompleteParams, {});
        } catch (error) {
            thrown = error;
        }

        expect(thrown).to.be.an("error").with.property("message", URI_HANDLER_STRINGS.ERRORS.ORG_URL_REQUIRED);
        expect(pacWrapperStub.activeOrg.called).to.be.false;
    });

    it("switches environment when the active org points at a different environment", async () => {
        pacWrapperStub.activeOrg
            .onFirstCall().resolves({ Status: "Success", Results: { EnvironmentId: "env-1" } })
            .onSecondCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onThirdCall().resolves({ Status: "Success", Results: { EnvironmentId: "env-1" } });
        warningStub.resolves("Yes");

        await service.prepareAuthenticationAndEnvironment(OPEN_URI_PARAMS, {});

        expect(pacWrapperStub.orgSelect.calledOnceWith("https://org.crm.dynamics.com/")).to.be.true;
    });

    it("does not prompt when the environment id casing differs", async () => {
        pacWrapperStub.activeOrg.resolves({
            Status: "Success",
            Results: { EnvironmentId: "ENV-1" }
        });

        await service.prepareAuthenticationAndEnvironment(OPEN_URI_PARAMS, {});

        expect(warningStub.called).to.be.false;
        expect(pacWrapperStub.orgSelect.called).to.be.false;
    });

    it("includes the PAC CLI error text when the environment switch fails", async () => {
        const pacError = "No Dataverse organization was found matching the specified criteria.";
        pacWrapperStub.activeOrg
            .onFirstCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onSecondCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } });
        pacWrapperStub.orgSelect.resolves({ Status: "Failure", Errors: [pacError], Information: [] });
        // Accept the environment switch, then decline the follow-up sign-in recovery.
        warningStub.onFirstCall().resolves("Yes").onSecondCall().resolves(undefined);

        let thrown: unknown;
        try {
            await service.prepareAuthenticationAndEnvironment(OPEN_URI_PARAMS, {});
        } catch (error) {
            thrown = error;
        }

        expect(thrown).to.be.an("error");
        expect((thrown as Error).message).to.contain(pacError);
        expect((thrown as Error).message).to.contain(URI_HANDLER_STRINGS.ERRORS.ENV_SWITCH_FAILED);
        expect(pacWrapperStub.authCreateNewAuthProfileForOrg.called).to.be.false;
        expect(pacWrapperStub.orgSelect.calledOnce).to.be.true;
    });

    it("signs in to the target org and retries when the first environment switch fails", async () => {
        pacWrapperStub.activeOrg
            .onFirstCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onSecondCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onThirdCall().resolves({ Status: "Success", Results: { EnvironmentId: "env-1" } });
        pacWrapperStub.orgSelect
            .onFirstCall().resolves({ Status: "Failure", Errors: ["no matching org"], Information: [] })
            .onSecondCall().resolves({ Status: "Success", Errors: [], Information: [] });
        warningStub.resolves("Yes");

        await service.prepareAuthenticationAndEnvironment(OPEN_URI_PARAMS, {});

        expect(pacWrapperStub.authCreateNewAuthProfileForOrg.calledOnceWith("https://org.crm.dynamics.com/")).to.be.true;
        expect(pacWrapperStub.orgSelect.calledTwice).to.be.true;
        expect(pacWrapperStub.resetPacProcess.called).to.be.false;
    });

    it("surfaces the sign-in failure when the recovery auth profile cannot be created", async () => {
        const authError = "Authentication was cancelled by the user.";
        pacWrapperStub.activeOrg
            .onFirstCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onSecondCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } });
        pacWrapperStub.orgSelect.resolves({ Status: "Failure", Errors: ["no matching org"], Information: [] });
        pacWrapperStub.authCreateNewAuthProfileForOrg.resolves({ Status: "Failure", Errors: [authError], Information: [] });
        warningStub.resolves("Yes");

        let thrown: unknown;
        try {
            await service.prepareAuthenticationAndEnvironment(OPEN_URI_PARAMS, {});
        } catch (error) {
            thrown = error;
        }

        expect(thrown).to.be.an("error");
        expect((thrown as Error).message).to.contain(authError);
        // The retry must not run once the sign-in itself failed.
        expect(pacWrapperStub.orgSelect.calledOnce).to.be.true;
    });

    it("does not offer a sign-in recovery when the environment switch succeeds", async () => {
        pacWrapperStub.activeOrg
            .onFirstCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onSecondCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onThirdCall().resolves({ Status: "Success", Results: { EnvironmentId: "env-1" } });
        warningStub.resolves("Yes");

        await service.prepareAuthenticationAndEnvironment(OPEN_URI_PARAMS, {});

        expect(warningStub.calledOnce).to.be.true;
        expect(pacWrapperStub.authCreateNewAuthProfileForOrg.called).to.be.false;
    });

    it("does not offer a sign-in recovery when the org URL resolves to a different environment", async () => {
        // orgSelect succeeds, but the URL maps to an environment the link did not ask for:
        // the link's own parameters disagree, so signing in again cannot reconcile them.
        pacWrapperStub.activeOrg
            .onFirstCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onSecondCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onThirdCall().resolves({ Status: "Success", Results: { EnvironmentId: "unexpected-env" } });
        warningStub.resolves("Yes");

        let thrown: unknown;
        try {
            await service.prepareAuthenticationAndEnvironment(OPEN_URI_PARAMS, {});
        } catch (error) {
            thrown = error;
        }

        expect(thrown).to.be.an("error");
        expect((thrown as Error).message).to.contain("unexpected-env");
        expect((thrown as Error).message).to.contain("env-1");
        expect(pacWrapperStub.authCreateNewAuthProfileForOrg.called).to.be.false;
        expect(warningStub.calledOnce).to.be.true;
    });

    it("reuses a stored auth profile that already points at the target environment", async () => {
        pacWrapperStub.activeOrg
            .onFirstCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onSecondCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onThirdCall().resolves({ Status: "Success", Results: { EnvironmentId: "env-1" } });
        pacWrapperStub.orgSelect
            .onFirstCall().resolves({ Status: "Failure", Errors: ["no matching org"], Information: [] })
            .onSecondCall().resolves({ Status: "Success", Errors: [], Information: [] });
        pacWrapperStub.authList.resolves({
            Status: "Success",
            Errors: [],
            Information: [],
            Results: [
                { Index: 1, IsActive: true, ActiveOrganization: { Item1: "Other", Item2: "https://other.crm.dynamics.com/", Item3: "other-env" } },
                { Index: 2, IsActive: false, ActiveOrganization: { Item1: "Target", Item2: "https://target.crm.dynamics.com/", Item3: "env-1" } }
            ]
        });
        warningStub.resolves("Yes");

        await service.prepareAuthenticationAndEnvironment(OPEN_URI_PARAMS, {});

        expect(pacWrapperStub.authSelectByIndex.calledOnceWith(2)).to.be.true;
        // The stored profile made a browser sign-in unnecessary.
        expect(pacWrapperStub.authCreateNewAuthProfileForOrg.called).to.be.false;
        expect(warningStub.calledOnce).to.be.true;
    });

    it("matches a stored auth profile on the org URL when the trailing slash differs", async () => {
        pacWrapperStub.activeOrg
            .onFirstCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onSecondCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onThirdCall().resolves({ Status: "Success", Results: { EnvironmentId: "env-1" } });
        pacWrapperStub.orgSelect
            .onFirstCall().resolves({ Status: "Failure", Errors: ["no matching org"], Information: [] })
            .onSecondCall().resolves({ Status: "Success", Errors: [], Information: [] });
        pacWrapperStub.authList.resolves({
            Status: "Success",
            Errors: [],
            Information: [],
            Results: [
                // Same organization as the link, recorded without the trailing slash and in mixed case.
                { Index: 4, IsActive: false, ActiveOrganization: { Item1: "Target", Item2: "https://ORG.crm.dynamics.com", Item3: "unrelated-env" } }
            ]
        });
        warningStub.resolves("Yes");

        await service.prepareAuthenticationAndEnvironment(OPEN_URI_PARAMS, {});

        expect(pacWrapperStub.authSelectByIndex.calledOnceWith(4)).to.be.true;
        expect(pacWrapperStub.authCreateNewAuthProfileForOrg.called).to.be.false;
    });

    it("falls back to signing in when no stored auth profile matches the target", async () => {
        pacWrapperStub.activeOrg
            .onFirstCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onSecondCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onThirdCall().resolves({ Status: "Success", Results: { EnvironmentId: "env-1" } });
        pacWrapperStub.orgSelect
            .onFirstCall().resolves({ Status: "Failure", Errors: ["no matching org"], Information: [] })
            .onSecondCall().resolves({ Status: "Success", Errors: [], Information: [] });
        pacWrapperStub.authList.resolves({
            Status: "Success",
            Errors: [],
            Information: [],
            Results: [
                { Index: 1, IsActive: false, ActiveOrganization: { Item1: "Other", Item2: "https://other.crm.dynamics.com/", Item3: "unrelated-env" } }
            ]
        });
        warningStub.resolves("Yes");

        await service.prepareAuthenticationAndEnvironment(OPEN_URI_PARAMS, {});

        expect(pacWrapperStub.authSelectByIndex.called).to.be.false;
        expect(pacWrapperStub.authCreateNewAuthProfileForOrg.calledOnce).to.be.true;
    });

    it("restores the previous auth profile when the reused one does not reach the target", async () => {
        pacWrapperStub.activeOrg
            .onFirstCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onSecondCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onThirdCall().resolves({ Status: "Success", Results: { EnvironmentId: "env-1" } });
        pacWrapperStub.orgSelect
            .onFirstCall().resolves({ Status: "Failure", Errors: ["no matching org"], Information: [] })
            .onSecondCall().resolves({ Status: "Failure", Errors: ["still no matching org"], Information: [] })
            .onThirdCall().resolves({ Status: "Success", Errors: [], Information: [] });
        pacWrapperStub.authList.resolves({
            Status: "Success",
            Errors: [],
            Information: [],
            Results: [
                { Index: 1, IsActive: true, ActiveOrganization: { Item1: "Other", Item2: "https://other.crm.dynamics.com/", Item3: "other-env" } },
                { Index: 2, IsActive: false, ActiveOrganization: { Item1: "Stale", Item2: "https://org.crm.dynamics.com/", Item3: "env-1" } }
            ]
        });
        warningStub.resolves("Yes");

        await service.prepareAuthenticationAndEnvironment(OPEN_URI_PARAMS, {});

        expect(pacWrapperStub.authSelectByIndex.calledTwice).to.be.true;
        expect(pacWrapperStub.authSelectByIndex.firstCall.args[0]).to.equal(2);
        // The speculative switch is rolled back so the user keeps the profile they started on.
        expect(pacWrapperStub.authSelectByIndex.secondCall.args[0]).to.equal(1);
        expect(pacWrapperStub.authCreateNewAuthProfileForOrg.calledOnce).to.be.true;
    });

    it("falls back to signing in when listing auth profiles fails", async () => {
        pacWrapperStub.activeOrg
            .onFirstCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onSecondCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onThirdCall().resolves({ Status: "Success", Results: { EnvironmentId: "env-1" } });
        pacWrapperStub.orgSelect
            .onFirstCall().resolves({ Status: "Failure", Errors: ["no matching org"], Information: [] })
            .onSecondCall().resolves({ Status: "Success", Errors: [], Information: [] });
        pacWrapperStub.authList.rejects(new Error("auth list boom"));
        warningStub.resolves("Yes");

        await service.prepareAuthenticationAndEnvironment(OPEN_URI_PARAMS, {});

        expect(pacWrapperStub.authCreateNewAuthProfileForOrg.calledOnce).to.be.true;
    });

    it("never reuses the active auth profile, which is the one that just failed", async () => {
        pacWrapperStub.activeOrg
            .onFirstCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onSecondCall().resolves({ Status: "Success", Results: { EnvironmentId: "other-env" } })
            .onThirdCall().resolves({ Status: "Success", Results: { EnvironmentId: "env-1" } });
        pacWrapperStub.orgSelect
            .onFirstCall().resolves({ Status: "Failure", Errors: ["no matching org"], Information: [] })
            .onSecondCall().resolves({ Status: "Success", Errors: [], Information: [] });
        pacWrapperStub.authList.resolves({
            Status: "Success",
            Errors: [],
            Information: [],
            Results: [
                { Index: 1, IsActive: true, ActiveOrganization: { Item1: "Target", Item2: "https://org.crm.dynamics.com/", Item3: "env-1" } }
            ]
        });
        warningStub.resolves("Yes");

        await service.prepareAuthenticationAndEnvironment(OPEN_URI_PARAMS, {});

        expect(pacWrapperStub.authSelectByIndex.called).to.be.false;
        expect(pacWrapperStub.authCreateNewAuthProfileForOrg.calledOnce).to.be.true;
    });

    it("reports a cancellation when the user declines the environment switch", async () => {
        pacWrapperStub.activeOrg.resolves({
            Status: "Success",
            Results: { EnvironmentId: "other-env" }
        });
        warningStub.resolves(undefined);

        let thrown: unknown;
        try {
            await service.prepareAuthenticationAndEnvironment(OPEN_URI_PARAMS, {});
        } catch (error) {
            thrown = error;
        }

        expect(thrown).to.be.instanceOf(CreateFlowCancellationError);
        expect(pacWrapperStub.orgSelect.called).to.be.false;
    });

    it("reports a cancellation when the user declines authentication", async () => {
        pacWrapperStub.activeOrg.resolves({ Status: "Failure" });
        warningStub.resolves(undefined);

        let thrown: unknown;
        try {
            await service.prepareAuthenticationAndEnvironment(OPEN_URI_PARAMS, {});
        } catch (error) {
            thrown = error;
        }

        expect(thrown).to.be.instanceOf(CreateFlowCancellationError);
        expect(pacWrapperStub.authCreateNewAuthProfileForOrg.called).to.be.false;
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
