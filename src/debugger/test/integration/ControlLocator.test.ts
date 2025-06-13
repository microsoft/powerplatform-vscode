/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { Page } from "puppeteer-core";
import sinon from "sinon";
import { ControlLocator } from "../../controlLocation";
import {
    expectThrowsAsync,
    mockFullscreenControlConfiguration,
    mockTabbedControlConfiguration,
} from "../helpers";

describe("ControlLocator", () => {
    const pageGotoStub = sinon.stub();
    const pageWaitForSelectorStub = sinon.stub();
    const pageClickStub = sinon.stub();

    const getPageMock = (
        gotoSucceeds = true,
        waitForSelectorSucceeds = true,
        pageClickSpySucceeds = true
    ) => {
        gotoSucceeds
            ? pageGotoStub.resolves()
            : pageGotoStub.rejects(new Error());
        waitForSelectorSucceeds
            ? pageWaitForSelectorStub.resolves()
            : pageWaitForSelectorStub.rejects(new Error());
        pageClickSpySucceeds
            ? pageClickStub.resolves()
            : pageClickStub.rejects(new Error());
        return {
            goto: pageGotoStub,
            waitForSelector: pageWaitForSelectorStub,
            click: pageClickStub,
        } as unknown as Page;
    };

    afterEach(() => {
        pageGotoStub.resetHistory();
        pageWaitForSelectorStub.resetHistory();
        pageClickStub.resetHistory();
    });

    it("navigates to fullscreen control", async () => {
        const expectedUrl =
            "https://ORG_URL.crm.dynamics.com/main.aspx?appid=f96ac8ee-529f-4510-af13-3fe5ff45f2b6&pagetype=control&controlName=ControlName";
        const instance = new ControlLocator(
            mockFullscreenControlConfiguration,
            0,
            0
        );
        const page = getPageMock();
        await instance.navigateToControl(page);
        sinon.assert.calledWith(pageGotoStub, expectedUrl);
    });

    it("navigates to tab", async () => {
        const expectedUrl = "https://ORG_URL.crm.dynamics.com/with/path";
        const expectedTabSelector = "li[aria-label='Control Tab']";
        const instance = new ControlLocator(
            mockTabbedControlConfiguration,
            0,
            0
        );
        const page = getPageMock();
        await instance.navigateToControl(page);
        sinon.assert.calledWith(pageGotoStub, expectedUrl);
        sinon.assert.calledWith(pageClickStub, expectedTabSelector);
    });

    describe("no retry", () => {
        const instance = new ControlLocator(
            mockTabbedControlConfiguration,
            0,
            0
        );
        it("does not retry goto if retry count is 0", async () => {
            const page = getPageMock(false);

            await expectThrowsAsync(() => instance.navigateToControl(page));
            sinon.assert.calledOnce(pageGotoStub);
        });

        it("does not retry wait for selector if retry count is 0", async () => {
            const page = getPageMock(true, false, false);

            await expectThrowsAsync(() => instance.navigateToControl(page));
            sinon.assert.calledOnce(pageWaitForSelectorStub);
        });
    });

    describe("1 retry", () => {
        const instance = new ControlLocator(
            mockTabbedControlConfiguration,
            0,
            1
        );
        it("goto fail", async () => {
            const page = getPageMock(false);
            await expectThrowsAsync(() => instance.navigateToControl(page));
            sinon.assert.calledTwice(pageGotoStub);
            sinon.assert.notCalled(pageWaitForSelectorStub);
            sinon.assert.notCalled(pageClickStub);
        });

        it("wait for selector fails", async () => {
            const page = getPageMock(true, false, false);
            await expectThrowsAsync(() => instance.navigateToControl(page));
            sinon.assert.calledTwice(pageWaitForSelectorStub);
            sinon.assert.notCalled(pageClickStub);
        });

        it("click fails", async () => {
            const page = getPageMock(true, true, false);
            await expectThrowsAsync(() => instance.navigateToControl(page));
            sinon.assert.calledTwice(pageWaitForSelectorStub);
            sinon.assert.calledTwice(pageClickStub);
        });
    });
});
