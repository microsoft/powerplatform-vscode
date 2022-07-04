import { EXTENSION_NAME } from "../../client/constants";
import { IPcfLaunchConfig } from "../configuration/types";
import * as vscode from "vscode";
import { expect } from "chai";
import { Browser } from "puppeteer-core";
import sinon from "sinon";

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

type BrowserMockResult = {
    browser: Browser;
    invokeBrowserOnCallback: () => void;
    invokePageOnceCallback: () => void;
};

export const getBrowserMock = (): BrowserMockResult => {
    let invokePageOnceCallback: () => void = () => undefined;
    let invokeBrowserOnCallback: () => void = () => undefined;
    const page = {
        goto: async () => undefined,
        waitForSelector: async () => undefined,
        click: async () => undefined,
        once: (event: string, callback: () => void) => {
            event === "close" && (invokePageOnceCallback = callback);
        },
    };
    const browser = {
        pages: async () => [page],
        newPage: async () => page,
        version: () => "0.0.mock",
        wsEndpoint: () => "mockEndpoint",
        process: () => ({ pid: "mockPID" }),
        close: () => undefined,
        on: (event: string, callback: () => void) => {
            event === "disconnected" && (invokeBrowserOnCallback = callback);
        },
    } as unknown as Browser;

    return { browser, invokeBrowserOnCallback, invokePageOnceCallback };
};

export const mockFileSystemWatcher = () => {
    return sinon.stub(vscode.workspace, "createFileSystemWatcher").returns({
        onDidChange: () => ({ dispose: () => undefined }),
    } as unknown as vscode.FileSystemWatcher);
};
