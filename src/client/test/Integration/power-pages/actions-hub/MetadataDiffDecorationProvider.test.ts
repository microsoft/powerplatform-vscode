/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import * as sinon from "sinon";
import { MetadataDiffDecorationProvider } from "../../../../power-pages/actions-hub/MetadataDiffDecorationProvider";
import { METADATA_DIFF_URI_SCHEME } from "../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffFileTreeItem";
import { FileComparisonStatus } from "../../../../power-pages/actions-hub/models/IFileComparisonResult";
import { Constants } from "../../../../power-pages/actions-hub/Constants";

describe("MetadataDiffDecorationProvider", () => {
    let sandbox: sinon.SinonSandbox;
    let provider: MetadataDiffDecorationProvider;
    let cancellationToken: vscode.CancellationToken;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        // Reset singleton instance by accessing it through getInstance
        // and disposing if necessary
        provider = MetadataDiffDecorationProvider.getInstance();
        cancellationToken = new vscode.CancellationTokenSource().token;
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("getInstance", () => {
        it("should return a singleton instance", () => {
            const instance1 = MetadataDiffDecorationProvider.getInstance();
            const instance2 = MetadataDiffDecorationProvider.getInstance();

            expect(instance1).to.equal(instance2);
        });

        it("should return an instance of MetadataDiffDecorationProvider", () => {
            const instance = MetadataDiffDecorationProvider.getInstance();

            expect(instance).to.be.instanceOf(MetadataDiffDecorationProvider);
        });
    });

    describe("register", () => {
        it("should return a disposable", () => {
            const disposable = provider.register();

            expect(disposable).to.not.be.undefined;
        });

        it("should return the same disposable when called multiple times", () => {
            const disposable1 = provider.register();
            const disposable2 = provider.register();
            const disposable3 = provider.register();

            // Should return the same disposable each time since it's already registered
            expect(disposable1).to.equal(disposable2);
            expect(disposable2).to.equal(disposable3);
        });
    });

    describe("onDidChangeFileDecorations", () => {
        it("should have onDidChangeFileDecorations event", () => {
            expect(provider.onDidChangeFileDecorations).to.not.be.undefined;
        });
    });

    describe("refresh", () => {
        it("should fire onDidChangeFileDecorations event", () => {
            let eventFired = false;
            const disposable = provider.onDidChangeFileDecorations(() => {
                eventFired = true;
            });

            provider.refresh();

            expect(eventFired).to.be.true;
            disposable.dispose();
        });

        it("should fire event with undefined to refresh all decorations", () => {
            let receivedUri: vscode.Uri | vscode.Uri[] | undefined = null as unknown as vscode.Uri | undefined;
            const disposable = provider.onDidChangeFileDecorations((uri) => {
                receivedUri = uri;
            });

            provider.refresh();

            expect(receivedUri).to.be.undefined;
            disposable.dispose();
        });
    });

    describe("provideFileDecoration", () => {
        describe("URI scheme filtering", () => {
            it("should return undefined for non-metadata-diff URIs", () => {
                const uri = vscode.Uri.parse("file:///test/file.txt");

                const decoration = provider.provideFileDecoration(uri, cancellationToken);

                expect(decoration).to.be.undefined;
            });

            it("should return undefined for http URIs", () => {
                const uri = vscode.Uri.parse("http://example.com/file.txt");

                const decoration = provider.provideFileDecoration(uri, cancellationToken);

                expect(decoration).to.be.undefined;
            });

            it("should return undefined for vscode URIs", () => {
                const uri = vscode.Uri.parse("vscode://settings/file.txt");

                const decoration = provider.provideFileDecoration(uri, cancellationToken);

                expect(decoration).to.be.undefined;
            });

            it("should handle metadata-diff URIs", () => {
                const uri = vscode.Uri.from({
                    scheme: METADATA_DIFF_URI_SCHEME,
                    path: "folder/file.txt",
                    query: "status=modified"
                });

                const decoration = provider.provideFileDecoration(uri, cancellationToken);

                expect(decoration).to.not.be.undefined;
            });
        });

        describe("modified status", () => {
            it("should return M badge for modified files", () => {
                const uri = vscode.Uri.from({
                    scheme: METADATA_DIFF_URI_SCHEME,
                    path: "folder/file.txt",
                    query: `status=${FileComparisonStatus.MODIFIED}`
                });

                const decoration = provider.provideFileDecoration(uri, cancellationToken) as vscode.FileDecoration;

                expect(decoration.badge).to.equal("M");
            });

            it("should return modified tooltip for modified files", () => {
                const uri = vscode.Uri.from({
                    scheme: METADATA_DIFF_URI_SCHEME,
                    path: "folder/file.txt",
                    query: `status=${FileComparisonStatus.MODIFIED}`
                });

                const decoration = provider.provideFileDecoration(uri, cancellationToken) as vscode.FileDecoration;

                expect(decoration.tooltip).to.equal(Constants.Strings.METADATA_DIFF_MODIFIED);
            });

            it("should return modified color for modified files", () => {
                const uri = vscode.Uri.from({
                    scheme: METADATA_DIFF_URI_SCHEME,
                    path: "folder/file.txt",
                    query: `status=${FileComparisonStatus.MODIFIED}`
                });

                const decoration = provider.provideFileDecoration(uri, cancellationToken) as vscode.FileDecoration;

                expect(decoration.color).to.be.instanceOf(vscode.ThemeColor);
                expect((decoration.color as vscode.ThemeColor).id).to.equal("gitDecoration.modifiedResourceForeground");
            });
        });

        describe("added status", () => {
            it("should return A badge for added files", () => {
                const uri = vscode.Uri.from({
                    scheme: METADATA_DIFF_URI_SCHEME,
                    path: "folder/file.txt",
                    query: `status=${FileComparisonStatus.ADDED}`
                });

                const decoration = provider.provideFileDecoration(uri, cancellationToken) as vscode.FileDecoration;

                expect(decoration.badge).to.equal("A");
            });

            it("should return added tooltip for added files", () => {
                const uri = vscode.Uri.from({
                    scheme: METADATA_DIFF_URI_SCHEME,
                    path: "folder/file.txt",
                    query: `status=${FileComparisonStatus.ADDED}`
                });

                const decoration = provider.provideFileDecoration(uri, cancellationToken) as vscode.FileDecoration;

                expect(decoration.tooltip).to.equal(Constants.Strings.METADATA_DIFF_ADDED);
            });

            it("should return added color for added files", () => {
                const uri = vscode.Uri.from({
                    scheme: METADATA_DIFF_URI_SCHEME,
                    path: "folder/file.txt",
                    query: `status=${FileComparisonStatus.ADDED}`
                });

                const decoration = provider.provideFileDecoration(uri, cancellationToken) as vscode.FileDecoration;

                expect(decoration.color).to.be.instanceOf(vscode.ThemeColor);
                expect((decoration.color as vscode.ThemeColor).id).to.equal("gitDecoration.addedResourceForeground");
            });
        });

        describe("deleted status", () => {
            it("should return D badge for deleted files", () => {
                const uri = vscode.Uri.from({
                    scheme: METADATA_DIFF_URI_SCHEME,
                    path: "folder/file.txt",
                    query: `status=${FileComparisonStatus.DELETED}`
                });

                const decoration = provider.provideFileDecoration(uri, cancellationToken) as vscode.FileDecoration;

                expect(decoration.badge).to.equal("D");
            });

            it("should return deleted tooltip for deleted files", () => {
                const uri = vscode.Uri.from({
                    scheme: METADATA_DIFF_URI_SCHEME,
                    path: "folder/file.txt",
                    query: `status=${FileComparisonStatus.DELETED}`
                });

                const decoration = provider.provideFileDecoration(uri, cancellationToken) as vscode.FileDecoration;

                expect(decoration.tooltip).to.equal(Constants.Strings.METADATA_DIFF_DELETED);
            });

            it("should return deleted color for deleted files", () => {
                const uri = vscode.Uri.from({
                    scheme: METADATA_DIFF_URI_SCHEME,
                    path: "folder/file.txt",
                    query: `status=${FileComparisonStatus.DELETED}`
                });

                const decoration = provider.provideFileDecoration(uri, cancellationToken) as vscode.FileDecoration;

                expect(decoration.color).to.be.instanceOf(vscode.ThemeColor);
                expect((decoration.color as vscode.ThemeColor).id).to.equal("gitDecoration.deletedResourceForeground");
            });
        });

        describe("unknown status", () => {
            it("should return undefined for unknown status", () => {
                const uri = vscode.Uri.from({
                    scheme: METADATA_DIFF_URI_SCHEME,
                    path: "folder/file.txt",
                    query: "status=unknown"
                });

                const decoration = provider.provideFileDecoration(uri, cancellationToken);

                expect(decoration).to.be.undefined;
            });

            it("should return undefined for empty status", () => {
                const uri = vscode.Uri.from({
                    scheme: METADATA_DIFF_URI_SCHEME,
                    path: "folder/file.txt",
                    query: "status="
                });

                const decoration = provider.provideFileDecoration(uri, cancellationToken);

                expect(decoration).to.be.undefined;
            });

            it("should return undefined for missing status query", () => {
                const uri = vscode.Uri.from({
                    scheme: METADATA_DIFF_URI_SCHEME,
                    path: "folder/file.txt",
                    query: ""
                });

                const decoration = provider.provideFileDecoration(uri, cancellationToken);

                expect(decoration).to.be.undefined;
            });

            it("should return undefined for URI with no query", () => {
                const uri = vscode.Uri.from({
                    scheme: METADATA_DIFF_URI_SCHEME,
                    path: "folder/file.txt"
                });

                const decoration = provider.provideFileDecoration(uri, cancellationToken);

                expect(decoration).to.be.undefined;
            });
        });

        describe("edge cases", () => {
            it("should handle URIs with special characters in path", () => {
                const uri = vscode.Uri.from({
                    scheme: METADATA_DIFF_URI_SCHEME,
                    path: "folder with spaces/file (1).txt",
                    query: `status=${FileComparisonStatus.MODIFIED}`
                });

                const decoration = provider.provideFileDecoration(uri, cancellationToken) as vscode.FileDecoration;

                expect(decoration.badge).to.equal("M");
            });

            it("should handle URIs with multiple query parameters", () => {
                const uri = vscode.Uri.from({
                    scheme: METADATA_DIFF_URI_SCHEME,
                    path: "folder/file.txt",
                    query: `status=${FileComparisonStatus.ADDED}&other=value`
                });

                const decoration = provider.provideFileDecoration(uri, cancellationToken) as vscode.FileDecoration;

                expect(decoration.badge).to.equal("A");
            });

            it("should handle deeply nested file paths", () => {
                const uri = vscode.Uri.from({
                    scheme: METADATA_DIFF_URI_SCHEME,
                    path: "a/b/c/d/e/f/g/file.txt",
                    query: `status=${FileComparisonStatus.DELETED}`
                });

                const decoration = provider.provideFileDecoration(uri, cancellationToken) as vscode.FileDecoration;

                expect(decoration.badge).to.equal("D");
            });
        });
    });

    describe("dispose", () => {
        it("should dispose the provider without errors", () => {
            sandbox.stub(vscode.window, "registerFileDecorationProvider").returns({
                dispose: () => { }
            });

            provider.register();

            expect(() => provider.dispose()).to.not.throw();
        });
    });
});
