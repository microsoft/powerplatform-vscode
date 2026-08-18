/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import {
    AgenticCreateLinkStrings,
    buildSampleAgenticCreateLink,
    validateAgenticCreateLink
} from "../../uriHandler/utils/agenticCreateSampleLink";

describe("agenticCreateSampleLink", () => {
    const strings: AgenticCreateLinkStrings = {
        required: "required",
        invalid: "invalid",
        unsupportedScheme: "bad scheme",
        unsupportedPath: "path must be {0}",
        placeholdersRemaining: "replace placeholders"
    };

    const validLink =
        'vscode://microsoft-IsvExpTools.powerplatform-vscode/agenticCreate' +
        '?envid=11111111-1111-1111-1111-111111111111' +
        '&orgurl=https://contoso.crm.dynamics.com' +
        '&websiteid=22222222-2222-2222-2222-222222222222' +
        '&region=unitedstates&source=powerPagesHome&agenthost=auto&v=1';

    describe("buildSampleAgenticCreateLink", () => {
        it("targets the agentic create path on the extension", () => {
            const link = buildSampleAgenticCreateLink();

            expect(link).to.contain('vscode://microsoft-IsvExpTools.powerplatform-vscode/agenticCreate?');
        });

        it("carries the full create-flow contract parameters", () => {
            const query = buildSampleAgenticCreateLink().split('?')[1];

            expect(query.split('&').map((pair) => pair.split('=')[0])).to.deep.equal([
                'envid',
                'orgurl',
                'websiteid',
                'region',
                'source',
                'agenthost',
                'v'
            ]);
        });

        it("uses the supplied window scheme so Insiders can replay its own links", () => {
            expect(buildSampleAgenticCreateLink('vscode-insiders')).to.contain('vscode-insiders://');
        });

        it("is rejected until its placeholders are replaced", () => {
            expect(validateAgenticCreateLink(buildSampleAgenticCreateLink(), strings)).to.equal(
                "replace placeholders"
            );
        });
    });

    describe("validateAgenticCreateLink", () => {
        it("accepts a fully populated link", () => {
            expect(validateAgenticCreateLink(validLink, strings)).to.be.undefined;
        });

        it("accepts a link surrounded by whitespace", () => {
            expect(validateAgenticCreateLink(`  ${validLink}  `, strings)).to.be.undefined;
        });

        it("rejects empty input", () => {
            expect(validateAgenticCreateLink("   ", strings)).to.equal("required");
        });

        it("rejects text that is not a URI", () => {
            expect(validateAgenticCreateLink("not a link", strings)).to.equal("invalid");
        });

        it("rejects a non-vscode scheme", () => {
            expect(
                validateAgenticCreateLink(validLink.replace('vscode://', 'https://'), strings)
            ).to.equal("bad scheme");
        });

        it("rejects a different deep-link path", () => {
            expect(
                validateAgenticCreateLink(validLink.replace('/agenticCreate', '/pacCreate'), strings)
            ).to.equal("path must be /agenticCreate");
        });

        it("accepts the running window scheme when it is supplied", () => {
            const insidersLink = validLink.replace('vscode://', 'vscode-exploration://');

            expect(validateAgenticCreateLink(insidersLink, strings)).to.equal("bad scheme");
            expect(
                validateAgenticCreateLink(insidersLink, strings, ['vscode-exploration'])
            ).to.be.undefined;
        });

        it("rejects a link that still contains placeholders", () => {
            expect(
                validateAgenticCreateLink(
                    validLink.replace('11111111-1111-1111-1111-111111111111', '<environment-id>'),
                    strings
                )
            ).to.equal("replace placeholders");
        });
    });
});
