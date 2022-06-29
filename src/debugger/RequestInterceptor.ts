/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

import { EventEmitter, HTTPRequest, Page } from "puppeteer-core";
import { Disposable, WorkspaceFolder } from "vscode";
import { ITelemetry } from "../client/telemetry/ITelemetry";
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
     * Name of the bundle.
     * @example "bundle.js"
     */
    // private readonly fileName: string;

    private readonly bundleLoader: BundleLoader;

    /**
     * Callback for `puppeteer.on("request")`.
     */
    private onRequestHandler?: (request: HTTPRequest) => void;

    /**
     * Event emitter for {@link onRequestHandler} used to unregister the event.
     */
    private requestEvent?: EventEmitter;

    /**
     * Contents of the pcf control bundle.
     */
    private fileContents?: string;

    /**
     * Creates a new RequestInterceptor instance.
     * @param relativeFilePath The relative path to the file to be intercepted.
     * @param workspaceFolder The workspace folder that contains the file to be intercepted.
     * @param logger The telemetry reporter to use for telemetry events.
     */
    constructor(
        relativeFilePath: string,
        workspaceFolder: WorkspaceFolder,
        private readonly logger: ITelemetry
    ) {
        // const filePath = this.getAbsoluteFilePath(this.relativeFilePath);
        // this.fileName = path.basename(filePath);
        this.bundleLoader = new BundleLoader(
            relativeFilePath,
            workspaceFolder,
            this.logger
        );
    }

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
        const handleRequest = async (request: HTTPRequest) => {
            if (
                request.method() === "GET" &&
                request.url().match(RequestInterceptor.webRequestUrlRegex)
            ) {
                await this.respondWithPcfBundle(request, onRequestIntercepted);
            } else {
                await this.respondWithOriginalResource(request);
            }
        };

        void handleRequest(request);
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
                this.logger,
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
                this.logger,
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
