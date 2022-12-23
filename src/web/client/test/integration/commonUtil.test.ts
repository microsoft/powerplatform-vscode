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
    it("it should return text from base 64", () => {
        //Act
        const data = "this is test case";
        //Action
        const base64 = convertStringtoBase64(data);
        const base64totext = convertfromBase64ToString(base64);
        //Assert
        expect(base64).eq("dGhpcyBpcyB0ZXN0IGNhc2U=");
        expect(base64totext).eq(data);
    });

    it("it should return file name name with extension if entity is webpages", () => {
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

    it("it should return file name name with extension if entity is contentsnippet", () => {
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

    it("it should return file name name with extension if entity is webtemplates", () => {
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

    it("it should return file name without modifying when entity do not match ", () => {
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
