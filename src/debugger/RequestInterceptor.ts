/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { EventEmitter, HTTPRequest, Page } from "puppeteer-core";
import { Disposable } from "vscode";
import { ErrorReporter } from "../common/ErrorReporter";
import { BundleLoader } from "./BundleLoader";

type OnRequestInterceptedCallback = (fileName: string) => Promise<void> | void;

/**
 * Class that controls a Puppeteer page and replaces a request to a specific file with contents from a local file.
 */
export class RequestInterceptor implements Disposable {
    /**
     * The regex that matches the request for the bundle file that is being intercepted.
     * @example "https://YOUR_ORG.crm4.dynamics.com/%7b637920349270000192%7d/webresources/publisher.ControlName/bundle.js"
     */
    private static readonly webRequestUrlRegex =
        /.*\/webresources\/.*\/bundle.js/;

    /**
     * Callback for `puppeteer.on("request")`.
     */
    private onRequestHandler?: (request: HTTPRequest) => void;

    /**
     * Event emitter for {@link onRequestHandler} used to unregister the event.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private requestEvent?: EventEmitter<any>;

    /**
     * Contents of the pcf control bundle.
     */
    private fileContents?: string;

    /**
     * Creates a new RequestInterceptor instance.
     * @param bundleLoader Manager to load the contents of the bundle file.
     * @param logger The telemetry reporter to use for telemetry events.
     */
    constructor(
        private readonly bundleLoader: BundleLoader
    ) { }

    /**
     * Starts intercepting requests to the specified file.
     * @param page The page to intercept requests on.
     * @param onRequestIntercepted An optional callback that is invoked when a request is intercepted.
     */
    public async register(
        page: Page,
        onRequestIntercepted?: OnRequestInterceptedCallback
    ): Promise<void> {
        // don't re-register if we already have a request event
        if (this.requestEvent) {
            return;
        }
        this.fileContents = await this.bundleLoader.loadFileContents();

        this.onRequestHandler = (event) =>
            this.onRequest(event, onRequestIntercepted);
        this.requestEvent = page.on("request", this.onRequestHandler);
        await page.setRequestInterception(true);
    }

    /**
     * Reloads the changed file contents.
     */
    public async reloadFileContents(): Promise<void> {
        this.fileContents = await this.bundleLoader.loadFileContents();
    }

    /**
     * Handles every request of the specified page.
     * @param request The request to handle.
     * @param onRequestIntercepted An optional callback that is invoked when a request is intercepted.
     */
    private onRequest(
        request: HTTPRequest,
        onRequestIntercepted?: OnRequestInterceptedCallback
    ): void {
        this.isRequestForBundle(request)
            ? void this.respondWithPcfBundle(request, onRequestIntercepted)
            : void this.respondWithOriginalResource(request);
    }

    /**
     * Checks if a network request is for the bundle file.
     * @param request The request to check.
     * @returns true if the request should be intercepted with local bundle, false otherwise.
     */
    private isRequestForBundle(request: HTTPRequest): boolean {
        return (
            request.method() === "GET" &&
            !!request.url().match(RequestInterceptor.webRequestUrlRegex)
        );
    }

    /**
     * Respond with the file contents of the local bundle.
     * @param request The request to handle.
     * @param onRequestIntercepted An optional callback that is invoked when a request is intercepted.
     * @returns A promise that resolves when the request has been handled.
     */
    private async respondWithPcfBundle(
        request: HTTPRequest,
        onRequestIntercepted?: OnRequestInterceptedCallback
    ): Promise<void> {
        try {
            await request.respond({
                status: 200,
                contentType: "text/javascript",
                body: this.fileContents,
            });
        } catch (error) {
            void ErrorReporter.report(
                "RequestInterceptor.onRequest.respond.error",
                error,
                "Could not respond to request"
            );
            return;
        }

        if (onRequestIntercepted) {
            await onRequestIntercepted(this.bundleLoader.fileName);
        }
    }

    /**
     * Responds with the original, requested file contents.
     * This method is called for each request that is not the bundle.
     * @param request The request to handle.
     */
    private async respondWithOriginalResource(
        request: HTTPRequest
    ): Promise<void> {
        try {
            await request.continue();
        } catch (error) {
            void ErrorReporter.report(
                "RequestInterceptor.respondWithOriginalResource.error",
                error,
                "Could not respond to non-bundle request",
                false
            );
        }
    }

    /**
     * Disposes the request interceptor.
     */
    dispose() {
        if (this.requestEvent && this.onRequestHandler) {
            this.requestEvent.off("request", this.onRequestHandler);
            this.requestEvent = undefined;
        }

        this.fileContents = undefined;
    }
}
