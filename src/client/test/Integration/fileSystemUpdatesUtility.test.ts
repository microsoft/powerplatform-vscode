/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import vscode, { Uri } from "vscode";
import Sinon, { stub, assert } from "sinon";
import * as commonUtility from "../../power-pages/commonUtility";
import { IFileProperties } from "../../power-pages/commonUtility";
import { PowerPagesEntityType } from "../../power-pages/constants";
import proxyquire from "proxyquire";
import {
    fileRenameValidation,
    updateEntityNameInYml,
    updateEntityPathNames,
} from "../../power-pages/fileSystemUpdatesUtility";
import { expect } from "chai";

describe("fileSystemUpdatesUtility", () => {
    afterEach(() => {
        Sinon.restore();
    });

    it("updateEntityPathNames_whenfileNameisNotNullAndIsUpDatedTrue_shouldReadFileContents", async () => {
        // Act
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
        const oldUri = {
            path: "oldTestPath",
            fsPath: "testFasPath",
        } as vscode.Uri;
        const oldFileProperties = {
            fileName: "testFileName",
            fileFolderPath: "fileFolderPath",
        } as IFileProperties;
        const fileEntityType = PowerPagesEntityType.WEBPAGES;
        const isValidUri = stub(commonUtility, "isValidUri").returns(true);
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
        ).returns({ fileName: "fileName" } as IFileProperties);
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

        assert.calledOnceWithExactly(getEntityFolderName, oldUri.path);
        assert.calledOnceWithExactly(
            isValidRenamedFile,
            oldUri.path,
            "webPages",
            "testFileName",
            fileEntityType
        );
        assert.calledTwice(getFileProperties);
        assert.calledOnceWithExactly(
            getEntityFolderPathIndex,
            newUri.path,
            "testFileName",
            fileEntityType,
            "webPages"
        );
        assert.calledOnceWithExactly(isSingleFileEntity, fileEntityType);
        assert.calledOnceWithExactly(getFieldsToUpdate, fileEntityType);
        assert.calledOnceWithExactly(
            getFileNameProperties,
            "powerPages.com",
            fileEntityType
        );
        assert.calledTwice(findFiles);
        const getCallsForFindFiles = findFiles.getCalls();
        expect(getCallsForFindFiles[0].args[0]).eq(
            "**/webPages/testfilename/**/*"
        );
        expect(getCallsForFindFiles[1].args[0]).eq(
            "**/webPages/fileName.*.yml"
        );
        assert.calledOnceWithExactly(isValidUri, "oldTestPath");
    });

    it("updateEntityPathNames_whenfileNameisNotNullAndIsUpDatedFalse_shouldReadFileContents", async () => {
        // Act
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
        const oldUri = {
            path: "oldTestPath",
            fsPath: "testFasPath",
        } as vscode.Uri;
        const oldFileProperties = {
            fileName: "testFileName",
            fileFolderPath: "fileFolderPath",
        } as IFileProperties;
        const fileEntityType = PowerPagesEntityType.WEBPAGES;
        const isValidUri = stub(commonUtility, "isValidUri").returns(true);
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
        ).returns({ fileName: "fileName" } as IFileProperties);
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

        assert.calledOnceWithExactly(getEntityFolderName, oldUri.path);
        assert.calledOnceWithExactly(
            isValidRenamedFile,
            oldUri.path,
            "webPages",
            "testFileName",
            fileEntityType
        );
        assert.calledTwice(getFileProperties);
        assert.calledOnceWithExactly(
            getEntityFolderPathIndex,
            newUri.path,
            "testFileName",
            fileEntityType,
            "webPages"
        );
        assert.calledOnceWithExactly(isSingleFileEntity, fileEntityType);
        assert.calledOnceWithExactly(getFieldsToUpdate, fileEntityType);
        assert.calledOnceWithExactly(
            getFileNameProperties,
            "powerPages.com",
            fileEntityType
        );
        assert.calledTwice(findFiles);
        const getCallsForFindFiles = findFiles.getCalls();
        expect(getCallsForFindFiles[0].args[0]).eq(
            "**/webPages/testfilename/**/*"
        );
        expect(getCallsForFindFiles[1].args[0]).eq(
            "**/webPages/testfilename/**/*.yml"
        );
        assert.calledOnceWithExactly(isValidUri, "oldTestPath");
    });

    it("updateEntityPathNames_whenIsValidReturnFalse_shouldCallGetEntityFolderNameOnly", async () => {
        //Act
        const newUri = { fsPath: "testPath" } as vscode.Uri;
        const oldUri = { path: "oldTestPath" } as vscode.Uri;
        const oldFileProperties = {
            fileName: "adx_webpage",
            fileExtension: "html",
        } as IFileProperties;
        const fileEntityType = PowerPagesEntityType.WEBPAGES;

        const isValidUri = stub(commonUtility, "isValidUri").returns(false);
        const getEntityFolderName = stub(
            commonUtility,
            "getEntityFolderName"
        ).returns("webPages");
        //Action
        await updateEntityPathNames(
            oldUri,
            newUri,
            oldFileProperties,
            fileEntityType
        );

        //Assert
        assert.calledOnceWithExactly(getEntityFolderName, "oldTestPath");
        assert.calledOnceWithExactly(isValidUri, "oldTestPath");
    });

    it("updateEntityPathNames_whenoldFilePropertiesDoesNotHaveFileName_shouldCallGetEntityFolderNameOnly", async () => {
        //Act
        const newUri = { fsPath: "testPath" } as vscode.Uri;
        const oldUri = { path: "oldTestPath" } as vscode.Uri;
        const oldFileProperties = {
            fileExtension: "html",
        } as IFileProperties;
        const fileEntityType = PowerPagesEntityType.WEBPAGES;

        const isValidUri = stub(commonUtility, "isValidUri").returns(true);
        const getEntityFolderName = stub(
            commonUtility,
            "getEntityFolderName"
        ).returns("webPages");
        //Action
        await updateEntityPathNames(
            oldUri,
            newUri,
            oldFileProperties,
            fileEntityType
        );

        //Assert
        assert.calledOnceWithExactly(getEntityFolderName, "oldTestPath");
        assert.calledOnceWithExactly(isValidUri, "oldTestPath");
    });

    it("updateEntityPathNames_whenIsValidRenamedFileReturnsFalse_shouldCallGetEntityFolderNameOnly", async () => {
        //Act
        const newUri = { fsPath: "testPath" } as vscode.Uri;
        const oldUri = { path: "oldTestPath" } as vscode.Uri;
        const oldFileProperties = {
            fileExtension: "html",
            fileName: "adx_webpage",
        } as IFileProperties;
        const fileEntityType = PowerPagesEntityType.WEBPAGES;

        const isValidUri = stub(commonUtility, "isValidUri").returns(true);
        const isValidRenamedFile = stub(
            commonUtility,
            "isValidRenamedFile"
        ).returns(false);
        const getEntityFolderName = stub(
            commonUtility,
            "getEntityFolderName"
        ).returns("webPages");
        //Action
        await updateEntityPathNames(
            oldUri,
            newUri,
            oldFileProperties,
            fileEntityType
        );

        //Assert
        assert.calledOnceWithExactly(getEntityFolderName, "oldTestPath");
        assert.calledOnceWithExactly(isValidUri, "oldTestPath");
        assert.calledOnceWithExactly(
            isValidRenamedFile,
            "oldTestPath",
            "webPages",
            "adx_webpage",
            fileEntityType
        );
    });

    it("updateEntityPathNames_whenfileNameIsBalnk_shouldNotCallAllFunctions", async () => {
        //Act
        const uri = [
            { fsPath: "fakePath\\testPath.txt", path: "powerPages.com" } as Uri,
        ];
        const newUri = { fsPath: "testPath" } as vscode.Uri;
        const oldUri = { path: "oldTestPath" } as vscode.Uri;
        const oldFileProperties = {
            fileName: "testFileName",
            fileFolderPath: "fileFolderPath",
        } as IFileProperties;
        const fileEntityType = PowerPagesEntityType.WEBPAGES;
        const isValidUri = stub(commonUtility, "isValidUri").returns(true);
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
        assert.calledOnceWithExactly(getEntityFolderName, "oldTestPath");
        assert.calledOnce(getEntityFolderName);
        assert.calledOnceWithExactly(
            isValidRenamedFile,
            oldUri.path,
            "webPages",
            "testFileName",
            fileEntityType
        );
        assert.calledOnceWithExactly(getFileProperties, newUri.path);
        assert.calledOnceWithExactly(
            getEntityFolderPathIndex,
            newUri.path,
            "testFileName",
            fileEntityType,
            "webPages"
        );
        assert.calledOnceWithExactly(isValidUri, oldUri.path);
        assert.calledOnceWithExactly(
            findFiles,
            "**/webPages/testfilename/**/*"
        );
    });

    it("updateEntityPathNames_whenFileEntityTypeIsNotWEBPAGESAndFileNameIsBlank_shouldNotCallAllFunctions", async () => {
        //Act
        const uri = [
            { fsPath: "fakePath\\testPath.txt", path: "powerPages.com" } as Uri,
        ];
        const newUri = { path: "testPath" } as vscode.Uri;
        const oldUri = { path: "oldTestPath" } as vscode.Uri;
        const oldFileProperties = {
            fileName: "TestFileName",
            fileFolderPath: "fileFolderPath",
        } as IFileProperties;
        const fileEntityType = PowerPagesEntityType.ADVANCED_FORMS;
        const isValidUri = stub(commonUtility, "isValidUri").returns(true);
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
        assert.calledOnceWithExactly(getEntityFolderName, "oldTestPath");
        assert.calledOnce(getEntityFolderName);
        assert.calledOnceWithExactly(
            isValidRenamedFile,
            oldUri.path,
            "webPages",
            "TestFileName",
            fileEntityType
        );
        assert.calledOnceWithExactly(getFileProperties, newUri.path);
        assert.calledOnceWithExactly(
            getEntityFolderPathIndex,
            newUri.path,
            "TestFileName",
            fileEntityType,
            "webPages"
        );
        assert.calledOnceWithExactly(isValidUri, oldUri.path);
        assert.calledOnceWithExactly(
            findFiles,
            "**/webPages/testfilename/**/*"
        );
    });

    it("fileRenameValidation_whenisValidUriIsTrue_shouldReturnTrue", async () => {
        //Act
        const readFileSyncStub = proxyquire.load(
            "../../power-pages/fileSystemUpdatesUtility",
            {
                vscode: {
                    workspace: {
                        fs: {
                            // eslint-disable-next-line @typescript-eslint/no-empty-function
                            rename: () => {},
                        },
                    },
                },
            }
        );
        const newUri = { fsPath: "testPath" } as vscode.Uri;
        const oldUri = { fsPath: "oldTestPath" } as vscode.Uri;
        const oldFileProperties = {
            fileName: "adx_webpage",
            fileExtension: "html",
        } as IFileProperties;

        const isValidUri = stub(commonUtility, "isValidUri").returns(true);
        const getFileProperties = stub(
            commonUtility,
            "getFileProperties"
        ).returns({
            fileExtension: "pdf",
            fileFolderPath: "ddrive",
            fileName: "testFile",
        } as IFileProperties);

        const getValidatedEntityPath = stub(
            commonUtility,
            "getValidatedEntityPath"
        ).returns(newUri);
        //Action
        const result = await readFileSyncStub.fileRenameValidation(
            oldUri,
            newUri,
            oldFileProperties
        );

        //Assert

        expect(result).true;
        assert.calledOnceWithExactly(getFileProperties, newUri.path);
        assert.calledOnceWithExactly(isValidUri, oldUri.path);

        expect(getValidatedEntityPath.args[0]).deep.eq([
            "ddrive",
            "testFile",
            "html",
        ]);

        assert.calledOnce(getValidatedEntityPath);
    });

    it("fileRenameValidation_whenisValidUriIsFalse_shouldReturnTrue", async () => {
        //Act
        const newUri = { fsPath: "testPath" } as vscode.Uri;
        const oldUri = { fsPath: "oldTestPath" } as vscode.Uri;
        const oldFileProperties = {
            fileName: "adx_webpage",
            fileExtension: "html",
        } as IFileProperties;

        const isValidUri = stub(commonUtility, "isValidUri").returns(false);
        //Action
        const result = await fileRenameValidation(
            oldUri,
            newUri,
            oldFileProperties
        );

        //Assert
        expect(result).true;
        assert.calledOnceWithExactly(isValidUri, oldUri.path);
    });

    it("fileRenameValidation_whenOldFilePropertiesDontHaveFileName_shouldReturnTrue", async () => {
        //Act
        const newUri = { fsPath: "testPath" } as vscode.Uri;
        const oldUri = { fsPath: "oldTestPath" } as vscode.Uri;
        const oldFileProperties = {
            fileExtension: "html",
        } as IFileProperties;

        const isValidUri = stub(commonUtility, "isValidUri").returns(true);
        const getFileProperties = stub(
            commonUtility,
            "getFileProperties"
        ).returns({
            fileExtension: "pdf",
            fileFolderPath: "ddrive",
            fileName: "testFile",
        } as IFileProperties);

        const getValidatedEntityPath = stub(
            commonUtility,
            "getValidatedEntityPath"
        ).returns(newUri);

        //Action
        const result = await fileRenameValidation(
            oldUri,
            newUri,
            oldFileProperties
        );

        //Assert
        expect(result).true;
        assert.notCalled(getFileProperties);
        assert.notCalled(getValidatedEntityPath);
        assert.calledOnce(isValidUri);
    });

    it("fileRenameValidation_whenOldFilePropertiesFileExtensionAndNewFilePropertiesHaveSameExtension_shouldReturnTrue", async () => {
        //Act
        const newUri = { fsPath: "testPath" } as vscode.Uri;
        const oldUri = { fsPath: "oldTestPath" } as vscode.Uri;
        const oldFileProperties = {
            fileExtension: "html",
            fileName: "testFile",
        } as IFileProperties;

        const isValidUri = stub(commonUtility, "isValidUri").returns(true);
        const getFileProperties = stub(
            commonUtility,
            "getFileProperties"
        ).returns({
            fileExtension: "html",
            fileFolderPath: "ddrive",
            fileName: "testFile",
        } as IFileProperties);

        //Action
        const result = await fileRenameValidation(
            oldUri,
            newUri,
            oldFileProperties
        );

        //Assert
        expect(result).true;
        assert.calledOnceWithExactly(getFileProperties, newUri.path);
        assert.calledOnceWithExactly(isValidUri, oldUri.path);
    });

    it("fileRenameValidation_whenNewFilePropertiesDoesNotHaveFileName_shouldReturnTrue", async () => {
        //Act
        const newUri = { fsPath: "testPath" } as vscode.Uri;
        const oldUri = { fsPath: "oldTestPath" } as vscode.Uri;
        const oldFileProperties = {
            fileExtension: "html",
            fileName: "testFile",
        } as IFileProperties;

        const isValidUri = stub(commonUtility, "isValidUri").returns(true);
        const getFileProperties = stub(
            commonUtility,
            "getFileProperties"
        ).returns({
            fileExtension: "exe",
            fileFolderPath: "ddrive",
        } as IFileProperties);

        //Action
        const result = await fileRenameValidation(
            oldUri,
            newUri,
            oldFileProperties
        );

        //Assert
        expect(result).true;
        assert.calledOnceWithExactly(getFileProperties, newUri.path);
        assert.calledOnceWithExactly(isValidUri, oldUri.path);
    });

    it("fileRenameValidation_whenisFileExtensionIsBlank_shouldReturnFalse", async () => {
        //Act
        const readFileSyncStub = proxyquire.load(
            "../../power-pages/fileSystemUpdatesUtility",
            {
                vscode: {
                    workspace: {
                        fs: {
                            // eslint-disable-next-line @typescript-eslint/no-empty-function
                            rename: () => {},
                        },
                    },
                },
            }
        );
        const newUri = { fsPath: "testPath" } as vscode.Uri;
        const oldUri = { fsPath: "oldTestPath" } as vscode.Uri;
        const oldFileProperties = {
            fileName: "adx_webpage",
            fileExtension: "",
        } as IFileProperties;

        const isValidUri = stub(commonUtility, "isValidUri").returns(true);
        const getFileProperties = stub(
            commonUtility,
            "getFileProperties"
        ).returns({
            fileExtension: "html",
            fileFolderPath: "ddrive",
            fileName: "testFile",
        } as IFileProperties);

        //Action
        const result = await readFileSyncStub.fileRenameValidation(
            oldUri,
            newUri,
            oldFileProperties
        );

        //Assert

        expect(result).false;
        assert.calledOnceWithExactly(getFileProperties, newUri.path);
        assert.calledOnceWithExactly(isValidUri, oldUri.path);
    });

    it("updateEntityNameInYml_whenFieldIsAdxPartialurl_shouldCallGetFieldsToUpdateAndGetFileNameProperties", () => {
        //Act

        const fileEntityType = PowerPagesEntityType.WEBPAGES;

        const readFileSyncStub = proxyquire.load(
            "../../power-pages/fileSystemUpdatesUtility",
            {
                fs: {
                    writeFileSync: stub().returns(""),
                    readFileSync: stub().returns(
                        "{'adx_partialurl1':'adx_partialurl1'}"
                    ),
                },
            }
        );

        const getFileNameProperties = stub(
            commonUtility,
            "getFileNameProperties"
        ).returns({
            fileCompleteName: "test.txt",
            fileName: "adx_partialurl",
        } as IFileProperties);

        const getFieldsToUpdate = stub(
            commonUtility,
            "getFieldsToUpdate"
        ).returns(["adx_partialurl"]);
        //Action

        readFileSyncStub.updateEntityNameInYml("uriPath", fileEntityType);

        //Assert

        assert.calledOnceWithExactly(getFieldsToUpdate, fileEntityType);
        assert.calledOnceWithExactly(
            getFileNameProperties,
            "uriPath",
            fileEntityType
        );
    });

    it("updateEntityNameInYml_whenFieldIsNotAdx_partialurl_shouldCallGetFieldsToUpdateAndGetFileNameProperties", () => {
        //Act

        const fileEntityType = PowerPagesEntityType.WEBPAGES;

        const readFileSyncStub = proxyquire.load(
            "../../power-pages/fileSystemUpdatesUtility",
            {
                fs: {
                    writeFileSync: stub().returns(""),
                    readFileSync: stub().returns(
                        "{'adx_partialurl1':'adx_partialurl1'}"
                    ),
                },
            }
        );

        const getFileNameProperties = stub(
            commonUtility,
            "getFileNameProperties"
        ).returns({
            fileCompleteName: "test.txt",
            fileName: "adx_partialurl",
        } as IFileProperties);

        const getFieldsToUpdate = stub(
            commonUtility,
            "getFieldsToUpdate"
        ).returns(["adx_partialurl"]);
        //Action

        readFileSyncStub.updateEntityNameInYml("uriPath", fileEntityType);

        //Assert

        assert.calledOnceWithExactly(getFieldsToUpdate,fileEntityType);
        assert.calledOnceWithExactly(getFileNameProperties,"uriPath", fileEntityType);
    });

    it("updateEntityNameInYml_whenGetFileNamePropertiesThrownException_shouldNotCallGetFieldsToUpdateAndGetFileNameProperties", () => {
        //Act

        const fileEntityType = PowerPagesEntityType.WEBPAGES;
        const getFileNameProperties = stub(
            commonUtility,
            "getFileNameProperties"
        ).throws();

        //Action

        updateEntityNameInYml("uriPath", fileEntityType);

        //Assert
        assert.calledOnceWithExactly(getFileNameProperties,"uriPath", fileEntityType);
        assert.threw(getFileNameProperties);
    });
});
