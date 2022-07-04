import { Page } from "puppeteer-core";
import sinon from "sinon";
import * as mocha from "mocha";
import { NoopTelemetryInstance } from "../../../client/telemetry/NoopTelemetry";
import { ControlLocator } from "../../controlLocation";
import {
    expectThrowsAsync,
    mockFullscreenControlConfiguration,
    mockTabbedControlConfiguration,
} from "../helpers";

suite("ControlLocator", () => {
    const pageGotoSpy = sinon.stub();
    const pageWaitForSelectorSpy = sinon.stub();
    const pageClickSpy = sinon.stub();

    const getPageMock = (
        gotoSucceeds = true,
        waitForSelectorSucceeds = true,
        pageClickSpySucceeds = true
    ) => {
        pageGotoSpy.resetHistory();
        pageWaitForSelectorSpy.resetHistory();
        pageClickSpy.resetHistory();

        gotoSucceeds
            ? pageGotoSpy.resolves()
            : pageGotoSpy.rejects(new Error());
        waitForSelectorSucceeds
            ? pageWaitForSelectorSpy.resolves()
            : pageWaitForSelectorSpy.rejects(new Error());
        pageClickSpySucceeds
            ? pageClickSpy.resolves()
            : pageClickSpy.rejects(new Error());
        return {
            goto: pageGotoSpy,
            waitForSelector: pageWaitForSelectorSpy,
            click: pageClickSpy,
        } as unknown as Page;
    };

    mocha.after(() => {
        pageGotoSpy.restore();
        pageWaitForSelectorSpy.restore();
        pageClickSpy.restore();
    });

    test("navigates to fullscreen control", async () => {
        const expectedUrl =
            "https://ORG_URL.crm.dynamics.com/main.aspx?appid=f96ac8ee-529f-4510-af13-3fe5ff45f2b6&pagetype=control&controlName=ControlName";
        const instance = new ControlLocator(
            mockFullscreenControlConfiguration,
            NoopTelemetryInstance,
            0,
            0
        );
        const page = getPageMock();
        await instance.navigateToControl(page);
        sinon.assert.calledWith(pageGotoSpy, expectedUrl);
    });

    test("navigates to tab", async () => {
        const expectedUrl = "https://ORG_URL.crm.dynamics.com/with/path";
        const expectedTabSelector = "li[aria-label='Control Tab']";
        const instance = new ControlLocator(
            mockTabbedControlConfiguration,
            NoopTelemetryInstance,
            0,
            0
        );
        const page = getPageMock();
        await instance.navigateToControl(page);
        sinon.assert.calledWith(pageGotoSpy, expectedUrl);
        sinon.assert.calledWith(pageClickSpy, expectedTabSelector);
    });

    mocha.describe("no retry", () => {
        const instance = new ControlLocator(
            mockTabbedControlConfiguration,
            NoopTelemetryInstance,
            0,
            0
        );
        test("does not retry goto if retry count is 0", async () => {
            const page = getPageMock(false);

            await expectThrowsAsync(() => instance.navigateToControl(page));
            sinon.assert.calledOnce(pageGotoSpy);
        });

        test("does not retry wait for selector if retry count is 0", async () => {
            const page = getPageMock(true, false, false);

            await expectThrowsAsync(() => instance.navigateToControl(page));
            sinon.assert.calledOnce(pageWaitForSelectorSpy);
        });
    });

    mocha.describe("1 retry", () => {
        const instance = new ControlLocator(
            mockTabbedControlConfiguration,
            NoopTelemetryInstance,
            0,
            1
        );
        test("goto fail", async () => {
            const page = getPageMock(false);
            await expectThrowsAsync(() => instance.navigateToControl(page));
            sinon.assert.calledTwice(pageGotoSpy);
            sinon.assert.notCalled(pageWaitForSelectorSpy);
            sinon.assert.notCalled(pageClickSpy);
        });

        test("wait for selector fails", async () => {
            const page = getPageMock(true, false, false);
            await expectThrowsAsync(() => instance.navigateToControl(page));
            sinon.assert.calledTwice(pageWaitForSelectorSpy);
            sinon.assert.notCalled(pageClickSpy);
        });

        test("click fails", async () => {
            const page = getPageMock(true, true, false);
            await expectThrowsAsync(() => instance.navigateToControl(page));
            sinon.assert.calledTwice(pageWaitForSelectorSpy);
            sinon.assert.calledTwice(pageClickSpy);
        });
    });
});
