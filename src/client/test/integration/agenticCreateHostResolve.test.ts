/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { URI_CONSTANTS } from "../../uriHandler/constants/uriConstants";
import {
    AgenticCreateHandler,
    AgenticCreateHandlerDependencies
} from "../../uriHandler/handlers/agenticCreateHandler";
import { emitCreateFlowEvent } from "../../uriHandler/telemetry/createFlowTelemetry";
import { uriHandlerTelemetryEventNames } from "../../uriHandler/telemetry/uriHandlerTelemetryEvents";
import { AgentHost, AgentHostDetectionResult } from "../../uriHandler/utils/detectAgentHost";
import { AgentHostInstallResolution } from "../../uriHandler/utils/resolveAgentHostInstallation";
import { ResumeMarkerStore } from "../../uriHandler/utils/resumeMarker";

describe("Agentic create host resolution", () => {
    let sandbox: sinon.SinonSandbox;
    let detectAgentHostStub: sinon.SinonStub;
    let selectAgenticCreateInputsStub: sinon.SinonStub;
    let resolveAgentHostInstallationStub: sinon.SinonStub;
    let emitCreateFlowEventStub: sinon.SinonStub;
    let confirmAndLaunchAgentHostStub: sinon.SinonStub;
    let traceInfoStub: sinon.SinonStub;
    let traceErrorStub: sinon.SinonStub;
    let storeUpdateStub: sinon.SinonStub;
    let dependencies: AgenticCreateHandlerDependencies;
    let store: ResumeMarkerStore;

    const selectedFolder = vscode.Uri.file("C:\\private\\selected-site");
    const rawOrgUrl = "https://private.crm.dynamics.com";
    const rawTenantId = "private-tenant-id";
    const uri = vscode.Uri.parse(
        `vscode://${URI_CONSTANTS.EXTENSION_ID}${URI_CONSTANTS.PATHS.AGENTIC_CREATE}` +
        `?${URI_CONSTANTS.PARAMETERS.SOURCE}=${URI_CONSTANTS.SOURCE_VALUES.POWER_PAGES_HOME}` +
        `&${URI_CONSTANTS.PARAMETERS.ENV_ID}=environment-id` +
        `&${URI_CONSTANTS.PARAMETERS.ORG_URL}=${encodeURIComponent(rawOrgUrl)}` +
        `&${URI_CONSTANTS.PARAMETERS.TENANT_ID}=${rawTenantId}` +
        `&${URI_CONSTANTS.PARAMETERS.WEBSITE_ID}=website-id` +
        `&${URI_CONSTANTS.PARAMETERS.REFERRER_SESSION_ID}=correlation-id`
    );

    const detection: AgentHostDetectionResult[] = [
        {
            host: AgentHost.Copilot,
            installed: true,
            version: "1.0.0"
        },
        {
            host: AgentHost.Claude,
            installed: false
        }
    ];

    const installEventNames = new Set<string>([
        uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_PROMPTED,
        uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_GUIDE_OPENED,
        uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_RECHECKED,
        uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_RELOAD_REQUESTED,
        uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_DISMISSED
    ]);

    const createHandler = (): AgenticCreateHandler =>
        new AgenticCreateHandler(store, dependencies);

    const expectNoSensitiveTelemetry = (): void => {
        for (const call of traceInfoStub.getCalls()) {
            const properties = call.args[1] as Record<string, string>;
            expect(properties).to.not.have.property("orgUrl");
            expect(properties).to.not.have.property("tenantId");
            expect(Object.values(properties)).to.not.include(rawOrgUrl);
            expect(Object.values(properties)).to.not.include(rawTenantId);
            expect(Object.values(properties)).to.not.include(selectedFolder.fsPath);
        }
    };

    const expectNoInstallEventsFromHandler = (): void => {
        const emittedNames = emitCreateFlowEventStub.getCalls().map(call => call.args[0] as string);
        expect(emittedNames.some(eventName => installEventNames.has(eventName))).to.be.false;
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(AgenticCreateHandler, "isEnabled").returns(true);

        traceInfoStub = sandbox.stub();
        traceErrorStub = sandbox.stub();
        sandbox.stub(oneDSLoggerWrapper, "getLogger").returns(
            {
                traceInfo: traceInfoStub,
                traceError: traceErrorStub
            } as unknown as ReturnType<typeof oneDSLoggerWrapper.getLogger>
        );

        detectAgentHostStub = sandbox.stub();
        detectAgentHostStub.withArgs(AgentHost.Copilot).resolves(detection[0]);
        detectAgentHostStub.withArgs(AgentHost.Claude).resolves(detection[1]);
        selectAgenticCreateInputsStub = sandbox.stub().resolves({
            status: "selected",
            folderUri: selectedFolder,
            hostSelection: {
                host: AgentHost.Copilot,
                installed: true
            }
        });
        resolveAgentHostInstallationStub = sandbox.stub();
        emitCreateFlowEventStub = sandbox.stub().callsFake(emitCreateFlowEvent);
        confirmAndLaunchAgentHostStub = sandbox.stub().resolves({ status: "launched" });
        storeUpdateStub = sandbox.stub().resolves();
        store = {
            get: () => undefined,
            update: storeUpdateStub
        };
        dependencies = {
            detectAgentHost: detectAgentHostStub,
            selectAgenticCreateInputs: selectAgenticCreateInputsStub,
            resolveAgentHostInstallation: resolveAgentHostInstallationStub,
            emitCreateFlowEvent: emitCreateFlowEventStub,
            confirmAndLaunchAgentHost: confirmAndLaunchAgentHostStub
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("drops the flow when folder selection is cancelled", async () => {
        selectAgenticCreateInputsStub.resolves({
            status: "cancelled",
            step: "folder"
        });

        await createHandler().handle(uri);

        expect(emitCreateFlowEventStub.callCount).to.equal(2);
        expect(emitCreateFlowEventStub.firstCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FOLDER_CANCELLED
        );
        expect(emitCreateFlowEventStub.secondCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED
        );
        expect(emitCreateFlowEventStub.secondCall.args[3]).to.deep.equal({
            reason: "folderSelectionCancelled"
        });
        expect(resolveAgentHostInstallationStub.notCalled).to.be.true;
        expect(confirmAndLaunchAgentHostStub.notCalled).to.be.true;
    });

    it("drops the flow when host selection is cancelled", async () => {
        selectAgenticCreateInputsStub.resolves({
            status: "cancelled",
            step: "host",
            folderUri: selectedFolder
        });

        await createHandler().handle(uri);

        expect(detectAgentHostStub.callCount).to.equal(2);
        expect(detectAgentHostStub.firstCall.calledWithExactly(AgentHost.Copilot)).to.be.true;
        expect(detectAgentHostStub.secondCall.calledWithExactly(AgentHost.Claude)).to.be.true;
        expect(selectAgenticCreateInputsStub.calledOnceWithExactly(detection)).to.be.true;
        expect(emitCreateFlowEventStub.callCount).to.equal(2);
        expect(emitCreateFlowEventStub.firstCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FOLDER_SELECTED
        );
        expect(emitCreateFlowEventStub.secondCall.args).to.include(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED
        );
        expect(emitCreateFlowEventStub.secondCall.args[3]).to.deep.equal({
            reason: "hostSelectionCancelled"
        });
        expect(resolveAgentHostInstallationStub.notCalled).to.be.true;
        expect(confirmAndLaunchAgentHostStub.notCalled).to.be.true;
        expect(storeUpdateStub.notCalled).to.be.true;
        expectNoInstallEventsFromHandler();
        expectNoSensitiveTelemetry();
    });

    it("emits host selected once and confirms + launches for an installed host", async () => {
        await createHandler().handle(uri);

        expect(emitCreateFlowEventStub.callCount).to.equal(2);
        expect(emitCreateFlowEventStub.firstCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FOLDER_SELECTED
        );
        expect(emitCreateFlowEventStub.secondCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_SELECTED
        );
        expect(emitCreateFlowEventStub.secondCall.args[3]).to.deep.equal({
            host: AgentHost.Copilot,
            installed: "true"
        });
        expect(confirmAndLaunchAgentHostStub.calledOnce).to.be.true;
        expect(confirmAndLaunchAgentHostStub.firstCall.args[0]).to.equal(AgentHost.Copilot);
        expect(confirmAndLaunchAgentHostStub.firstCall.args[1]).to.equal("GitHub Copilot CLI");
        expect(confirmAndLaunchAgentHostStub.firstCall.args[2]).to.equal(selectedFolder);
        expect(resolveAgentHostInstallationStub.notCalled).to.be.true;
        expect(storeUpdateStub.notCalled).to.be.true;
        expectNoInstallEventsFromHandler();
        expectNoSensitiveTelemetry();
    });

    it("reopens the picker with current choices and confirms the edited selection", async () => {
        const editedFolder = vscode.Uri.file("C:\\private\\edited-site");
        detectAgentHostStub.withArgs(AgentHost.Claude).resolves({
            host: AgentHost.Claude,
            installed: true,
            version: "2.0.0"
        });
        selectAgenticCreateInputsStub
            .onFirstCall()
            .resolves({
                status: "selected",
                folderUri: selectedFolder,
                hostSelection: {
                    host: AgentHost.Copilot,
                    installed: true
                }
            })
            .onSecondCall()
            .resolves({
                status: "selected",
                folderUri: editedFolder,
                hostSelection: {
                    host: AgentHost.Claude,
                    installed: true
                }
            });
        confirmAndLaunchAgentHostStub
            .onFirstCall()
            .resolves({ status: "edit" })
            .onSecondCall()
            .resolves({ status: "launched" });

        await createHandler().handle(uri);

        expect(selectAgenticCreateInputsStub.calledTwice).to.be.true;
        expect(selectAgenticCreateInputsStub.secondCall.args[1]).to.deep.equal({
            folderUri: selectedFolder,
            hostSelection: {
                host: AgentHost.Copilot,
                installed: true
            }
        });
        expect(confirmAndLaunchAgentHostStub.callCount).to.equal(2);
        expect(confirmAndLaunchAgentHostStub.secondCall.args.slice(0, 3)).to.deep.equal([
            AgentHost.Claude,
            "Claude Code",
            editedFolder
        ]);
        expect(resolveAgentHostInstallationStub.notCalled).to.be.true;
    });

    const resolutions: AgentHostInstallResolution[] = [
        {
            status: "resolved",
            host: AgentHost.Claude
        },
        {
            status: "reloading"
        },
        {
            status: "dismissed"
        }
    ];

    for (const resolution of resolutions) {
        it(`handles a not-installed host when installation resolution is ${resolution.status}`, async () => {
            selectAgenticCreateInputsStub.resolves({
                status: "selected",
                folderUri: selectedFolder,
                hostSelection: {
                    host: AgentHost.Claude,
                    installed: false
                }
            });
            resolveAgentHostInstallationStub.resolves(resolution);

            await createHandler().handle(uri);

            expect(emitCreateFlowEventStub.callCount).to.equal(2);
            expect(emitCreateFlowEventStub.firstCall.args[0]).to.equal(
                uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FOLDER_SELECTED
            );
            expect(emitCreateFlowEventStub.secondCall.args[0]).to.equal(
                uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_SELECTED
            );
            expect(emitCreateFlowEventStub.secondCall.args[3]).to.deep.equal({
                host: AgentHost.Claude,
                installed: "false"
            });
            expect(resolveAgentHostInstallationStub.calledOnce).to.be.true;
            expect(resolveAgentHostInstallationStub.firstCall.args[0]).to.equal(AgentHost.Claude);
            expect(resolveAgentHostInstallationStub.firstCall.args[1]).to.equal("Claude Code");
            expect(resolveAgentHostInstallationStub.firstCall.args[3]).to.include.keys(
                "strings",
                "showInformationMessage",
                "showWarningMessage",
                "openExternal",
                "writeResumeMarker",
                "reloadWindow"
            );
            if (resolution.status === "resolved") {
                expect(confirmAndLaunchAgentHostStub.calledOnce).to.be.true;
                expect(confirmAndLaunchAgentHostStub.firstCall.args[0]).to.equal(AgentHost.Claude);
                expect(confirmAndLaunchAgentHostStub.firstCall.args[1]).to.equal("Claude Code");
                expect(confirmAndLaunchAgentHostStub.firstCall.args[2]).to.equal(selectedFolder);
            } else {
                expect(confirmAndLaunchAgentHostStub.notCalled).to.be.true;
            }
            expect(storeUpdateStub.notCalled).to.be.true;
            expectNoInstallEventsFromHandler();
            expectNoSensitiveTelemetry();
            expect(traceErrorStub.notCalled).to.be.true;
        });
    }
});
