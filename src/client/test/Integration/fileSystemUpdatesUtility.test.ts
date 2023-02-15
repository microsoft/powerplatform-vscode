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

        assert.calledOnce(getEntityFolderName);
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
});
