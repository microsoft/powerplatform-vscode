import { NoopTelemetryInstance } from "../../../client/telemetry/NoopTelemetry";
import { BundleLoader } from "../../BundleLoader";
import {
    expectThrowsAsync,
    getWorkspaceFolder,
    missingSourceMapBundle,
    validSourceMapBundle,
} from "../helpers";
import { TextDocument } from "vscode";
import { expect } from "chai";
import sinon from "sinon";
import { ErrorReporter } from "../../../common/ErrorReporter";

suite("BundleLoader", () => {
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

    test("returns file contents", async () => {
        const instance = new BundleLoader(
            mockFilePath,
            getWorkspaceFolder(),
            NoopTelemetryInstance,
            getOpenTextDocumentMock(true)
        );

        const fileContents = await instance.loadFileContents();
        expect(fileContents).to.equal(validSourceMapBundle);
    });

    test("warns if no source map", async () => {
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

    test("throws error if load fails", () => {
        const instance = new BundleLoader(
            mockFilePath,
            getWorkspaceFolder(),
            NoopTelemetryInstance,
            getOpenTextDocumentMock(false, true)
        );

        expectThrowsAsync(() => instance.loadFileContents());
    });
});
