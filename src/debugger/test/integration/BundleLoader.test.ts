/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

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
            getOpenTextDocumentMock(false)
        );
        await instance.loadFileContents();
        expect(reporterSpy.calledWith("RequestInterceptor.warnIfNoSourceMap.error", undefined, `Could not find inlined source map in 'mockFilePath'. Make sure you enable source maps in webpack with 'devtool: "inline-source-map"'. For local debugging, inlined source maps are required.`));
        reporterSpy.restore();
    });

    it("throws error if load fails", () => {
        const instance = new BundleLoader(
            mockFilePath,
            getWorkspaceFolder(),
            getOpenTextDocumentMock(false, true)
        );

        expectThrowsAsync(() => instance.loadFileContents());
    });
});
