/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { Page } from "puppeteer-core";
import { Disposable } from "vscode";

import { IPcfLaunchConfig } from "../configuration/types/IPcfLaunchConfig";
import { sleep } from "../utils";
import { ErrorReporter } from "../../common/ErrorReporter";

/**
 * The default delay after which to retry the navigation to the control.
 */
const DEFAULT_CONTROL_LOCATOR_RETRY_TIMEOUT = 2000;

/**
 * Default number of retries to locate a control.
 */
const DEFAULT_CONTROL_LOCATOR_RETRIES = -1;

/**
 * ControlLocator is a class which tries to navigate to a control once the page is loaded.
 * Depending on the control type this might involve navigating to a different tab.
 */
export class ControlLocator implements Disposable {
    /**
     * Absolute url where the control is located in the remote environment.
     */
    private readonly pageUrl: string;

    /**
     * Flag indicating if navigation to the control should be retried after failure.
     */
    private shouldRetryNavigation: boolean;

    /**
     * Flag indicating if the instance is disposed.
     */
    private isDisposed: boolean;

    /**
     * Creates a new instance of ControlLocator.
     * @param debugConfig Debug configuration.
     * @param logger Telemetry reporter.
     * @param controlLocatorRetryTimeout Delay after which to retry the navigation to the control.
     * @param controlLocatorRetries Number of retries to locate a control.
     */
    constructor(
        private readonly debugConfig: IPcfLaunchConfig,
        private readonly controlLocatorRetryTimeout: number = DEFAULT_CONTROL_LOCATOR_RETRY_TIMEOUT,
        private readonly controlLocatorRetries: number = DEFAULT_CONTROL_LOCATOR_RETRIES
    ) {
        this.pageUrl = this.getPageUrl();
        this.shouldRetryNavigation = true;
        this.isDisposed = false;
    }

    /**
     * Builds the url to the initial page based on configuration.
     * @returns Url to control.
     */
    private getPageUrl(): string {
        const url = this.debugConfig.url;
        const {
            appId,
            controlName: name,
            renderFullScreen: renderFullPage,
        } = this.debugConfig.controlLocation;

        if (renderFullPage) {
            // make sure that URL does not contain any path
            const urlWithoutPath = url.split("/").slice(0, 3).join("/");
            return `${urlWithoutPath}/main.aspx?appid=${appId}&pagetype=control&controlName=${name}`;
        }

        return url;
    }

    /**
     * Tries to navigate to the control.
     * @param page Puppeteer page.
     * @param retryCount Number of retries left.
     */
    public async navigateToControl(
        page: Page,
        retryCount: number = this.controlLocatorRetries
    ): Promise<void> {
        await this.navigateToPage(page, retryCount);
        await this.navigateToTab(page, retryCount);
    }

    /**
     * Navigates to the form page with a deep link. Will retry if the navigation fails.
     * @param page Puppeteer page.
     * @param retryCount Number of retries left. If -1, retries indefinitely.
     * @returns Promise which resolves when the navigation is complete or retries are exhausted.
     */
    private async navigateToPage(
        page: Page,
        retryCount: number = this.controlLocatorRetries
    ): Promise<void> {
        try {
            await page.goto(this.pageUrl);
        } catch (error) {
            ErrorReporter.report(
                "ControlLocator.navigateToPage.goto",
                error,
                "Could not navigate to form with url " + this.pageUrl,
                true,
                {
                    pageLink: this.pageUrl,
                    retryCount: `${retryCount}/${this.controlLocatorRetries}`,
                }
            );
            if (this.shouldRetry(retryCount)) {
                await sleep(this.controlLocatorRetryTimeout);
                return await this.navigateToPage(page, retryCount - 1);
            } else {
                this.throwErrorIfNotDisposed(error);
            }
        }
    }

    private throwErrorIfNotDisposed(error: unknown): void {
        // Protocol error is expected if the debugging session was disposed.
        if (this.isDisposed && (error as Error).name === "ProtocolError") {
            return;
        }
        throw error;
    }

    /**
     * Navigates to the tab within the form that the control is located at.
     * If the control is rendered as full screen, returns early.
     * @param page Puppeteer page.
     * @param retryCount Number of retries left. If -1, retries indefinitely.
     */
    private async navigateToTab(
        page: Page,
        retryCount: number = this.controlLocatorRetries
    ): Promise<void> {
        if (this.debugConfig.controlLocation.renderFullScreen) {
            return;
        }
        const tabName = this.debugConfig.controlLocation.tabName;

        try {
            await page.waitForSelector("ul[role='tablist']");
            await page.click(`li[aria-label='${tabName}']`);
        } catch (error) {
            if (this.shouldRetry(retryCount)) {
                await sleep(this.controlLocatorRetryTimeout);
                return await this.navigateToTab(page, retryCount - 1);
            } else {
                await ErrorReporter.report(
                    "ControlLocation.navigateToTab.navigation",
                    error,
                    "Could not navigate to tab.",
                    false,
                    { retryCount: "" + retryCount }
                );

                this.throwErrorIfNotDisposed(error);
            }
        }
    }

    /**
     * Checks if navigation should be retried.
     * @param retryCount Number of retries left.
     * @returns True if retry should be performed, false otherwise.
     */
    private shouldRetry(retryCount: number): boolean {
        return (
            this.shouldRetryNavigation &&
            !this.isDisposed &&
            (retryCount <= -1 || retryCount > 0)
        );
    }

    /**
     * Disposes the control locator.
     */
    public dispose(): void {
        this.isDisposed = true;
        if (this.shouldRetryNavigation) {
            this.shouldRetryNavigation = false;
        }
    }
}
