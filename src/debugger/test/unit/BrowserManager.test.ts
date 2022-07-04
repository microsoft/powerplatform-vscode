import puppeteer, { Browser, Page } from "puppeteer-core";
import sinon from "sinon";
import * as mocha from "mocha";
import { NoopTelemetryInstance } from "../../../client/telemetry/NoopTelemetry";
import {
    getBrowserMock,
    getWorkspaceFolder,
    mockFileSystemWatcher,
    mockTabbedControlConfiguration,
} from "../helpers";
import { BrowserManager } from "../../browser/";
import { FileSystemWatcher } from "vscode";
import { BundleLoader } from "../../BundleLoader";

suite("BrowserManager", () => {
    const { browser, invokeBrowserOnCallback, invokePageOnceCallback } =
        getBrowserMock();
    const puppeteerLaunchSpy = sinon
        .stub(puppeteer, "launch")
        .resolves(browser);
    const onBrowserCloseEvent = sinon.spy();
    const onBrowserReadyEvent = sinon.spy();
    // let fileSystemWatcherMock: sinon.SinonStub<any, FileSystemWatcher>;

    // mocha.before(() => {
    //     fileSystemWatcherMock = mockFileSystemWatcher();
    // });

    let loadFileContentsStub: sinon.SinonStub<[], Promise<string>>;

    mocha.before(() => {
        loadFileContentsStub = sinon
            .stub(BundleLoader.prototype, "loadFileContents")
            .resolves("mock bundle contents");
    });

    mocha.after(() => {
        loadFileContentsStub.restore();
    });

    mocha.afterEach(() => {
        onBrowserCloseEvent.resetHistory();
        onBrowserReadyEvent.resetHistory();
    });

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

    test("calls onBrowserReady when bundle intercepted", async () => {
        const instance = new BrowserManager(
            NoopTelemetryInstance,
            mockTabbedControlConfiguration,
            onBrowserCloseEvent,
            onBrowserReadyEvent,
            getWorkspaceFolder()
        );
        await instance.launch();
        sinon.assert.calledOnce(onBrowserReadyEvent);
    });
});
