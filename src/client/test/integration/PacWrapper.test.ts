/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import { IPacInterop, IPacWrapperContext, PacArguments, PacWrapper } from "../../pac/PacWrapper";

class MockContext implements IPacWrapperContext {
    public get globalStorageLocalPath(): string { return ""; }
    public get automationAgent(): string { return "powerplatform-vscode-tests/0.1.0-dev"; }
    public IsTelemetryEnabled(): boolean { return true; }
    public GetCloudSetting(): string { return 'Public'; }
}

class MockPacInterop implements IPacInterop {
    public executeReturnValue = "";
    public executeCommandWithProgressReturnValue = true;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async executeCommand(args: PacArguments): Promise<string> {
        return this.executeReturnValue;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async executeCommandWithProgress(args: PacArguments): Promise<boolean> {
        return this.executeCommandWithProgressReturnValue;
    }

    public exit(): void {
        // no-op
    }

    public showOutputChannel(): void {
        // no-op
    }

}

describe('PacWrapper', () => {
    it('AuthList parses correctly', async () => {
        const interop = new MockPacInterop();
        interop.executeReturnValue = "{\"Status\":\"Success\",\"Errors\":[],\"Information\":[\"Input commands: [\\\"auth\\\",\\\"list\\\"]\",\"Profiles (* indicates active):\"],"
            + "\"Results\":["
            + "{"
            + "\"Index\":1,"
            + "\"IsActive\":true,"
            + "\"Kind\":\"CDS\","
            + "\"Name\":\"cctest\","
            + "\"ActiveOrganization\":{\"Item2\":\"https://contoso-mock.crmtest.dynamics.com\",\"Item1\":\"\"},"
            + "\"UserDisplayName\":\"bob@contoso.com\","
            + "\"CloudInstance\":\"Public\""
            + "}"
            + "]}";
        const wrapper = new PacWrapper(new MockContext, interop);

        const result = await wrapper.authList();
        expect(result.Status === "Success");
        expect(result.Errors.length === 0);
        expect(result.Information.length > 0);
        expect(result.Results && result.Results.length === 1 && result.Results[0].UserDisplayName === "bob@contoso.com").to.be.true;
        expect(result.Results[0].ActiveOrganization?.Item2 === "https://contoso-mock.crmtest.dynamics.com").to.be.true;
    });
});
