/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import { isSupportedContractVersion } from "../../uriHandler/handlers/createFlowContractVersion";

describe("Create-flow contract version", () => {
    it("allows a missing version", () => {
        expect(isSupportedContractVersion(null)).to.be.true;
    });

    it("allows an empty version", () => {
        expect(isSupportedContractVersion('')).to.be.true;
    });

    it("allows the current version", () => {
        expect(isSupportedContractVersion('1')).to.be.true;
    });

    it("rejects a future version", () => {
        expect(isSupportedContractVersion('2')).to.be.false;
    });

    it("rejects an unknown version", () => {
        expect(isSupportedContractVersion('abc')).to.be.false;
    });
});
