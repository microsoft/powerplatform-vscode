/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import { getHeader } from "../../common/authenticationProvider";

describe("Web Extension Unit Tests", () => {
    it("Sample test", () => {
        expect([1, 2, 3].indexOf(5)).to.be.eq(-1); // sample unit test for webExtension
    });
});


describe("Test for authentication provider", () => {
    it("it should create header with authorization and accept", () => {
        const accessToken = "c4e9ebd8-48c9-4442-9a21-3e150f89eeac";
        const token = {
            authorization: "Bearer " + accessToken,
            'content-type': "application/json; charset=utf-8",
            accept: "application/json",
            'OData-MaxVersion': "4.0",
            'OData-Version': "4.0",
        };
        const result = getHeader(accessToken);
        expect(result).eq(token);
    });
});
