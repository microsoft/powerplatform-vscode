/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import sinon from "sinon";
import {
    getMockBrowser,
    getMockBrowserLocator,
    getMockControlLocator,
    getMockFileWatcher,
    getMockRequestInterceptor,
    mockTabbedControlConfiguration,
} from "../helpers";
import { BrowserManager } from "../../browser/";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";

describe("BrowserManager", () => {
    beforeEach(() => {
        sinon.stub(oneDSLoggerWrapper, 'getLogger').returns({
            traceInfo: sinon.stub(),
            traceError: sinon.stub(),
            traceWarning: sinon.stub(),
            featureUsage: sinon.stub(),
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    const getInstance = (
        fireBundleIntercepted: boolean,
        fireOnBrowserClose: boolean,
        fireOnBrowserDisconnect: boolean,
        fireOnRequest: boolean
    ): BrowserManager => {
        const browser = getMockBrowser(
            fireOnBrowserClose,
            fireOnBrowserDisconnect,
            fireOnRequest
        );
        const bundleWatcher = getMockFileWatcher();
        const bundleInterceptor = getMockRequestInterceptor(
            fireBundleIntercepted
        );
        const controlLocator = getMockControlLocator();
        const browserLocator = getMockBrowserLocator();
        const puppeteerLaunchMock = async () => browser;
        return new BrowserManager(
            bundleWatcher,
            bundleInterceptor,
            controlLocator,
            browserLocator,
            mockTabbedControlConfiguration,
            puppeteerLaunchMock
        );
    };

    it("calls onBrowserReady when bundle intercepted", async () => {
        const instance = getInstance(true, false, false, false);
        const browserReadyStub = sinon.spy();
        instance.registerOnBrowserReady(browserReadyStub);
        await instance.launch();
        sinon.assert.calledOnce(browserReadyStub);
    });

    it("calls onBrowserClose when browser closed", async () => {
        const instance = getInstance(false, true, false, false);
        const browserCloseStub = sinon.spy();
        instance.registerOnBrowserClose(browserCloseStub);
        await instance.launch();
        sinon.assert.calledOnce(browserCloseStub);
    });
});
