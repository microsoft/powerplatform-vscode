/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import { schemaEntityName } from "../../schema/constants";
import {
    convertContentToUint8Array,
    convertContentToString,
    GetFileNameWithExtension,
    clearFileNameTracker,
    getFolderNameWithEntityId,
} from "../../utilities/commonUtil";

describe("commonUtil", async () => {
    it("convertContentToUint8Array_shouldReturnBase64AsUint8Output", () => {
        //Act
        const encodedString = "dGhpcyBpcyB0ZXN0IGNhc2U="; // "this is test case"
        //Action
        const base64toUint8Array = convertContentToUint8Array(encodedString, true);

        //Assert
        expect(base64toUint8Array).instanceOf(Uint8Array);
    });

    it("convertContentToUint8Array_shouldReturnStringAsUint8Output", () => {
        //Act
        const encodedString = "this is test case=";
        //Action
        const base64toUint8Array = convertContentToUint8Array(encodedString, false);

        //Assert
        expect(base64toUint8Array).instanceOf(Uint8Array);
    });

    it("shouldConvertBase64ToString", () => {
        //Act
        const encodedString = "dGhpcyBpcyB0ZXN0IGNhc2U="; // "this is test case"
        //Action
        const base64toUint8Array = convertContentToUint8Array(encodedString, true);
        const unit8ArrayToBase64 = convertContentToString(base64toUint8Array, true);
        //Assert
        expect(unit8ArrayToBase64).eq(encodedString);
    });

    it("convertContentToString_shouldConvertBase64ToString", () => {
        //Act
        const data = "this is test case";
        const encodedString = "dGhpcyBpcyB0ZXN0IGNhc2U=";
        //Action
        const base64 = convertContentToString(data, true);
        //Assert
        expect(base64).eq(encodedString);
    });

    it("convertContentToString_shouldReturnUint8ArrayAsUint8Array", () => {
        //Act
        const data = new Uint8Array(Buffer.from("this is test case"));
        //Action
        const uint8 = convertContentToString(data, false);
        //Assert
        expect(uint8).instanceOf(Uint8Array);
        expect(uint8).eq(data);
    });    it("GetFileNameWithExtension_withEntityWebpages_shouldAddFileNameWithExtension", () => {
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

    it("getFolderNameWithEntityId_withDuplicateWebpageFolders_shouldAddEntityIdSuffix", () => {
        // Clear the tracker to start fresh
        clearFileNameTracker();

        //Act
        const entity = schemaEntityName.WEBPAGES;
        const folderName = "Home";
        const entityId1 = "page-12345";
        const entityId2 = "page-67890";

        //Action - First webpage folder with this name
        const result1 = getFolderNameWithEntityId(entity, folderName, entityId1);

        //Action - Second webpage folder with same name (should get suffix)
        const result2 = getFolderNameWithEntityId(entity, folderName, entityId2);

        //Assert
        const expectedResult1 = folderName;
        const expectedResult2 = `${folderName}-${entityId2}`;
        expect(result1).eq(expectedResult1);
        expect(result2).eq(expectedResult2);
    });

    it("getFolderNameWithEntityId_withNonWebpageEntity_shouldNotAddEntityIdSuffix", () => {
        // Clear the tracker to start fresh
        clearFileNameTracker();

        //Act
        const entity = schemaEntityName.WEBTEMPLATES;
        const folderName = "Template";
        const entityId = "template-123";

        //Action
        const result = getFolderNameWithEntityId(entity, folderName, entityId);

        //Assert - Should not add suffix for non-webpage entities
        expect(result).eq(folderName);
    });

    it("getFolderNameWithEntityId_withoutEntityId_shouldReturnSanitizedFolderName", () => {
        //Act
        const entity = schemaEntityName.WEBPAGES;
        const folderName = "My Special Folder!@#";

        //Action - Called without entityId
        const result = getFolderNameWithEntityId(entity, folderName);

        //Assert - Should return sanitized folder name without entityId
        const expectedResult = "My Special Folder";
        expect(result).eq(expectedResult);
    });

    it("getFolderNameWithEntityId_withSameEntityIdCalledTwice_shouldReturnSameResult", () => {
        // Clear the tracker to start fresh
        clearFileNameTracker();

        //Act
        const entity = schemaEntityName.WEBPAGES;
        const folderName = "Contact";
        const entityId = "contact-abc123";

        //Action - Same entity called twice
        const result1 = getFolderNameWithEntityId(entity, folderName, entityId);
        const result2 = getFolderNameWithEntityId(entity, folderName, entityId);

        //Assert - Both should return the same result without suffix
        expect(result1).eq(folderName);
        expect(result2).eq(folderName);
    });
});
