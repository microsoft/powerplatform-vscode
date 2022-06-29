/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

import { Page } from "puppeteer-core";
import { Disposable } from "vscode";

import {
    CONTROL_LOCATOR_RETRIES,
    CONTROL_LOCATOR_RETRY_TIMEOUT,
} from "../Constants";
import { IPcfLaunchConfig } from "../configuration/types/IPcfLaunchConfig";
import { sleep } from "../utils";
import { ITelemetry } from "../../client/telemetry/ITelemetry";
import { ErrorReporter } from "../../common/ErrorReporter";

/**
 * ControlLocator is a class which tries to navigate to a control once the page is loaded.
 * Depending on the control type this might involve navigating to a different tab.
 */
export class ControlLocator implements Disposable {
    private readonly pageLink: string;
    private shouldRetryNavigation: boolean;
    private isDisposed: boolean;

    /**
     * Creates a new instance of ControlLocator.
     * @param debugConfig Debug configuration.
     * @param logger Telemetry reporter.
     */
    constructor(
        private readonly debugConfig: IPcfLaunchConfig,
        private readonly logger: ITelemetry
    ) {
        this.pageLink = this.getPageLink();
        this.shouldRetryNavigation = true;
        this.isDisposed = false;
    }

    /**
     * Builds the link to the initial page based on configuration.
     * @returns Link to control.
     */
    public getPageLink(): string {
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
        retryCount: number = CONTROL_LOCATOR_RETRIES
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
        retryCount: number = CONTROL_LOCATOR_RETRIES
    ): Promise<void> {
        try {
            await page.goto(this.pageLink);
        } catch (error) {
            ErrorReporter.report(
                this.logger,
                "ControlLocator.navigateToPage.goto",
                error,
                "Could not navigate to form with url " + this.pageLink,
                true,
                { pageLink: this.pageLink, retryCount: "" + retryCount }
            );
            if (this.shouldRetry(retryCount)) {
                await sleep(CONTROL_LOCATOR_RETRY_TIMEOUT);
                return await this.navigateToPage(page, retryCount - 1);
            }
        }
    }

    /**
     * Navigates to the tab within the form that the control is located at.
     * If the control is rendered as full screen, returns early.
     * @param page Puppeteer page.
     * @param retryCount Number of retries left. If -1, retries indefinitely.
     */
    private async navigateToTab(
        page: Page,
        retryCount: number = CONTROL_LOCATOR_RETRIES
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
                await sleep(CONTROL_LOCATOR_RETRY_TIMEOUT);
                return await this.navigateToTab(page, retryCount - 1);
            } else {
                await ErrorReporter.report(
                    this.logger,
                    "ControlLocation.navigateToTab.navigation",
                    error,
                    "Could not navigate to tab.",
                    false,
                    { retryCount: "" + retryCount }
                );

                // Protocol error is expected if the debugging session was disposed.
                if (
                    this.isDisposed &&
                    (error as Error).name === "ProtocolError"
                ) {
                    return;
                }
                throw error;
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
