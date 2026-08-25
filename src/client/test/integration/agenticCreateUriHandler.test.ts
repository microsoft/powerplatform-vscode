/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { PacWrapper } from "../../pac/PacWrapper";
import { AgenticCreateUriHandler } from "../../uriHandler/agenticCreateUriHandler";
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
});
