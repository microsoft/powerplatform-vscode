/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import { URI_CONSTANTS } from "../../uriHandler/constants/uriConstants";

// These constants form the versioned deep-link contract between the Power Pages
// home page and the VS Code extension. They are asserted here so that any accidental
// rename or removal is caught before it can break an already-shipped deep link.
describe("URI_CONSTANTS deep-link contract", () => {
    it("keeps the existing open and pcfInit paths unchanged", () => {
        expect(URI_CONSTANTS.PATHS.PCF_INIT).to.equal("/pcfInit");
        expect(URI_CONSTANTS.PATHS.OPEN).to.equal("/open");
    });

    it("registers the agentic and PAC create paths", () => {
        expect(URI_CONSTANTS.PATHS.AGENTIC_CREATE).to.equal("/agenticCreate");
        expect(URI_CONSTANTS.PATHS.PAC_CREATE).to.equal("/pacCreate");
    });

    it("exposes the shared context parameter names", () => {
        expect(URI_CONSTANTS.PARAMETERS.ENV_ID).to.equal("envid");
        expect(URI_CONSTANTS.PARAMETERS.ORG_URL).to.equal("orgurl");
        expect(URI_CONSTANTS.PARAMETERS.REGION).to.equal("region");
        expect(URI_CONSTANTS.PARAMETERS.TENANT_ID).to.equal("tenantid");
        expect(URI_CONSTANTS.PARAMETERS.SOURCE).to.equal("source");
        expect(URI_CONSTANTS.PARAMETERS.AGENT_HOST).to.equal("agenthost");
        expect(URI_CONSTANTS.PARAMETERS.VERSION).to.equal("v");
    });

    it("defines the versioned contract and known enumerated values", () => {
        expect(URI_CONSTANTS.CONTRACT_VERSION.CURRENT).to.equal("1");
        expect(URI_CONSTANTS.SOURCE_VALUES.POWER_PAGES_HOME).to.equal("powerPagesHome");
        expect(URI_CONSTANTS.AGENT_HOST_VALUES.COPILOT).to.equal("copilot");
        expect(URI_CONSTANTS.AGENT_HOST_VALUES.CLAUDE).to.equal("claude");
        expect(URI_CONSTANTS.AGENT_HOST_VALUES.AUTO).to.equal("auto");
    });
});
