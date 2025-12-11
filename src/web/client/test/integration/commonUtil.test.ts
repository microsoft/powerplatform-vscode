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

    it("GetFileNameWithExtension_withEntityBlogs_shouldAddFileNameWithExtension", () => {
        //Act
        const entity = schemaEntityName.BLOGS;
        const fileName = "test-blog";
        const languageCode = "en-Us";
        const extension = "html";

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

    it("GetFileNameWithExtension_withEntityIdeas_shouldAddFileNameWithExtension", () => {
        //Act
        const entity = schemaEntityName.IDEAS;
        const fileName = "test-idea";
        const languageCode = "en-Us";
        const extension = "html";

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

    it("GetFileNameWithExtension_withEntityBlogPosts_shouldAddFileNameWithExtension", () => {
        //Act
        const entity = schemaEntityName.BLOGPOSTS;
        const fileName = "test-post";
        const languageCode = "en-Us";
        const extension = "html";

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

    it("GetFileNameWithExtension_withEntityIdeaForums_shouldAddFileNameWithExtension", () => {
        //Act
        const entity = schemaEntityName.IDEAFORUMS;
        const fileName = "test-forum";
        const languageCode = "en-Us";
        const extension = "html";

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

    it("GetFileNameWithExtension_withEntityForumAnnouncements_shouldAddFileNameWithExtension", () => {
        //Act
        const entity = schemaEntityName.FORUMANNOUNCEMENTS;
        const fileName = "test-announcement";
        const languageCode = "en-Us";
        const extension = "html";

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

    it("GetFileNameWithExtension_withEntityForumPosts_shouldAddFileNameWithExtension", () => {
        //Act
        const entity = schemaEntityName.FORUMPOSTS;
        const fileName = "test-forum-post";
        const languageCode = "en-Us";
        const extension = "html";

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
});
