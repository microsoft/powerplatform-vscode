/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import { schemaEntityName } from "../../schema/constants";
import {
    convertfromBase64ToString,
    convertStringtoBase64,
    GetFileNameWithExtension,
} from "../../utilities/commonUtil";

describe("commonUtil", async () => {
    it("convertfromBase64ToString_shouldConvertBase64ToString", () => {
        //Act
        const data = "this is test case";
        const encodedString = "dGhpcyBpcyB0ZXN0IGNhc2U=";
        //Action
        const base64totext = convertfromBase64ToString(encodedString);
        //Assert
        expect(base64totext).eq(data);
    });

    it("convertStringtoBase64_shouldConvertStringToBase64", () => {
        //Act
        const data = "this is test case";
        const encodedString = "dGhpcyBpcyB0ZXN0IGNhc2U=";
        //Action
        const base64 = convertStringtoBase64(data);
        //Assert
        expect(base64).eq(encodedString);
    });

    it("GetFileNameWithExtension_withEntityWebpages_shouldAddFileNameWithExtension", () => {
        //Act
        const entity = schemaEntityName.WEBPAGES;
        const fileName = "test";
        const languageCode = "en-Us";
        const extension = "txt";

        //Action
        const result = GetFileNameWithExtension(
            entity,
            fileName,
            languageCode,
            extension
        );

        //Assert
        const expectedResult = `${fileName}.${languageCode}.${extension}`;
        expect(result).eq(expectedResult);
    });

    it("GetFileNameWithExtension_withEntityContentsnippet_shouldAddFileNameWithExtension", () => {
        //Act
        const entity = schemaEntityName.CONTENTSNIPPETS;
        const fileName = "test";
        const languageCode = "en-Us";
        const extension = "txt";

        //Action
        const result = GetFileNameWithExtension(
            entity,
            fileName,
            languageCode,
            extension
        );

        //Assert
        const expectedResult = `${fileName}.${languageCode}.${extension}`;
        expect(result).eq(expectedResult);
    });

    it("GetFileNameWithExtension_withEntitywebtemplates_shouldAddFileNameWithExtension", () => {
        //Act
        const entity = schemaEntityName.WEBTEMPLATES;
        const fileName = "test";
        const languageCode = "en-Us";
        const extension = "txt";

        //Action
        const result = GetFileNameWithExtension(
            entity,
            fileName,
            languageCode,
            extension
        );

        //Assert
        const expectedResult = `${fileName}.${extension}`;
        expect(result).eq(expectedResult);
    });

    it("GetFileNameWithExtension_withoutEntityMatch_shouldNotAddExtensionWithFileName", () => {
        //Act
        const entity = schemaEntityName.WEBFILES;
        const fileName = "test";
        const languageCode = "en-Us";
        const extension = "txt";

        //Action
        const result = GetFileNameWithExtension(
            entity,
            fileName,
            languageCode,
            extension
        );

        //Assert
        expect(result).eq(fileName);
    });
});
