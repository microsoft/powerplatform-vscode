/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { NoopTelemetryInstance } from "../../../client/telemetry/NoopTelemetry";
import { BundleLoader } from "../../BundleLoader";
import { expectThrowsAsync, getWorkspaceFolder } from "../helpers";
import { TextDocument } from "vscode";
import { expect } from "chai";
import sinon from "sinon";
import { ErrorReporter } from "../../../common/ErrorReporter";
import {
    missingSourceMapBundle,
    validSourceMapBundle,
} from "../unit/SourceMapValidator.test";

describe("BundleLoader", () => {
    const mockFilePath = "mockFilePath";

    const getOpenTextDocumentMock = (
        hasSourceMap: boolean,
        rejects = false
    ): (() => Promise<TextDocument>) => {
        const bundleContents = hasSourceMap
            ? validSourceMapBundle
            : missingSourceMapBundle;
        return async () => {
            if (rejects) {
                throw new Error();
            }
            return {
                getText: () => bundleContents,
            } as TextDocument;
        };
    };

    it("returns file contents", async () => {
        const instance = new BundleLoader(
            mockFilePath,
            getWorkspaceFolder(),
            NoopTelemetryInstance,
            getOpenTextDocumentMock(true)
        );

        const fileContents = await instance.loadFileContents();
        expect(fileContents).to.equal(validSourceMapBundle);
    });

    it("warns if no source map", async () => {
        const reporterSpy = sinon.spy(ErrorReporter, "report");
        const instance = new BundleLoader(
            mockFilePath,
            getWorkspaceFolder(),
            NoopTelemetryInstance,
            getOpenTextDocumentMock(false)
        );
        await instance.loadFileContents();
        sinon.assert.calledWith(
            reporterSpy,
            sinon.match.any,
            "RequestInterceptor.warnIfNoSourceMap.error"
        );
        reporterSpy.restore();
    });

    it("throws error if load fails", () => {
        const instance = new BundleLoader(
            mockFilePath,
            getWorkspaceFolder(),
            NoopTelemetryInstance,
            getOpenTextDocumentMock(false, true)
        );

        expectThrowsAsync(() => instance.loadFileContents());
    });
});
