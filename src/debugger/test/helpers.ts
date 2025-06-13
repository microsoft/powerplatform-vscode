/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { EXTENSION_NAME } from "../../common/constants";
import { IPcfLaunchConfig } from "../configuration/types";
import * as vscode from "vscode";
import { expect } from "chai";
import { Browser, HTTPRequest, Page } from "puppeteer-core";
import sinon from "sinon";
import { FileWatcher } from "../FileWatcher";
import { BundleLoader } from "../BundleLoader";
import { RequestInterceptor } from "../RequestInterceptor";
import { ControlLocator } from "../controlLocation";
import { BrowserLocator } from "../browser/BrowserLocator";
import { BrowserManager } from "../browser";
import { validSourceMapBundle } from "./unit/SourceMapValidator.test";

export const getWorkspaceFolder = () => {
    const workspace: vscode.WorkspaceFolder = {
        uri: vscode.Uri.file("some/path"),
        index: 0,
        name: "Workspace",
    };
    return workspace;
};

export const mockTabbedControlConfiguration: IPcfLaunchConfig = {
    browserFlavor: "Default",
    controlLocation: {
        renderFullScreen: false,
        tabName: "Control Tab",
        controlName: "Control Name",
    },
    file: "${workspaceFolder}/controls/my-control/out/controls/src/bundle.js",
    name: "Debug Control",
    port: 1234,
    request: "attach",
    type: `${EXTENSION_NAME}.debug`,
    url: "https://ORG_URL.crm.dynamics.com/with/path",
    useDefaultUserDataProfile: false,
    userDataDir: undefined,
    webRoot: "${workspaceFolder}/controls/my-control",
};

export const mockFullscreenControlConfiguration: IPcfLaunchConfig = {
    ...mockTabbedControlConfiguration,
    controlLocation: {
        renderFullScreen: true,
        controlName: "ControlName",
        appId: "f96ac8ee-529f-4510-af13-3fe5ff45f2b6",
    },
};

export const expectThrowsAsync = async <T>(
    fn: () => Promise<T>
): Promise<void> => {
    let caughtError: unknown = undefined;
    let result: T | undefined = undefined;
    try {
        result = await fn();
    } catch (error) {
        caughtError = error;
    }
    expect(
        result,
        "expected function to throw but got result instead: " +
        JSON.stringify(result)
    ).to.be.undefined;
    expect(caughtError, "expected function to throw but error was undefined.")
        .to.not.be.undefined;
};

export const getRequest = (
    url: string,
    method: string,
    respondSpy: sinon.SinonSpy<unknown[], unknown> = sinon.spy(),
    continueSpy: sinon.SinonSpy<unknown[], unknown> = sinon.spy()
): HTTPRequest => {
    return {
        method: () => method,
        url: () => url,
        respond: respondSpy,
        continue: continueSpy,
    } as unknown as HTTPRequest;
};

const getBundleRequest = () =>
    getRequest(
        "https://someOrg.com/webresources/publisher.ControlName/bundle.js",
        "GET"
    );

export const getMockBrowser = (
    invokePageOnceCloseCallback: boolean,
    invokeBrowserOnDisconnectedCallback: boolean,
    invokePageOnRequestCallback: boolean
): Browser => {
    const page = {
        goto: async () => undefined,
        waitForSelector: async () => undefined,
        click: async () => undefined,
        once: (event: string, callback: () => void) => {
            event === "close" && invokePageOnceCloseCallback && callback();
        },
        on: (event: string, callback: (request: HTTPRequest) => void) => {
            event === "request" &&
                invokePageOnRequestCallback &&
                callback(getBundleRequest());
        },
        setRequestInterception: () => undefined,
    };
    const browser = {
        pages: async () => [page],
        newPage: async () => page,
        version: () => "0.0.mock",
        wsEndpoint: () => "mockEndpoint",
        process: () => ({ pid: "mockPID" }),
        close: () => undefined,
        on: (event: string, callback: () => void) => {
            event === "disconnected" &&
                invokeBrowserOnDisconnectedCallback &&
                callback();
        },
    } as unknown as Browser;

    return browser;
};

export const mockFileSystemWatcher = () => {
    return sinon.stub(vscode.workspace, "createFileSystemWatcher").returns({
        onDidChange: () => ({ dispose: () => undefined }),
    } as unknown as vscode.FileSystemWatcher);
};

export const getMockFileWatcher = (invokeOnRegister = false): FileWatcher => {
    const fileWatcherMock = sinon.createStubInstance(FileWatcher);
    if (invokeOnRegister) {
        const mockRegister = (cb: () => Promise<void>) => {
            void cb();
        };
        fileWatcherMock.register =
            fileWatcherMock.register.callsFake(mockRegister);
    }
    return fileWatcherMock;
};

export const getMockBundleLoader = (
    fileContents = validSourceMapBundle
): BundleLoader => {
    const bundleLoaderMock = sinon.createStubInstance(BundleLoader);
    bundleLoaderMock.loadFileContents.resolves(fileContents);
    return bundleLoaderMock;
};

export const getMockRequestInterceptor = (
    invokeOnRegister = false
): RequestInterceptor => {
    const requestInterceptorMock = sinon.createStubInstance(RequestInterceptor);
    if (invokeOnRegister) {
        const mockRegister = async (
            page: Page,
            onRequestIntercepted?: (fileName: string) => Promise<void> | void
        ) => {
            if (onRequestIntercepted) {
                await onRequestIntercepted("mockFileName");
            }
        };
        requestInterceptorMock.register.callsFake(mockRegister);
    }
    return requestInterceptorMock;
};

export const getMockControlLocator = (): ControlLocator => {
    const controlLocatorMock = sinon.createStubInstance(ControlLocator);
    return controlLocatorMock;
};

export const getMockBrowserLocator = (
    path = "browser/path"
): BrowserLocator => {
    const browserManagerMock = sinon.createStubInstance(BrowserLocator);
    browserManagerMock.getPath.resolves(path);
    return browserManagerMock;
};

export const getMockBrowserManager = (
    invokeOnBrowserClose = false,
    invokeOnBrowserReady = false
): BrowserManager => {
    const browserManagerMock = sinon.createStubInstance(BrowserManager);
    if (invokeOnBrowserClose) {
        const mockOnBrowserClose = (cb: () => Promise<void>) => {
            void cb();
        };
        browserManagerMock.registerOnBrowserClose.callsFake(mockOnBrowserClose);
    }

    if (invokeOnBrowserReady) {
        const mockOnBrowserReady = (cb: () => Promise<void>) => {
            void cb();
        };
        browserManagerMock.registerOnBrowserReady.callsFake(mockOnBrowserReady);
    }
    return browserManagerMock;
};
