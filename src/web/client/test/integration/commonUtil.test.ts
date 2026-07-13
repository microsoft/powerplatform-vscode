/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import sinon, { stub, assert } from "sinon";
import * as vscode from "vscode";
import { schemaEntityName } from "../../schema/constants";
import {
    convertContentToUint8Array,
    convertContentToString,
    GetFileNameWithExtension,
    isCoPresenceEnabled,
} from "../../utilities/commonUtil";
import WebExtensionContext from "../../WebExtensionContext";
import { CO_PRESENCE_FEATURE_SETTING_NAME } from "../../common/constants";
import { SETTINGS_EXPERIMENTAL_STORE_NAME } from "../../../../common/constants";
import { webExtensionTelemetryEventNames } from "../../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";

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

describe("isCoPresenceEnabled", () => {
    afterEach(() => {
        sinon.restore();
    });

    const stubConfig = (value: boolean | undefined) => {
        const get = stub().withArgs(CO_PRESENCE_FEATURE_SETTING_NAME).returns(value);
        stub(vscode.workspace, "getConfiguration")
            .withArgs(SETTINGS_EXPERIMENTAL_STORE_NAME)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .returns({ get } as any);
    };

    it("isCoPresenceEnabled_whenSettingEnabled_shouldReturnTrue", () => {
        stubConfig(true);

        const result = isCoPresenceEnabled();

        expect(result).eq(true);
    });

    it("isCoPresenceEnabled_whenSettingDisabled_shouldReturnFalse", () => {
        stubConfig(false);

        const result = isCoPresenceEnabled();

        expect(result).eq(false);
    });

    it("isCoPresenceEnabled_shouldNotEmitTelemetry", () => {
        stubConfig(true);
        const sendInfoTelemetry = stub(WebExtensionContext.telemetry, "sendInfoTelemetry");

        isCoPresenceEnabled();

        assert.notCalled(sendInfoTelemetry);
    });
});

describe("processWillStartCollaboration telemetry event names", () => {
    it("hasCoPresenceFunnelEventNames", () => {
        expect(webExtensionTelemetryEventNames.WEB_EXTENSION_CO_PRESENCE_ACTIVATED).to.be.a("string");
        expect(webExtensionTelemetryEventNames.WEB_EXTENSION_CO_PRESENCE_OTHER_USER_DETECTED).to.be.a("string");
        expect(webExtensionTelemetryEventNames.WEB_EXTENSION_CO_PRESENCE_ACTIVE_USERS_VIEWED).to.be.a("string");
        expect(webExtensionTelemetryEventNames.WEB_EXTENSION_CO_PRESENCE_USER_SELECTED).to.be.a("string");
        expect(webExtensionTelemetryEventNames.WEB_EXTENSION_CO_PRESENCE_CONTACT_OPTION_SELECTED).to.be.a("string");
        expect(webExtensionTelemetryEventNames.WEB_EXTENSION_CO_PRESENCE_TEAMS_CHAT_OPENED).to.be.a("string");
        expect(webExtensionTelemetryEventNames.WEB_EXTENSION_CO_PRESENCE_TEAMS_CHAT_UNAVAILABLE).to.be.a("string");
        expect(webExtensionTelemetryEventNames.WEB_EXTENSION_CO_PRESENCE_EMAIL_OPENED).to.be.a("string");
        expect(webExtensionTelemetryEventNames.WEB_EXTENSION_CO_PRESENCE_EMAIL_UNAVAILABLE).to.be.a("string");
    });
});
