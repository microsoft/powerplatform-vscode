/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { PacWrapper } from "../../pac/PacWrapper";
import {
    AGENTIC_CREATE_LOCAL_TRIGGER_COMMAND,
    AgenticCreateUriHandler,
    buildLocalAgenticCreateUri
} from "../../uriHandler/agenticCreateUriHandler";
import { URI_CONSTANTS } from "../../uriHandler/constants/uriConstants";
import { AgenticCreateHandler } from "../../uriHandler/handlers/agenticCreateHandler";
import { UriHandler } from "../../uriHandler/uriHandler";
import { ResumeMarkerStore } from "../../uriHandler/utils/resumeMarker";

describe("AgenticCreateUriHandler", () => {
    let sandbox: sinon.SinonSandbox;
    let agenticCreateStub: sinon.SinonStub;
    let delegateStub: sinon.SinonStub;
    let handler: AgenticCreateUriHandler;

    const store: ResumeMarkerStore = {
        get: () => undefined,
        update: () => undefined
    };
    const makeUri = (path: string): vscode.Uri =>
        vscode.Uri.parse(`vscode://${URI_CONSTANTS.EXTENSION_ID}${path}`);

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        agenticCreateStub = sandbox.stub(AgenticCreateHandler.prototype, "handle").resolves();
        delegateStub = sandbox.stub(UriHandler.prototype, "handleUri").resolves();
        handler = new AgenticCreateUriHandler(store);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("handles only Agentic Create before PAC initialization", async () => {
        await handler.handleUri(makeUri(URI_CONSTANTS.PATHS.AGENTIC_CREATE));
        await handler.handleUri(makeUri(URI_CONSTANTS.PATHS.PCF_INIT));
        await handler.handleUri(makeUri(URI_CONSTANTS.PATHS.OPEN));
        await handler.handleUri(makeUri(URI_CONSTANTS.PATHS.PAC_CREATE));

        expect(agenticCreateStub.calledOnce).to.be.true;
        expect(delegateStub.notCalled).to.be.true;
    });

    it("delegates every URI to the existing handler after PAC initialization", async () => {
        handler.initializePacWrapper({} as PacWrapper);
        const uri = makeUri(URI_CONSTANTS.PATHS.PCF_INIT);

        await handler.handleUri(uri);

        expect(delegateStub.calledOnceWithExactly(uri)).to.be.true;
        expect(agenticCreateStub.notCalled).to.be.true;
    });

    it("builds the Studio-shaped local test URI without sensitive data", () => {
        const uri = buildLocalAgenticCreateUri(123);
        const query = new URLSearchParams(uri.query);

        expect(uri.path).to.equal(URI_CONSTANTS.PATHS.AGENTIC_CREATE);
        expect(query.get(URI_CONSTANTS.PARAMETERS.ENV_ID)).to.equal(
            "local-test-environment"
        );
        expect(query.get(URI_CONSTANTS.PARAMETERS.ORG_URL)).to.equal(
            "https://local-test.crm.dynamics.com"
        );
        expect(query.get(URI_CONSTANTS.PARAMETERS.REFERRER_SESSION_ID)).to.equal(
            "local-123"
        );
        expect(query.get(URI_CONSTANTS.PARAMETERS.SOURCE)).to.equal("studio");
        expect(query.get(URI_CONSTANTS.PARAMETERS.VERSION)).to.equal("1");
    });

    it("runs the local trigger through the real flow while bypassing only ECS", async () => {
        await handler.triggerLocalTest();

        expect(agenticCreateStub.calledOnce).to.be.true;
        expect(agenticCreateStub.firstCall.args[0].path).to.equal(
            URI_CONSTANTS.PATHS.AGENTIC_CREATE
        );
        expect(agenticCreateStub.firstCall.args[1]).to.deep.equal({
            bypassFeatureGate: true
        });
    });

    it("contributes the local trigger only to the development-host palette", () => {
        const packageJson = vscode.extensions.getExtension(
            URI_CONSTANTS.EXTENSION_ID
        )?.packageJSON;
        const command = packageJson?.contributes?.commands?.find(
            (item: { command?: string }) =>
                item.command === AGENTIC_CREATE_LOCAL_TRIGGER_COMMAND
        );
        const menu = packageJson?.contributes?.menus?.commandPalette?.find(
            (item: { command?: string }) =>
                item.command === AGENTIC_CREATE_LOCAL_TRIGGER_COMMAND
        );

        expect(command?.enablement).to.equal("isExtensionDevelopmentHost");
        expect(menu?.when).to.equal("isExtensionDevelopmentHost");
    });
});
