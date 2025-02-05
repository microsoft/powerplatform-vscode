/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import puppeteer, { Browser, Page } from "puppeteer-core";

import { FileWatcher } from "../FileWatcher";
import { RequestInterceptor } from "../RequestInterceptor";
import { ConfigurationManager } from "../configuration";
import { IPcfLaunchConfig } from "../configuration/types";
import { ControlLocator } from "../controlLocation";

import { BrowserLocator } from "./BrowserLocator";
import { ErrorReporter } from "../../common/ErrorReporter";
import { BrowserArgsBuilder } from "./BrowserArgsBuilder";
import { Disposable } from "vscode";
import { oneDSLoggerWrapper } from "../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";

/**
 * Callback that is invoked by the {@link BrowserManager browser manager} when the browser is closed.
 */
type OnBrowserClose = () => Promise<void>;

/**
 * Callback that is invoked by the {@link BrowserManager browser manager} when the browser is ready.
 * The browser is ready when the bundle has been requested.
 */
type OnBrowserReady = () => Promise<void>;

/**
 * Class that controls a {@link puppeteer.Browser puppeteer browser instance} and manages all logic that interacts with puppeteer including:
 * - {@link BrowserLocator} to locate the browser.
 * - {@link RequestInterceptor} to intercept and replace all requests for the pcf control bundle.
 * - {@link FileWatcher} to watch for local changes to the control bundle.
 * - {@link ControlLocator} to automatically navigate to the control within a Power App.
 */
export class BrowserManager implements Disposable {
    /**
     * Puppeteer {@link puppeteer.Browser browser} instance.
     * This will defined after calling {@link launch}.
     */
    private browserInstance?: Browser = undefined;

    /**
     * Callback that is invoked when the browser is closed.
     * Register this callback with {@link registerOnBrowserClose BrowserManager.registerOnBrowserClose}.
     */
    private onBrowserClose?: OnBrowserClose;

    /**
     * Callback that is invoked when the browser is ready. The browser is ready when the bundle has been requested.
     * Register this callback with {@link registerOnBrowserReady BrowserManager.registerOnBrowserReady}.
     */
    private onBrowserReady?: OnBrowserReady;

    /**
     * Flag indicating whether this instance is disposed.
     */
    private isDisposed = false;

    /**
     * Returns the browser instance process id.
     * @returns Browser process id.
     */
    private get browserInstancePID(): string {
        return `${this.browserInstance?.process()?.pid}` || "undefined";
    }

    /**
     * Creates a new Launch manager instance.
     * @param bundleWatcher Watches for local changes to the bundle file to allow for hot reload.
     * @param bundleInterceptor Intercepts all puppeteer requests and answers with the contents of the local version of the pcf control bundle.
     * @param controlLocator Navigates the puppeteer browser to the location of the pcf control within the Power App.
     * @param browserLocator Manager to locate the browser executable.
     * @param debugConfig Launch configuration.
     * @param logger Telemetry reporter used to emit telemetry events.
     * @param puppeteerLaunchWrapper [Optional] Wrapper around {@link puppeteer.launch}. Can be used to overwrite the puppeteer launch method for testing.
     */
    constructor(
        private readonly bundleWatcher: FileWatcher,
        private readonly bundleInterceptor: RequestInterceptor,
        private readonly controlLocator: ControlLocator,
        private readonly browserLocator: BrowserLocator,
        private readonly debugConfig: IPcfLaunchConfig,
        private readonly puppeteerLaunchWrapper = puppeteer.launch
    ) { }

    /**
     * Registers the callback that is invoked when the browser is closed.
     * @param onBrowserClose Callback to invoke
     */
    public registerOnBrowserClose(onBrowserClose: OnBrowserClose): void {
        this.onBrowserClose = onBrowserClose;
    }

    /**
     * Callback that is invoked when the browser is ready. The browser is ready when the bundle has been requested.
     * @param onBrowserReady Callback to invoke
     */
    public registerOnBrowserReady(onBrowserReady: OnBrowserReady): void {
        this.onBrowserReady = onBrowserReady;
    }

    /**
     * Launches a new browser instance or attaches to existing one.
     * This method is the main entry point. It is called from the `Debugger` once debugging is started.
     */
    public async launch(): Promise<void> {
        const telemetryProps = {
            debugConfig: JSON.stringify(this.debugConfig),
            browserFlavor: ConfigurationManager.getBrowserFlavor(),
        };
        oneDSLoggerWrapper.getLogger().traceInfo("BrowserManager.launch", telemetryProps);

        const browser = await this.getBrowser();
        const pages = await browser.pages();

        if (pages.length > 0) {
            try {
                await this.registerPage(pages[0]);
            } catch (error) {
                await ErrorReporter.report(
                    "BrowserManager.launch.registerPage",
                    error,
                    "Could not register page",
                    true,
                    telemetryProps
                );
                throw error;
            }
        } else {
            const message =
                "Could not start browser. Please try again. Browser instance does not have any active pages.";
            await ErrorReporter.report(
                "BrowserManager.launch.noPages",
                undefined,
                message,
                true
            );
            throw new Error(message);
        }
    }

    /**
     * Retrieves the {@link puppeteer.Browser puppeteer browser instance}. If the browser instance hasn't been created yet, it will create one.
     * @returns Browser instance.
     */
    private async getBrowser(): Promise<Browser> {
        if (this.browserInstance) {
            return this.browserInstance;
        }

        const { port, userDataDir } =
            ConfigurationManager.getRemoteEndpointSettings(this.debugConfig);

        // Launch a new instance
        const browserPath = await this.browserLocator.getPath();

        try {
            this.browserInstance = await this.launchPuppeteerInstance(
                browserPath,
                port,
                userDataDir
            );

            // make sure we remove the reference to the browser instance when it is closed
            this.browserInstance.on("disconnected", () => {
                this.browserInstance = undefined;
            });
            const version = await this.browserInstance.version();
            oneDSLoggerWrapper.getLogger().traceInfo("BrowserManager.getBrowser", {
                port: `${port}`,
                processId: this.browserInstancePID,
                wsEndpoint: this.browserInstance.wsEndpoint() || "unknown",
                version,
            });

            return this.browserInstance;
        } catch (error) {
            await ErrorReporter.report(
                "BrowserManager.getBrowser",
                error,
                "Could not launch browser Please check your settings and try again."
            );

            throw error;
        }
    }

    /**
     * Launch the specified puppeteer browser with remote debugging enabled.
     * @param browserPath The path of the browser to launch.
     * @param port The port on which to enable remote debugging.
     * @param userDataDir The user data directory for the launched instance.
     * @returns The browser process.
     */
    private async launchPuppeteerInstance(
        browserPath: string,
        port: number,
        userDataDir?: string
    ) {
        const argsBuilder = new BrowserArgsBuilder(port, userDataDir);
        const args = argsBuilder.build();
        const browserInstance = await this.puppeteerLaunchWrapper({
            executablePath: browserPath,
            args,
            headless: false,
            defaultViewport: null,
        });
        return browserInstance;
    }

    /**
     * Performs actions to register a page with different managers to allow request interception, event logging and navigation to the control.
     * @param page Page to register.
     */
    private async registerPage(page: Page) {
        /**
         * Disposes of all the managers related to this debugging session.
         */
        const disposeSession = async () => {
            this.onBrowserClose && (await this.onBrowserClose());
            this.disposeSessionInstances();
        };

        page.once("close", () => {
            void disposeSession();
        });

        const onFileChangeHandler = async () => {
            await this.bundleInterceptor?.reloadFileContents();
            await this.controlLocator?.navigateToControl(page);
        };

        const onBundleLoaded = async () => {
            this.onBrowserReady && (await this.onBrowserReady());
        };
        this.bundleWatcher.register(onFileChangeHandler);
        try {
            await this.bundleInterceptor?.register(page, onBundleLoaded);
            await this.controlLocator?.navigateToControl(page);
        } catch (error) {
            await ErrorReporter.report(
                "BrowserManager.registerPage",
                error,
                "Failed to start browser session."
            );
            await disposeSession();
        }
    }

    /**
     * Dispose this instance.
     */
    public dispose() {
        if (this.isDisposed) {
            return;
        }
        const disposeAsync = async () => {
            if (this.browserInstance) {
                await this.browserInstance.close();
                this.browserInstance = undefined;
            }
        };
        this.onBrowserClose = undefined;
        this.onBrowserReady = undefined;
        this.disposeSessionInstances();
        void disposeAsync();
        this.isDisposed = true;
    }

    /**
     * Disposes the current session instances.
     */
    private disposeSessionInstances() {
        this.controlLocator.dispose();
        this.bundleInterceptor.dispose();
        this.bundleWatcher.dispose();
    }
}
