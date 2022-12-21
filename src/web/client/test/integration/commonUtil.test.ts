/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import {
    convertfromBase64ToString,
    convertStringtoBase64,
    GetFileNameWithExtension,
} from "../../utilities/commonUtil";

describe("commonUtil", async () => {
    it("it should return text from base 64", () => {
        const str = "this is test case";

        const base64 = convertStringtoBase64(str);
        const base64totext = convertfromBase64ToString(base64);
        expect(base64).eq("dGhpcyBpcyB0ZXN0IGNhc2U=");
        expect(base64totext).eq(str);
    });

    it("it should return file name name with extension if entity is webpages", () => {
        const entity = "webpages";
        const fileName = "test";
        const languageCode = "en-Us";
        const extension = "txt";
        const isAnnotations = GetFileNameWithExtension(
            entity,
            fileName,
            languageCode,
            extension
        );
        const expectedResult = `${fileName}.${languageCode}.${extension}`;
        expect(isAnnotations).eq(expectedResult);
    });

    it("it should return file name name with extension if entity is contentsnippet", () => {
        const entity = "contentsnippet";
        const fileName = "test";
        const languageCode = "en-Us";
        const extension = "txt";
        const isAnnotations = GetFileNameWithExtension(
            entity,
            fileName,
            languageCode,
            extension
        );
        const expectedResult = `${fileName}.${languageCode}.${extension}`;
        expect(isAnnotations).eq(expectedResult);
    });

    it("it should return file name name with extension if entity is webtemplates", () => {
        const entity = "webtemplates";
        const fileName = "test";
        const languageCode = "en-Us";
        const extension = "txt";
        const isAnnotations = GetFileNameWithExtension(
            entity,
            fileName,
            languageCode,
            extension
        );
        const expectedResult = `${fileName}.${extension}`;
        expect(isAnnotations).eq(expectedResult);
    });
});
