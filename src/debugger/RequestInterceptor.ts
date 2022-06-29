/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

import path from "path";

import { EventEmitter, HTTPRequest, Page } from "puppeteer-core";
import {
    Disposable,
    TextDocument,
    Uri,
    WorkspaceFolder,
    workspace,
} from "vscode";
import { ITelemetry } from "../client/telemetry/ITelemetry";
import { ErrorReporter } from "../common/ErrorReporter";

import { SourceMapValidator } from "./SourceMapValidator";
type OnRequestInterceptedCallback = (fileName: string) => Promise<void> | void;

/**
 * Class that controls a Puppeteer page and replaces a request to a specific file with contents from a local file.
 */
export class RequestInterceptor implements Disposable {
    /**
     * The regex that matches the request for the bundle file that is being intercepted.
     * @example "https://YOUR_ORG.crm4.dynamics.com/%7b637920349270000192%7d/webresources/publisher.ControlName/bundle.js"
     */
    private static webRequestUrlRegex = /.*\/webresources\/.*\/bundle.js/;

    /**
     * Absolute path to the bundle on local disk.
     */
    private readonly filePath: string;

    /**
     * Name of the bundle.
     * @example "bundle.js"
     */
    private readonly fileName: string;

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
        private readonly relativeFilePath: string,
        private readonly workspaceFolder: WorkspaceFolder,
        private readonly logger: ITelemetry
    ) {
        this.filePath = this.getAbsoluteFilePath(this.relativeFilePath);
        this.fileName = path.basename(this.filePath);
    }

    /**
     * Gets the absolute path to the file to be intercepted.
     * @param filePath The relative path to the file to be intercepted.
     * @returns The absolute path to the file to be intercepted.
     */
    private getAbsoluteFilePath(filePath: string): string {
        const workspacePath = this.workspaceFolder.uri.path;

        const parsedPath = Uri.parse(filePath);
        console.log(parsedPath);
        if (parsedPath.path.startsWith(workspacePath)) {
            return filePath;
        }

        return path.join(workspacePath, filePath);
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
        this.fileContents = await this.loadFileContents();

        this.onRequestHandler = (event) =>
            this.onRequest(event, onRequestIntercepted);
        this.requestEvent = page.on("request", this.onRequestHandler);
        await page.setRequestInterception(true);
    }

    /**
     * Reloads the changed file contents.
     */
    public async reloadFileContents(): Promise<void> {
        this.fileContents = await this.loadFileContents();
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
            await onRequestIntercepted(this.fileName);
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
     * Loads the file contents of the bundle from disk.
     * @returns The string contents of the file.
     */
    private async loadFileContents(): Promise<string> {
        try {
            const file: TextDocument = await workspace.openTextDocument(
                Uri.file(this.filePath)
            );
            const fileContent = file.getText();
            await this.warnIfNoSourceMap(fileContent);

            return fileContent;
        } catch (error) {
            await ErrorReporter.report(
                this.logger,
                "RequestInterceptor.loadFileContents.error",
                error,
                "Could not load file contents"
            );
            throw new Error(
                `Could not load control '${this.fileName}' with path '${
                    this.filePath
                }': ${error instanceof Error ? error.message : error}`
            );
        }
    }

    /**
     * Checks if the bundle has an inlined source map.
     * If not, it will show an warning message.
     * @param fileContent The file contents.
     */
    private async warnIfNoSourceMap(fileContent: string): Promise<void> {
        const isValid = SourceMapValidator.isValid(fileContent);
        if (isValid) {
            return;
        }

        await ErrorReporter.report(
            this.logger,
            "RequestInterceptor.warnIfNoSourceMap.error",
            undefined,
            `Could not find inlined source map in '${this.fileName}'. Make sure you enable source maps in webpack with 'devtool: "inline-source-map"'. For local debugging, inlined source maps are required.`
        );
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
