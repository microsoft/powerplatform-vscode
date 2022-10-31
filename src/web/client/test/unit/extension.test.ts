/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */



import { expect } from "chai";
import { fromBase64, toBase64 } from "../../utility/CommonUtility";

describe("Web Extension Unit Tests", async () => {
    it("it should return text from base 64", () => {
        const str = "this is test case";

        const base64 = toBase64(str);
        const base64totext = fromBase64(base64);
        expect(base64).eq("dGhpcyBpcyB0ZXN0IGNhc2U=");
        expect(base64totext).eq(str);
    });
});
