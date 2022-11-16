/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import sinon from "sinon";
import { SINGLE_ENTITY_URL_KEY } from "../../common/constants";
import { IPowerPlatformExtensionContext } from "../../common/localStore";
import { getParameterizedRequestUrlTemplate } from "../../utility/UrlBuilder";
import PowerPlatformExtensionContextManager from "../../common/localStore";

describe("Web Extension Integration Tests", async () => {
    it("getParameterizedRequestUrlTemplate_should_return_SINGLE_ENTITY_URL_KEY_when_isSingleEntity_is_true", async () => {
        const powerPlatformExtensionContext: IPowerPlatformExtensionContext = {
            dataSourcePropertiesMap: new Map<string, string>([
                [SINGLE_ENTITY_URL_KEY, SINGLE_ENTITY_URL_KEY],
            ]),
        } as IPowerPlatformExtensionContext;
        sinon
            .stub(
                PowerPlatformExtensionContextManager,
                "getPowerPlatformExtensionContext"
            )
            .returns(powerPlatformExtensionContext);
        const result = getParameterizedRequestUrlTemplate(true);
        expect(result).eq("singleEntityURL");
    });
});
