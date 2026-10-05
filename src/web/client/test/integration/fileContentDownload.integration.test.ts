/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import sinon from "sinon";
import * as fetch from "node-fetch";
import WebExtensionContext from "../../WebExtensionContext";
import { PortalsFS } from "../../dal/fileSystemProvider";
import { fetchDataFromDataverseAndUpdateVFS } from "../../dal/remoteFetchProvider";
import { FileDataMap } from "../../context/fileDataMap";
import { EntityDataMap } from "../../context/entityDataMap";
import { portalSchemaVersion, SERVERLOGIC_FILE_EXTENSION } from "../../common/constants";
import { schemaEntityName } from "../../schema/constants";
import { ECSFeaturesClient } from "../../../../common/ecs-features/ecsFeatureClient";
import * as folderUtility from "../../utilities/folderHelperUtility";
import { webExtensionTelemetryEventNames as Events } from "../../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";
import { EtagHandlerService } from "../../services/etagHandlerService";
import { IWebExtensionFileDownloadTelemetryData } from "../../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryInterface";
import { getDataSourcePropertiesMap, getEntitiesSchemaMap } from "../../schema/portalSchemaReader";
import { FILE_DOWNLOAD_BLOCK_SIZE } from "../../services/fileContentDownloadService";

describe("enhanced file-column download integration", () => {
    const entityId = 'aa563be7-9a38-4a89-9216-47f9fc6a3f14';
    const root = vscode.Uri.parse('powerplatform-vfs:/download-tests/');
    let fs: PortalsFS;
    let requests: sinon.SinonStub;
    let info: sinon.SinonStub;
    let apiFailure: sinon.SinonStub;
    let downloadTelemetry: sinon.SinonStub;
    let flags: sinon.SinonStub;
    let entityName: schemaEntityName;
    let fileName: string;
    let model: portalSchemaVersion;

    const jsonResponse = (status: number, body: unknown = {}) => new fetch.Response(JSON.stringify(body), { status });
    const fileUri = () => vscode.Uri.joinPath(root, entityName === schemaEntityName.SERVERLOGICS ? 'server-logic' : 'web-files',
        entityName === schemaEntityName.SERVERLOGICS ? `${fileName}${SERVERLOGIC_FILE_EXTENSION}` : fileName);
    const terminals = () => downloadTelemetry.getCalls()
        .filter(call => call.args[0] === Events.WEB_EXTENSION_FILE_DOWNLOAD_COMPLETED)
        .map(call => call.args[1] as IWebExtensionFileDownloadTelemetryData);
    const expectFsFailure = async (action: () => Promise<unknown>, code = 'Unavailable') => {
        let caught: unknown;
        try {
            await action();
        } catch (error) {
            caught = error;
        }
        expect(caught).to.be.instanceOf(vscode.FileSystemError);
        expect((caught as vscode.FileSystemError).code).to.equal(code);
    };
    const load = (mode: 'initial' | 'reload' = 'initial') => fetchDataFromDataverseAndUpdateVFS(
        fs, { entityId, entityName, fileName }, mode,
    );

    beforeEach(async () => {
        model = portalSchemaVersion.V2;
        const newFileMap = new FileDataMap();
        const newEntityMap = new EntityDataMap();
        sinon.stub(WebExtensionContext, 'schema').get(() => model);
        sinon.stub(WebExtensionContext, 'websiteName').get(() => 'download-tests');
        sinon.stub(WebExtensionContext, 'orgUrl').get(() => 'https://example.test');
        sinon.stub(WebExtensionContext, 'rootDirectory').get(() => root);
        sinon.stub(WebExtensionContext, 'isContextSet').get(() => true);
        sinon.stub(WebExtensionContext, 'defaultEntityId').get(() => '');
        sinon.stub(WebExtensionContext, 'defaultEntityType').get(() => '');
        sinon.stub(WebExtensionContext, 'urlParametersMap').get(() => new Map());
        sinon.stub(WebExtensionContext, 'schemaEntitiesMap').get(() => getEntitiesSchemaMap(model));
        sinon.stub(WebExtensionContext, 'schemaDataSourcePropertiesMap').get(() => getDataSourcePropertiesMap(model));
        sinon.stub(WebExtensionContext, 'fileDataMap').get(() => newFileMap);
        sinon.stub(WebExtensionContext, 'entityDataMap').get(() => newEntityMap);
        sinon.stub(WebExtensionContext, 'dataverseAuthentication').resolves();
        sinon.stub(WebExtensionContext, 'authenticateAndUpdateDataverseProperties').resolves();
        sinon.stub(WebExtensionContext, 'dataverseAccessToken').get(() => 'test-access-token');
        info = sinon.stub(WebExtensionContext.telemetry, 'sendInfoTelemetry');
        apiFailure = sinon.stub(WebExtensionContext.telemetry, 'sendAPIFailureTelemetry');
        sinon.stub(WebExtensionContext.telemetry, 'sendAPITelemetry');
        sinon.stub(WebExtensionContext.telemetry, 'sendAPISuccessTelemetry');
        sinon.stub(WebExtensionContext.telemetry, 'sendErrorTelemetry');
        downloadTelemetry = sinon.stub(WebExtensionContext.telemetry, 'sendFileDownloadTelemetry');
        sinon.stub(vscode.commands, 'executeCommand').resolves();
        sinon.stub(vscode.workspace, 'updateWorkspaceFolders').returns(true);
        sinon.stub(vscode.window, 'showErrorMessage').resolves(undefined);
        entityName = schemaEntityName.WEBFILES;
        fileName = 'sample.txt';
        flags = sinon.stub(ECSFeaturesClient, 'getConfig').returns({
            enableWebFileBlockDownload: true, enableServerLogicChanges: true,
            enableDuplicateFileHandling: false, enableBlogSupport: false,
        });
        sinon.stub(folderUtility, 'getRequestUrlForEntities').callsFake(() => [
            { entityName, requestUrl: 'https://example.test/api/data/v9.2/powerpagecomponents?metadata' },
        ]);
        sinon.stub(folderUtility, 'getFolderSubUris').returns(['web-files', 'server-logic']);
        requests = sinon.stub(WebExtensionContext.concurrencyHandler, 'handleRequest').callsFake(async (url) => {
            const address = String(url);
            if (address.endsWith('/filecontent')) {
                return jsonResponse(413);
            }
            if (address.endsWith('/InitializeFileBlocksDownload')) {
                return jsonResponse(200, { FileSizeInBytes: 3, FileContinuationToken: 'private-token', IsChunkingSupported: true });
            }
            if (address.endsWith('/DownloadBlock')) {
                return jsonResponse(200, { Data: 'AAH/' });
            }
            return jsonResponse(200, { value: [{ name: fileName, powerpagecomponentid: entityId, '@odata.etag': 'etag-1' }] });
        });
        fs = new PortalsFS();
        await fs.createDirectory(root);
        await fs.createDirectory(vscode.Uri.joinPath(root, 'web-files'));
        await fs.createDirectory(vscode.Uri.joinPath(root, 'server-logic'));
    });

    afterEach(() => sinon.restore());

    it("preloads enhanced text via fallback and emits success only after one VFS write", async () => {
        const write = sinon.spy(fs, 'writeFile');
        const summary = await fetchDataFromDataverseAndUpdateVFS(fs);
        expect(summary.failedContentLoads).to.equal(0);
        expect(Array.from(await fs.readFile(fileUri()))).to.deep.equal([0, 1, 255]);
        expect(write.callCount).to.equal(1);
        expect(WebExtensionContext.fileDataMap.getFileMap.get(fileUri().fsPath)?.isContentLoaded).to.equal(true);
        expect(terminals()).to.have.length(1);
        expect(terminals()[0].mode).to.equal('preload');
        expect(terminals()[0].outcome).to.equal('succeeded');
        expect(apiFailure.getCalls().some(call => call.args[7] === '413')).to.equal(true);
    });

    for (const size of [18_000_000, 104_000_000]) {
        it(`commits ${size} byte-exact recovered bytes into the actual VFS once`, async () => {
            const expected = new Uint8Array(size);
            for (let index = 0; index < size; index++) {
                expected[index] = (index * 31 + Math.floor(index / FILE_DOWNLOAD_BLOCK_SIZE)) % 256;
            }
            requests.withArgs(sinon.match(/\/InitializeFileBlocksDownload$/)).callsFake(async () =>
                jsonResponse(200, { FileSizeInBytes: size, FileContinuationToken: 'private-token', IsChunkingSupported: true }));
            requests.withArgs(sinon.match(/\/DownloadBlock$/)).callsFake(async (_url, init) => {
                const payload = JSON.parse(String(init?.body));
                const offset = Number(payload.Offset);
                const length = Number(payload.BlockLength);
                return jsonResponse(200, { Data: Buffer.from(expected.subarray(offset, offset + length)).toString('base64') });
            });
            const write = sinon.spy(fs, 'writeFile');
            await load();
            const actual = await fs.readCommittedFile(fileUri());
            expect(actual.byteLength).to.equal(size);
            expect(Buffer.compare(Buffer.from(actual.buffer), Buffer.from(expected.buffer))).to.equal(0);
            expect((await fs.stat(fileUri())).size).to.equal(size);
            expect(write.callCount).to.equal(1);
            expect(terminals()).to.have.length(1);
            expect(terminals()[0].blockCount).to.equal(Math.ceil(size / FILE_DOWNLOAD_BLOCK_SIZE));
            expect(terminals()[0].outcome).to.equal('succeeded');
        }).timeout(30000);
    }

    it("forces initially requested binary files to load rather than returning lazy placeholders", async () => {
        fileName = 'sample.bin';
        await load();
        expect(Array.from(await fs.readFile(fileUri()))).to.deep.equal([0, 1, 255]);
        expect(terminals()).to.have.length(1);
        expect(terminals()[0].mode).to.equal('initial');
    });

    it("does not count a binary placeholder as a download and recovers on lazy open", async () => {
        fileName = 'sample.bin';
        await fetchDataFromDataverseAndUpdateVFS(fs);
        expect(downloadTelemetry.called).to.equal(false);
        expect(WebExtensionContext.fileDataMap.getFileMap.get(fileUri().fsPath)?.isContentLoaded).to.equal(false);
        expect(Array.from(await fs.readFile(fileUri()))).to.deep.equal([0, 1, 255]);
        expect(terminals()).to.have.length(1);
        expect(terminals()[0].mode).to.equal('lazy');
    });

    it("surfaces lazy failures as FileSystemError rather than an empty file", async () => {
        fileName = 'sample.bin';
        await fetchDataFromDataverseAndUpdateVFS(fs);
        requests.withArgs(sinon.match(/\/DownloadBlock$/)).resolves(jsonResponse(403));
        await expectFsFailure(() => fs.readFile(fileUri()));
        expect(terminals()[0].outcome).to.equal('failed');
        expect(WebExtensionContext.fileDataMap.getFileMap.get(fileUri().fsPath)?.isContentLoaded).to.equal(false);
    });

    it("retains previously committed bytes and metadata after a failed reload", async () => {
        await load();
        const oldMetadata = WebExtensionContext.fileDataMap.getFileMap.get(fileUri().fsPath);
        requests.withArgs(sinon.match(/\/DownloadBlock$/)).resolves(jsonResponse(403));
        await expectFsFailure(() => load('reload'));
        expect(Array.from(await fs.readCommittedFile(fileUri()))).to.deep.equal([0, 1, 255]);
        expect(WebExtensionContext.fileDataMap.getFileMap.get(fileUri().fsPath)).to.equal(oldMetadata);
        expect(terminals().map(data => data.outcome)).to.deep.equal(['succeeded', 'failed']);
        expect(terminals()[1].mode).to.equal('reload');
        expect(info.getCalls().some(call => call.args[0] === Events.WEB_EXTENSION_FILES_LOAD_SUCCESS)).to.equal(false);
    });

    it("does not mark content loaded or emit success after a failed VFS write", async () => {
        const write = sinon.stub(fs, 'writeFile').rejects(vscode.FileSystemError.Unavailable());
        await expectFsFailure(() => load());
        expect(write.callCount).to.equal(1);
        expect(WebExtensionContext.fileDataMap.getFileMap.has(fileUri().fsPath)).to.equal(false);
        expect(terminals()).to.have.length(1);
        expect(terminals()[0].outcome).to.equal('failed');
        expect(terminals()[0].failureStage).to.equal('commit');
    });

    it("retains committed bytes and loaded metadata when a reload VFS write fails", async () => {
        await load();
        const previous = WebExtensionContext.fileDataMap.getFileMap.get(fileUri().fsPath);
        const write = sinon.stub(fs, 'writeFile').rejects(vscode.FileSystemError.Unavailable());
        await expectFsFailure(() => load('reload'));
        expect(Array.from(await fs.readCommittedFile(fileUri()))).to.deep.equal([0, 1, 255]);
        expect(WebExtensionContext.fileDataMap.getFileMap.get(fileUri().fsPath)).to.equal(previous);
        expect(previous?.isContentLoaded).to.equal(true);
        expect(write.callCount).to.equal(1);
        expect(terminals()[1].failureStage).to.equal('commit');
        expect(terminals()[1].outcome).to.equal('failed');
    });

    it("does not return stale committed content when the reload metadata record is missing", async () => {
        await load();
        requests.withArgs(sinon.match(/\?metadata$/)).callsFake(async () => jsonResponse(200, { value: [] }));
        await expectFsFailure(() => load('reload'), 'FileNotFound');
        expect(Array.from(await fs.readCommittedFile(fileUri()))).to.deep.equal([0, 1, 255]);
    });

    it("continues unrelated bulk content while reporting partial instead of complete success", async () => {
        requests.withArgs(sinon.match(/\?metadata$/)).resolves(jsonResponse(200, { value: [
            { name: 'sample.txt', powerpagecomponentid: entityId },
            { name: 'other.txt', powerpagecomponentid: 'other-id' },
        ] }));
        requests.withArgs(sinon.match(new RegExp(`\\(${entityId}\\)/filecontent$`))).resolves(jsonResponse(403));
        requests.withArgs(sinon.match(/\(other-id\)\/filecontent$/)).resolves(jsonResponse(200, { value: 'b2s=' }));
        const summary = await fetchDataFromDataverseAndUpdateVFS(fs);
        expect(summary).to.deep.equal({ failedContentLoads: 1, preparedRecords: 1 });
        expect(new TextDecoder().decode(await fs.readFile(vscode.Uri.joinPath(root, 'web-files', 'other.txt')))).to.equal('ok');
        expect(info.getCalls().some(call => call.args[0] === Events.WEB_EXTENSION_FILES_LOAD_PARTIAL)).to.equal(true);
        expect(info.getCalls().some(call => call.args[0] === Events.WEB_EXTENSION_FILES_LOAD_SUCCESS)).to.equal(false);
        expect(terminals().map(data => data.outcome)).to.deep.equal(['failed', 'succeeded']);
    });

    it("activation reports partial workspace preparation after a content failure", async () => {
        requests.withArgs(sinon.match(/\/DownloadBlock$/)).resolves(jsonResponse(403));
        await fs.readDirectory(root, true);
        expect(info.getCalls().some(call => call.args[0] === Events.WEB_EXTENSION_PREPARE_WORKSPACE_PARTIAL)).to.equal(true);
        expect(info.getCalls().some(call => call.args[0] === Events.WEB_EXTENSION_PREPARE_WORKSPACE_SUCCESS)).to.equal(false);
    });

    it("downloads enabled server logic through the same file-column recovery path", async () => {
        entityName = schemaEntityName.SERVERLOGICS;
        fileName = 'server.js';
        await fetchDataFromDataverseAndUpdateVFS(fs);
        expect(Array.from(await fs.readFile(fileUri()))).to.deep.equal([0, 1, 255]);
        expect(terminals()[0].outcome).to.equal('succeeded');
    });

    it("does not fetch disabled server logic", async () => {
        entityName = schemaEntityName.SERVERLOGICS;
        flags.returns({ enableServerLogicChanges: false, enableWebFileBlockDownload: true });
        await fetchDataFromDataverseAndUpdateVFS(fs);
        expect(requests.called).to.equal(false);
        expect(downloadTelemetry.called).to.equal(false);
    });

    it("disabled fallback fails visibly after GET 413 without any POST", async () => {
        flags.returns({ enableWebFileBlockDownload: false });
        await expectFsFailure(() => load());
        expect(requests.getCalls().some(call => call.args[1]?.method === 'POST')).to.equal(false);
        expect(terminals()[0].featureEnabled).to.equal(false);
        expect(terminals()[0].outcome).to.equal('failed');
    });

    it("404 is notFound, not successfully loaded empty content", async () => {
        requests.withArgs(sinon.match(/\/filecontent$/)).resolves(jsonResponse(404));
        await expectFsFailure(() => load(), 'FileNotFound');
        expect(terminals()[0].outcome).to.equal('notFound');
        expect(WebExtensionContext.fileDataMap.getFileMap.get(fileUri().fsPath)?.isContentLoaded).to.equal(false);
    });

    it("preserves legacy annotation downloads without block actions or logical enhanced telemetry", async () => {
        model = portalSchemaVersion.V1;
        requests.callsFake(async (url) => String(url).includes('annotations')
            ? jsonResponse(200, { '@odata.count': 1, value: [{ annotationid: 'annotation-id', documentbody: 'AAH/', mimetype: 'text/plain' }] })
            : jsonResponse(200, { value: [{ adx_name: fileName, adx_webfileid: entityId }] }));
        await load();
        expect(Array.from(await fs.readFile(fileUri()))).to.deep.equal([0, 1, 255]);
        expect(downloadTelemetry.called).to.equal(false);
        expect(requests.getCalls().some(call => call.args[1]?.method === 'POST')).to.equal(false);
    });

    it("uses fallback for enhanced ETag content, commits binary bytes and handles empty updates", async () => {
        await load();
        requests.withArgs(sinon.match(new RegExp(`powerpagecomponents\\(${entityId}\\)$`)))
            .resolves(jsonResponse(200, { '@odata.etag': 'etag-2', filecontent: 'file-column-id-not-bytes' }));
        requests.withArgs(sinon.match(/\/InitializeFileBlocksDownload$/))
            .resolves(jsonResponse(200, { FileSizeInBytes: 0, FileContinuationToken: 'private-token', IsChunkingSupported: true }));
        await EtagHandlerService.getLatestFileContentAndUpdateMetadata(fileUri().fsPath, fs);
        expect((await fs.readCommittedFile(fileUri())).length).to.equal(0);
        expect((await fs.stat(fileUri())).size).to.equal(0);
        expect(terminals()[1].mode).to.equal('etag');
        expect(terminals()[1].outcome).to.equal('succeeded');
    });

    it("preserves ETag committed bytes on a failed recovery and surfaces the failure", async () => {
        await load();
        requests.withArgs(sinon.match(new RegExp(`powerpagecomponents\\(${entityId}\\)$`)))
            .resolves(jsonResponse(200, { '@odata.etag': 'etag-2' }));
        requests.withArgs(sinon.match(/\/DownloadBlock$/)).resolves(jsonResponse(403));
        await expectFsFailure(() => EtagHandlerService.getLatestFileContentAndUpdateMetadata(fileUri().fsPath, fs));
        expect(Array.from(await fs.readCommittedFile(fileUri()))).to.deep.equal([0, 1, 255]);
        expect(terminals()[1].outcome).to.equal('failed');
    });

    it("refreshes 401 during a block once through the shared handler and counts the actual retry", async () => {
        requests.restore();
        let blockCalls = 0;
        const transport = sinon.stub(fetch, 'default').callsFake(async (url) => {
            const address = String(url);
            if (address.endsWith('/filecontent')) {
                return jsonResponse(413);
            }
            if (address.endsWith('/InitializeFileBlocksDownload')) {
                return jsonResponse(200, { FileSizeInBytes: 3, FileContinuationToken: 'private-token', IsChunkingSupported: true });
            }
            if (address.endsWith('/DownloadBlock')) {
                return ++blockCalls === 1 ? jsonResponse(401) : jsonResponse(200, { Data: 'AAH/' });
            }
            return jsonResponse(200, { value: [{ name: fileName, powerpagecomponentid: entityId }] });
        });
        const refresh = sinon.stub(WebExtensionContext, 'refreshDataverseToken').resolves('fresh-token');
        await load();
        expect(refresh.callCount).to.equal(1);
        expect(blockCalls).to.equal(2);
        expect(terminals()).to.have.length(1);
        expect(terminals()[0].retryCount).to.equal(1);
        expect(terminals()[0].outcome).to.equal('succeeded');
        const blockRequests = transport.getCalls().filter(call => String(call.args[0]).endsWith('/DownloadBlock'));
        expect(blockRequests[0].args[1]?.body).to.equal(blockRequests[1].args[1]?.body);
    });
}).timeout(30000);
