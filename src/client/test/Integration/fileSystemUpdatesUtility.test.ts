/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import vscode, { Uri } from "vscode";
import Sinon, { stub, spy, assert } from "sinon";
import * as commonUtility from "../../power-pages/commonUtility";
import { IFileProperties } from "../../power-pages/commonUtility";
import { PowerPagesEntityType } from "../../power-pages/constants";
import proxyquire from "proxyquire";
import { updateEntityPathNames } from "../../power-pages/fileSystemUpdatesUtility";
import { expect } from "chai";

describe("fileSystemUpdatesUtility", () => {
    afterEach(() => {
        Sinon.restore();
    });

    it("updateEntityPathNames_whenfileNameisNotNull_shouldCallReadFileContents", async () => {
        //Act
        const readFileSyncStub = proxyquire.load(
            "../../power-pages/fileSystemUpdatesUtility",
            {
                fs: {
                    writeFileSync: stub().returns(""),
                    readFileSync: stub().returns(
                        "{'adx_partialurl':'adx_partialurl'}"
                    ),
                },
            }
        );

        const uri = [
            { fsPath: "fakePath\\testPath.txt", path: "powerPages.com" } as Uri,
        ];
        const newUri = { fsPath: "testPath" } as vscode.Uri;
        const oldUri = { fsPath: "oldTestPath" } as vscode.Uri;
        const oldFileProperties = {
            fileName: "testFileName",
            fileFolderPath: "fileFolderPath",
        } as IFileProperties;
        const fileEntityType = PowerPagesEntityType.WEBPAGES;

        const getEntityFolderName = stub(
            commonUtility,
            "getEntityFolderName"
        ).returns("webPages");
        const isValidRenamedFile = stub(
            commonUtility,
            "isValidRenamedFile"
        ).returns(true);
        const getFileProperties = spy(commonUtility, "getFileProperties");
        const getEntityFolderPathIndex = stub(
            commonUtility,
            "getEntityFolderPathIndex"
        ).returns(1);

        const isSingleFileEntity = stub(
            commonUtility,
            "isSingleFileEntity"
        ).returns(true);
        const getFieldsToUpdate = stub(
            commonUtility,
            "getFieldsToUpdate"
        ).returns(["adx_partialurl"]);
        const getUpdatedFolderPath = stub(
            commonUtility,
            "getUpdatedFolderPath"
        ).returns(uri[0]);
        const getFileNameProperties = stub(
            commonUtility,
            "getFileNameProperties"
        ).returns({
            fileCompleteName: "test.txt",
            fileName: "adx_partialurl",
        } as IFileProperties);
        const findFiles = stub(vscode.workspace, "findFiles").returns(
            new Promise((resolve) => {
                return resolve(uri);
            })
        );

        //Action
        await readFileSyncStub.updateEntityPathNames(
            oldUri,
            newUri,
            oldFileProperties,
            fileEntityType
        );

        //Assert

        assert.calledOnceWithExactly(getEntityFolderName, "oldTestPath");
        const isValidRenamedFileArgs = isValidRenamedFile.getCalls();

        expect(isValidRenamedFileArgs[0].args[0]).eq("oldTestPath")
        expect(isValidRenamedFileArgs[0].args[1]).eq("webPages")
        expect(isValidRenamedFileArgs[0].args[2]).eq("testFileName")
        expect(isValidRenamedFileArgs[0].args[3]).eq(0)
        assert.calledOnce(isValidRenamedFile);
        assert.calledTwice(getFileProperties);
        assert.calledOnce(getEntityFolderPathIndex);
        assert.calledOnce(isSingleFileEntity);
        assert.calledOnce(getFieldsToUpdate);
        assert.notCalled(getUpdatedFolderPath);
        assert.calledOnce(getFileNameProperties);
        assert.calledTwice(findFiles);
    });

    it("updateEntityPathNames_whenfileNameisNotNull_shouldCallReadFileContents", async () => {
        //Act
        const uri = [
            { fsPath: "fakePath\\testPath.txt", path: "powerPages.com" } as Uri,
        ];
        const newUri = { fsPath: "testPath" } as vscode.Uri;
        const oldUri = { fsPath: "oldTestPath" } as vscode.Uri;
        const oldFileProperties = {
            fileName: "testFileName",
            fileFolderPath: "fileFolderPath",
        } as IFileProperties;
        const fileEntityType = PowerPagesEntityType.WEBPAGES;

        const getEntityFolderName = stub(
            commonUtility,
            "getEntityFolderName"
        ).returns("webPages");
        const isValidRenamedFile = stub(
            commonUtility,
            "isValidRenamedFile"
        ).returns(true);
        const getFileProperties = stub(
            commonUtility,
            "getFileProperties"
        ).returns({ fileName: "" } as IFileProperties);
        const getEntityFolderPathIndex = stub(
            commonUtility,
            "getEntityFolderPathIndex"
        ).returns(1);

        const isSingleFileEntity = stub(
            commonUtility,
            "isSingleFileEntity"
        ).returns(true);
        const getFieldsToUpdate = stub(
            commonUtility,
            "getFieldsToUpdate"
        ).returns(["adx_partialurl"]);
        const getUpdatedFolderPath = stub(
            commonUtility,
            "getUpdatedFolderPath"
        ).returns(uri[0]);
        const getFileNameProperties = stub(
            commonUtility,
            "getFileNameProperties"
        ).returns({
            fileCompleteName: "test.txt",
            fileName: "adx_partialurl",
        } as IFileProperties);
        const findFiles = stub(vscode.workspace, "findFiles").returns(
            new Promise((resolve) => {
                return resolve(uri);
            })
        );

        //Action
        await updateEntityPathNames(
            oldUri,
            newUri,
            oldFileProperties,
            fileEntityType
        );

        //Assert
        assert.calledOnce(getEntityFolderName);
        assert.calledOnce(getEntityFolderName);
        assert.calledOnce(isValidRenamedFile);
        assert.calledOnce(getFileProperties);
        assert.calledOnce(getEntityFolderPathIndex);
        assert.notCalled(isSingleFileEntity);
        assert.notCalled(getFieldsToUpdate);
        assert.notCalled(getUpdatedFolderPath);
        assert.notCalled(getFileNameProperties);
        assert.calledOnce(findFiles);
    });

    it("updateEntityPathNames_whenfileNameisNotNull_shouldCallReadFileContents", async () => {
        //Act
        const uri = [
            { fsPath: "fakePath\\testPath.txt", path: "powerPages.com" } as Uri,
        ];
        const readFileSyncStub = proxyquire.load(
            "../../power-pages/fileSystemUpdatesUtility",
            {
                fs: {
                    writeFileSync: stub().returns(""),
                    readFileSync: stub().returns(
                        "{'adx_partialurl':'adx_partialurl'}"
                    ),
                    // eslint-disable-next-line @typescript-eslint/no-empty-function
                },
                vscode: {
                    workspace: {
                        fs: {
                            // eslint-disable-next-line @typescript-eslint/no-empty-function
                            rename: () => {},
                        },

                        findFiles: stub().returns(
                            new Promise((resolve) => {
                                return resolve(uri);
                            })
                        ),
                    },
                },
            }
        );

        const newUri = { fsPath: "testPath" } as vscode.Uri;
        const oldUri = { fsPath: "oldTestPath" } as vscode.Uri;
        const oldFileProperties = {
            fileName: "testFileName",
            fileFolderPath: "fileFolderPath",
        } as IFileProperties;
        const fileEntityType = PowerPagesEntityType.WEBPAGES;
        stub(vscode.Uri, "file").returns(uri[0]);
        const getEntityFolderName = stub(
            commonUtility,
            "getEntityFolderName"
        ).returns("webPages");
        const isValidRenamedFile = stub(
            commonUtility,
            "isValidRenamedFile"
        ).returns(true);
        const getFileProperties = spy(commonUtility, "getFileProperties");
        const getEntityFolderPathIndex = stub(
            commonUtility,
            "getEntityFolderPathIndex"
        ).returns(1);

        const isSingleFileEntity = stub(
            commonUtility,
            "isSingleFileEntity"
        ).returns(false);
        const getFieldsToUpdate = stub(
            commonUtility,
            "getFieldsToUpdate"
        ).returns(["adx_partialurl"]);
        const getUpdatedFolderPath = stub(
            commonUtility,
            "getUpdatedFolderPath"
        ).returns(uri[0]);
        const getFileNameProperties = stub(
            commonUtility,
            "getFileNameProperties"
        ).returns({
            fileCompleteName: "test.txt",
            fileName: "adx_partialurl",
        } as IFileProperties);

        //Action
        await readFileSyncStub.updateEntityPathNames(
            oldUri,
            newUri,
            oldFileProperties,
            fileEntityType
        );

        //Assert
        assert.calledOnceWithExactly(getEntityFolderName, "oldTestPath");
        assert.calledOnce(isValidRenamedFile);
        expect(isValidRenamedFile.args[0][0]).eq("oldTestPath");
        expect(isValidRenamedFile.args[0][1]).eq("webPages");
        expect(isValidRenamedFile.args[0][2]).eq("testFileName");
        expect(isValidRenamedFile.args[0][3]).eq(0);
        assert.calledTwice(getFileProperties);
        const getFilePropertiesCalls = getFileProperties.getCalls();
        expect(getFilePropertiesCalls[0].args[0]).eq("testPath");
        assert.calledOnce(getEntityFolderPathIndex);
        const getEntityFolderPathIndexArgs =
            getEntityFolderPathIndex.getCalls()[0];

        expect(getEntityFolderPathIndexArgs.args[0]).eq("testPath");
        expect(getEntityFolderPathIndexArgs.args[1]).eq("testFileName");
        expect(getEntityFolderPathIndexArgs.args[2]).eq(0);
        expect(getEntityFolderPathIndexArgs.args[3]).eq("webPages");
        assert.calledOnceWithExactly(isSingleFileEntity, 0);
        assert.calledOnceWithExactly(getFieldsToUpdate, 0);
        const getUpdatedFolderPathArgs = getUpdatedFolderPath.getCalls()[0];
        expect(getUpdatedFolderPathArgs.args[0]).eq("f");
        expect(getUpdatedFolderPathArgs.args[1]).eq("testFileName");
        expect(getUpdatedFolderPathArgs.args[2]).eq("testPath");

        const getFileNamePropertiesArgs = getFileNameProperties.getCalls()[0];
        expect(getFileNamePropertiesArgs.args[1]).eq(0);
        assert.calledOnce(getUpdatedFolderPath);
        assert.calledOnce(getFileNameProperties);
    });
});
