import puppeteer, { Browser, Page } from "puppeteer-core";
import sinon from "sinon";
import * as mocha from "mocha";
import { NoopTelemetryInstance } from "../../../client/telemetry/NoopTelemetry";
import {
    getBrowserMock,
    getWorkspaceFolder,
    mockTabbedControlConfiguration,
} from "../helpers";
import { BrowserManager } from "../../browser/";
import { RequestInterceptor } from "../../RequestInterceptor";

suite("BrowserManager", () => {
    const { browser, invokeBrowserOnCallback, invokePageOnceCallback } =
        getBrowserMock();
    const puppeteerLaunchSpy = sinon
        .stub(puppeteer, "launch")
        .resolves(browser);
    const onBrowserCloseEvent = sinon.spy();
    const onBrowserReadyEvent = sinon.spy();
    sinon.stub(RequestInterceptor.prototype, "register").resolves();
    sinon.stub(RequestInterceptor.prototype, "reloadFileContents").resolves();

    test("launch calls puppeteer.launch", async () => {
        const instance = new BrowserManager(
            NoopTelemetryInstance,
            mockTabbedControlConfiguration,
            onBrowserCloseEvent,
            onBrowserReadyEvent,
            getWorkspaceFolder()
        );
        await instance.launch();
        sinon.assert.calledOnce(puppeteerLaunchSpy);
    });
});
