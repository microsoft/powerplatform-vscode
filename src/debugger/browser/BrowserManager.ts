/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

import puppeteer, { Browser, Page } from "puppeteer-core";
import * as vscode from "vscode";

import { FileWatcher } from "../FileWatcher";
import { RequestInterceptor } from "../RequestInterceptor";
import { ConfigurationManager } from "../configuration";
import { IPcfLaunchConfig } from "../configuration/types";
import { ControlLocator } from "../controlLocation";

import { BrowserLocator } from "./BrowserLocator";
import { ITelemetry } from "../../client/telemetry/ITelemetry";
import { ErrorReporter } from "../../common/ErrorReporter";
import { BrowserArgsBuilder } from "./BrowserArgsBuilder";

/**
 * Callback that is invoked when the browser is closed.
 */
type OnBrowserClose = () => Promise<void>;

/**
 * Callback that is invoked when the browser is ready.
 * The browser is ready when the bundle has been requested.
 */
type OnBrowserReady = () => Promise<void>;

/**
 *
 */
export class BrowserManager implements vscode.Disposable {
    private browserInstance?: Browser;
    private readonly browserLocator: BrowserLocator;

    /**
     * Returns the browser instance process id.
     * @returns Browser process id.
     */
    private get browserInstancePID(): string {
        return `${this.browserInstance?.process()?.pid}` || "undefined";
    }

    /**
     * Creates a new Launch manager instance.
     * @param logger Telemetry reporter used to emit telemetry events.
     * @param debugConfig Launch configuration.
     * @param onBrowserClose Callback that is invoked when the browser is closed.
     * @param onBrowserReady Callback that is invoked when the browser is ready. The browser is ready when the bundle has been requested.
     * @param workspaceFolder The workspace folder.
     */
    constructor(
        private readonly logger: ITelemetry,
        private readonly debugConfig: IPcfLaunchConfig,
        private readonly onBrowserClose: OnBrowserClose,
        private readonly onBrowserReady: OnBrowserReady,
        private readonly workspaceFolder: vscode.WorkspaceFolder
    ) {
        this.browserLocator = new BrowserLocator(this.debugConfig, this.logger);
    }

    /**
     * Launches a new browser instance or attaches to existing one.
     */
    public async launch(): Promise<void> {
        const telemetryProps = {
            debugConfig: JSON.stringify(this.debugConfig),
            browserFlavor: ConfigurationManager.getBrowserFlavor(),
        };
        this.logger.sendTelemetryEvent("BrowserManager.launch", telemetryProps);

        if (this.browserInstance) {
            // try to open a new tab with an existing browser instance
            await this.attachToExistingBrowser(this.browserInstance);
            return;
        }

        const browser = await this.getBrowser();
        const pages = await browser.pages();

        if (pages.length > 0) {
            try {
                await this.registerPage(pages[0]);
            } catch (error) {
                await ErrorReporter.report(
                    this.logger,
                    "BrowserManager.launch.registerPage",
                    error,
                    "Could not register page",
                    true,
                    telemetryProps
                );
                return;
            }
        } else {
            await ErrorReporter.report(
                this.logger,
                "BrowserManager.launch.noPages",
                undefined,
                "Could not start browser. Please try again. Browser instance does not have any active pages.",
                true
            );
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
        const browserInstance = await puppeteer.launch({
            executablePath: browserPath,
            args,
            headless: false,
            defaultViewport: null,
        });
        return browserInstance;
    }

    /**
     * Creates a new page within an existing browser instance if user agrees.
     * @param browser Existing browser instance.
     * @returns Page instance.
     */
    private async attachToExistingBrowser(
        browser: Browser
    ): Promise<Page | undefined> {
        // ask the user if they want to attach to an existing browser
        const userAnswer = await vscode.window.showInformationMessage(
            "There is an existing instance running. Do you want to open a new tab or cancel?",
            "Yes",
            "Cancel"
        );

        if (userAnswer !== "Yes") {
            return;
        }

        try {
            const page = await browser.newPage();
            await this.registerPage(page);
            return page;
        } catch (error) {
            ErrorReporter.report(
                this.logger,
                "BrowserManager.attachToExistingBrowser",
                error,
                "Could not register page."
            );
            throw error;
        }
    }

    /**
     * Retrieves the browser instance. If the browser instance hasn't been created yet, it will create one.
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
            this.logger.sendTelemetryEvent("BrowserManager.getBrowser", {
                port: `${port}`,
                processId: this.browserInstancePID,
                wsEndpoint: this.browserInstance.wsEndpoint() || "unknown",
                version,
            });

            return this.browserInstance;
        } catch (error) {
            await ErrorReporter.report(
                this.logger,
                "BrowserManager.getBrowser",
                error,
                "Could not launch browser Please check your settings and try again."
            );

            throw error;
        }
    }

    /**
     * Performs actions to register a page with different managers to allow request interception, event logging and navigation to the control.
     * @param page Page to register.
     */
    private async registerPage(page: Page) {
        const locator = new ControlLocator(this.debugConfig, this.logger);
        const bundleInterceptor = new RequestInterceptor(
            this.debugConfig.file,
            this.workspaceFolder,
            this.logger
        );

        /**
         * Disposes of all the managers related to this debugging session.
         */
        const disposeSession = async () => {
            await this.onBrowserClose();
            bundleWatcher.dispose();
            bundleInterceptor.dispose();
            locator.dispose();
        };

        const onFileChangeHandler = async () => {
            await bundleInterceptor.reloadFileContents();
            await locator.navigateToControl(page);
        };

        const onBundleLoaded = async () => {
            await this.onBrowserReady();
            page.once("close", () => {
                void disposeSession();
            });
        };
        const bundleWatcher = new FileWatcher(
            this.debugConfig.file,
            onFileChangeHandler,
            this.workspaceFolder,
            this.logger
        );
        try {
            await bundleInterceptor.register(page, onBundleLoaded);
            await locator.navigateToControl(page);
        } catch (error) {
            await ErrorReporter.report(
                this.logger,
                "BrowserManager.registerPage",
                error,
                "Failed to start debugging session."
            );
            await disposeSession();
        }
    }

    /**
     * Dispose this object.
     */
    dispose() {
        const disposeAsync = async () => {
            if (this.browserInstance) {
                await this.browserInstance.close();
                this.browserInstance = undefined;
            }
        };
        void disposeAsync();
    }
}
