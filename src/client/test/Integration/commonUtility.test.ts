/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import sinon, { assert, stub } from "sinon";
import * as vscode from "vscode";
import * as Constants from "../../power-pages/constants";
import {
    getCurrentWorkspaceURI,
    getDeletePathUris,
    getEntityFolderName,
    getEntityFolderPathIndex,
    getFieldsToUpdate,
    getFileNameProperties,
    getFileProperties,
    getPowerPageEntityType,
    getUpdatedFolderPath,
    getValidatedEntityPath,
    IFileProperties,
    isSingleFileEntity,
    isValidRenamedFile,
    isValidUri,
} from "../../power-pages/commonUtility";
import { Uri, WorkspaceFolder } from "vscode";

describe("commonUtility", () => {
    afterEach(() => {
        sinon.restore();
    });

    it("getFileProperties_whenFsPathHavingExtensionAndDobleSlash_shouldReturnCompleteObj", () => {
        //Act
        const uriPath = "test\\file.pdf";
        const expectedResult = {
            fileCompleteName: "test\\file.pdf",
            fileExtension: "pdf",
            fileFolderPath: "/",
            fileName: "test\\file",
            fileNameIndex: 0,
        };
        //Action
        const result = getFileProperties(uriPath);

        //Assert
        expect(result).deep.eq(expectedResult);
    });

    it("getFileProperties_whenFsPathDontHaveDoubleSlashAndExtension_shouldReturnFileExtensionAsBlank", () => {
        //Act
        const uriPath = "test";
        const expectedResult = {
            fileCompleteName: "test",
            fileExtension: "",
            fileFolderPath: "/",
            fileName: "test",
            fileNameIndex: 0,
        };
        //Action
        const result = getFileProperties(uriPath);

        //Assert
        expect(result).deep.eq(expectedResult);
    });

    it("getFileProperties_whenFsPathBlank_shouldReturnObjWithoutValue", () => {
        //Act
        const uriPath = "";
        const expectedResult = {
            fileCompleteName: "",
            fileExtension: "",
            fileFolderPath: "/",
            fileName: undefined,
            fileNameIndex: undefined,
        };
        //Action
        const result = getFileProperties(uriPath);

        //Assert
        expect(result).deep.eq(expectedResult);
    });

    it("getPowerPageEntityType_whenAllFsPathMatch_shouldReturnPageEntityAsWebpages", () => {
        //Act
        const AdvancedFormsStep = "advanced-form-steps"; // This is included as part of advanced-forms
        const EntityFolderName = [
            "web-pages",
            "web-files",
            "web-templates",
            "content-snippets",
            "weblink-sets",
            "polls",
            "poll-placements",
            "basic-forms",
            AdvancedFormsStep,
            "advanced-forms",
            "page-templates",
            "lists",
            "table-permissions",
        ];

        //Action
        EntityFolderName.forEach((uriPath, index) => {
            const result = getPowerPageEntityType(`/${uriPath}/`);
            //Assert
            if (uriPath == AdvancedFormsStep) {
                expect(result).eq(13);
            } else {
                expect(result).eq(index);
            }
        });
    });

    it("getPowerPageEntityType_whenFsPathMatchNotMatch_shouldReturnPageEntityAsUnknown", () => {
        //Act
        const uriPath = "web-pages";

        //Action
        const result = getPowerPageEntityType(uriPath);
        //Assert

        expect(result).eq(Constants.PowerPagesEntityType.UNKNOWN);
    });

    it("isValidUri_whenFolderNameMatch_shouldReturnFalse", () => {
        //Act
        const EntityFolderName = [
            "web-pages",
            "web-files",
            "web-templates",
            "content-snippets",
            "polls",
            "poll-placements",
            "weblink-sets",
            "basic-forms",
            "advanced-forms",
            "page-templates",
            "lists",
            "table-permissions",
        ];

        //Action
        EntityFolderName.forEach((uriPath) => {
            const result = isValidUri(`/${uriPath}/`);

            //Assert
            expect(result).false;
        });
    });

    it("isValidUri_whenFolderNameDoNotMatch_shouldReturnTrue", () => {
        //Act
        const uriPath = "fakePath";

        //Action
        const result = isValidUri(`\\${uriPath}\\`);

        //Assert
        expect(result).true;
    });

    it("getEntityFolderName_whenfsPathIsAdvanced-form-steps_shouldReturnAdvanced-form-steps", () => {
        //Act
        const advancedFormsStep = "advanced-form-steps";
        const uriPath = advancedFormsStep;

        //Action
        const result = getEntityFolderName(`/${uriPath}/`);

        //Assert
        expect(result).eq(advancedFormsStep);
    });

    it("getEntityFolderName_whenfsPathIsNotAdvanced-form-steps_shouldReturnFolderName", () => {
        //Act
        const EntityFolderName = [
            "web-pages",
            "web-files",
            "web-templates",
            "content-snippets",
            "polls",
            "poll-placements",
            "weblink-sets",
            "basic-forms",
            "advanced-forms",
            "page-templates",
            "lists",
            "table-permissions",
        ];
        //Action
        EntityFolderName.forEach((uriPath) => {
            const result = getEntityFolderName(`/${uriPath}/`);
            //Assert
            expect(result).eq(uriPath);
        });
    });

    it("getEntityFolderName_whenfsPathIsNotAdvanced-form-steps_shouldReturnBlank", () => {
        //Act
        const uriPath = "test";
        //Action
        const result = getEntityFolderName(`\\${uriPath}\\`);
        //Assert
        expect(result).empty;
    });

    it("getEntityFolderName_whenfsPathIsBlank_shouldReturnBlank", () => {
        //Act
        const uriPath = "";
        //Action
        const result = getEntityFolderName(`\\${uriPath}\\`);
        //Assert
        expect(result).empty;
    });

    it("getEntityFolderPathIndex_whenFileEntityTypeIsWEBFILES_shouldReturnAdditionOfIndexAndLength", () => {
        //Act
        const uriPath = "\\t\\f\\";
        const fileName = "";
        const fileEntityType = Constants.PowerPagesEntityType.WEBFILES;
        const entityFolderName = "\\t\\";
        //Action
        const result = getEntityFolderPathIndex(
            uriPath,
            fileName,
            fileEntityType,
            entityFolderName
        );
        //Assert
        expect(result).eq(4);
    });

    it("getEntityFolderPathIndex_whenFileEntityTypeIsTABLE_PERMISSIONS_shouldReturnAdditionOfIndexAndLength", () => {
        //Act
        const uriPath = "\\t\\f\\";
        const fileName = "";
        const fileEntityType = Constants.PowerPagesEntityType.TABLE_PERMISSIONS;
        const entityFolderName = "\\t\\";
        //Action
        const result = getEntityFolderPathIndex(
            uriPath,
            fileName,
            fileEntityType,
            entityFolderName
        );
        //Assert
        expect(result).eq(4);
    });

    it("getEntityFolderPathIndex_whenFileEntityTypeIsPOLL_PLACEMENTS_shouldReturnAdditionOfIndexAndLength", () => {
        //Act
        const uriPath = "\\t\\f\\";
        const fileName = "";
        const fileEntityType = Constants.PowerPagesEntityType.POLL_PLACEMENTS;
        const entityFolderName = "\\t\\";
        //Action
        const result = getEntityFolderPathIndex(
            uriPath,
            fileName,
            fileEntityType,
            entityFolderName
        );
        //Assert
        expect(result).eq(4);
    });

    it("getEntityFolderPathIndex_whenFileEntityTypeIsPAGE_TEMPLATES_shouldReturnAdditionOfIndexAndLength", () => {
        //Act
        const uriPath = "\\t\\f\\";
        const fileName = "";
        const fileEntityType = Constants.PowerPagesEntityType.PAGE_TEMPLATES;
        const entityFolderName = "\\t\\";
        //Action
        const result = getEntityFolderPathIndex(
            uriPath,
            fileName,
            fileEntityType,
            entityFolderName
        );
        //Assert
        expect(result).eq(4);
    });

    it("getEntityFolderPathIndex_whenFileEntityTypeIsLISTS_shouldReturnAdditionOfIndexAndLength", () => {
        //Act
        const uriPath = "\\t\\f\\";
        const fileName = "";
        const fileEntityType = Constants.PowerPagesEntityType.LISTS;
        const entityFolderName = "\\t\\";
        //Action
        const result = getEntityFolderPathIndex(
            uriPath,
            fileName,
            fileEntityType,
            entityFolderName
        );
        //Assert
        expect(result).eq(4);
    });

    it("getEntityFolderPathIndex_whenFileEntityTypeIsLISTSAndEntityFolderNameIsBlank_shouldReturn1", () => {
        //Act
        const uriPath = "\\t\\f\\";
        const fileName = "";
        const fileEntityType = Constants.PowerPagesEntityType.LISTS;
        const entityFolderName = "";
        //Action
        const result = getEntityFolderPathIndex(
            uriPath,
            fileName,
            fileEntityType,
            entityFolderName
        );
        //Assert
        expect(result).eq(1);
    });

    it("getEntityFolderPathIndex_whenFileEntityTypeIsADVANCED_FORMS_shouldReturnAdditionOfIndexOfFileNameAndLength", () => {
        //Act
        const uriPath = "\\t\\f\\";
        const fileName = "\\file\\";
        const fileEntityType = Constants.PowerPagesEntityType.ADVANCED_FORMS;
        const entityFolderName = "\\t\\";
        //Action
        const result = getEntityFolderPathIndex(
            uriPath,
            fileName,
            fileEntityType,
            entityFolderName
        );
        //Assert
        expect(result).eq(7);
    });

    it("getEntityFolderPathIndex_whenFileEntityTypeIsADVANCED_FORMSFileNameBlank_shouldReturn1", () => {
        //Act
        const uriPath = "\\t\\f\\";
        const fileName = "";
        const fileEntityType = Constants.PowerPagesEntityType.ADVANCED_FORMS;
        const entityFolderName = "\\t\\";
        //Action
        const result = getEntityFolderPathIndex(
            uriPath,
            fileName,
            fileEntityType,
            entityFolderName
        );
        //Assert
        expect(result).eq(1);
    });

    it("getValidatedEntityPath_whenFileEntityTypeIsADVANCED_FORMSFileNameBlank_shouldReturn1", () => {
        //Act
        const folderPath = "d:/";
        const fileName = "test";
        const fileExtension = "pdf";
        const expectedResult = {
            _formatted: null,
            _fsPath: null,
            authority: "",
            fragment: "",
            path: "/d:/test.pdf",
            query: "",
            scheme: "file",
        };
        //Action
        const result = getValidatedEntityPath(
            folderPath,
            fileName,
            fileExtension
        );

        //Assert
        expect(result).deep.eq(expectedResult);
    });

    it("isValidRenamedFile_whenIsSingleFileEntityIsTrue_shouldReturnTrue", () => {
        //Act

        const SingleFileEntity = [
            Constants.PowerPagesEntityType.WEBFILES,
            Constants.PowerPagesEntityType.TABLE_PERMISSIONS,
            Constants.PowerPagesEntityType.POLL_PLACEMENTS,
            Constants.PowerPagesEntityType.PAGE_TEMPLATES,
            Constants.PowerPagesEntityType.LISTS,
        ];

        const uriPath = "/t/f";
        const fileName = "f";
        const entityFolderName = "t";

        //Action
        SingleFileEntity.forEach((fileEntityType) => {
            const result = isValidRenamedFile(
                uriPath,
                entityFolderName,
                fileName,
                fileEntityType
            );

            //Assert
            expect(result).true;
        });
    });

    it("isValidRenamedFile_whenIsSingleFileEntityIsTrue_shouldReturnFalse", () => {
        //Act
        const SingleFileEntity = [
            Constants.PowerPagesEntityType.WEBFILES,
            Constants.PowerPagesEntityType.TABLE_PERMISSIONS,
            Constants.PowerPagesEntityType.POLL_PLACEMENTS,
            Constants.PowerPagesEntityType.PAGE_TEMPLATES,
            Constants.PowerPagesEntityType.LISTS,
        ];

        const uriPath = "/t/f";
        const fileName = "f";
        const entityFolderName = "t";

        //Action
        SingleFileEntity.forEach((fileEntityType) => {
            const result = isValidRenamedFile(
                uriPath,
                entityFolderName,
                fileName,
                fileEntityType
            );

            //Assert
            expect(result).true;
        });
    });

    it("isValidRenamedFile_whenIsSingleFileEntityIsFalse_shouldReturnTrue", () => {
        //Act

        const uriPath = "/t/f/";
        const fileName = "f";
        const entityFolderName = "t";
        const fileEntityType = Constants.PowerPagesEntityType.BASIC_FORMS;
        //Action

        const result = isValidRenamedFile(
            uriPath,
            entityFolderName,
            fileName,
            fileEntityType
        );

        //Assert
        expect(result).true;
    });

    it("isValidRenamedFile_whenIsSingleFileEntityIsFalse_shouldReturnFalse", () => {
        //Act

        const uriPath = "/t/f";
        const fileName = "f";
        const entityFolderName = "t";
        const fileEntityType = Constants.PowerPagesEntityType.BASIC_FORMS;
        //Action

        const result = isValidRenamedFile(
            uriPath,
            entityFolderName,
            fileName,
            fileEntityType
        );

        //Assert
        expect(result).false;
    });

    it("getUpdatedFolderPath_whenfsPathMatch_shouldReplaceValue", () => {
        //Act
        const uriPath = "/test/";
        const oldFileName = "test";
        const newFileName = "newTest";
        const expectedResult = {
            _formatted: null,
            _fsPath: null,
            authority: "",
            fragment: "",
            path: "/newtest",
            query: "",
            scheme: "file",
        };
        //Action
        const result = getUpdatedFolderPath(uriPath, oldFileName, newFileName);

        //Assert
        expect(result).deep.eq(expectedResult);
    });

    it("getUpdatedFolderPath_whenfsPathNotMatch_shouldNotReplaceValue", () => {
        //Act
        const uriPath = "test";
        const oldFileName = "test";
        const newFileName = "newTest";
        const expectedResult = {
            _formatted: null,
            _fsPath: null,
            authority: "",
            fragment: "",
            path: "/test",
            query: "",
            scheme: "file",
        };
        //Action
        const result = getUpdatedFolderPath(uriPath, oldFileName, newFileName);

        //Assert
        expect(result).deep.eq(expectedResult);
    });

    it("getCurrentWorkspaceURI_whenGetWorkspaceFolderDoesNotReturnUndefined_shouldReturnWorkspaceFolder", () => {
        //Act
        const fsPath = "test";

        const getWorkspaceFolder = stub(
            vscode.workspace,
            "getWorkspaceFolder"
        ).returns({
            index: 1,
            name: "name",
            uri: { path: "powerPages.com" } as Uri,
        } as WorkspaceFolder);
        //Action
        const result = getCurrentWorkspaceURI(fsPath);

        //Assert
        expect(result).deep.eq({ path: "powerPages.com" });
        assert.calledOnce(getWorkspaceFolder);
    });

    it("getCurrentWorkspaceURI_whenGetWorkspaceFolderDoesReturnUndefined_shouldReturnUndefined", () => {
        //Act
        const uriPath = "test";

        const getWorkspaceFolder = stub(
            vscode.workspace,
            "getWorkspaceFolder"
        ).returns(undefined);
        //Action
        const result = getCurrentWorkspaceURI(uriPath);

        //Assert
        expect(result).eq(undefined);
        assert.calledOnce(getWorkspaceFolder);
    });

    it("isSingleFileEntity_whenFileEntityTypeIsExpectedEnum_shouldReturnTrue", () => {
        //Act

        const PowerPagesEntityType = [
            Constants.PowerPagesEntityType.WEBFILES,
            Constants.PowerPagesEntityType.TABLE_PERMISSIONS,
            Constants.PowerPagesEntityType.POLL_PLACEMENTS,
            Constants.PowerPagesEntityType.PAGE_TEMPLATES,
            Constants.PowerPagesEntityType.LISTS,
        ];

        //Action
        PowerPagesEntityType.forEach((fileEntityType) => {
            const result = isSingleFileEntity(fileEntityType);

            //Assert

            expect(result).true;
        });
    });

    it("isSingleFileEntity_whenFileEntityTypeIsOtherThenExpectedEnum_shouldReturnFalse", () => {
        //Act

        const PowerPagesEntityType = [
            Constants.PowerPagesEntityType.WEBPAGES,
            Constants.PowerPagesEntityType.WEBTEMPLATES,
            Constants.PowerPagesEntityType.CONTENT_SNIPPETS,
            Constants.PowerPagesEntityType.WEBLINK_SETS,
            Constants.PowerPagesEntityType.POLLS,
            Constants.PowerPagesEntityType.BASIC_FORMS,
            Constants.PowerPagesEntityType.ADVANCED_FORMS_STEPS,
            Constants.PowerPagesEntityType.ADVANCED_FORMS,
            Constants.PowerPagesEntityType.UNKNOWN,
        ];

        //Action
        PowerPagesEntityType.forEach((fileEntityType) => {
            const result = isSingleFileEntity(fileEntityType);

            //Assert
            expect(result).false;
        });
    });

    it("getFileNameProperties_whenFileEntityTypeIsWEBFILESAndfsPathHavingRightParameter_shouldReturnFileNameAndFormattedFileName", () => {
        //Act
        const uriPath = "test\\file.webfile.yml";
        const fileEntityType = Constants.PowerPagesEntityType.WEBFILES;
        //Action

        const result = getFileNameProperties(uriPath, fileEntityType);

        //Assert
        expect(result).deep.eq({
            fileName: "test\\file",
            formattedFileName: "test\\file",
        });
    });

    it("getFileNameProperties_whenFileEntityTypeIsNotWEBFILESAndfsPathHavingRightParameter_shouldRemoveHypenAndReturnFileNameAndFormattedFileName", () => {
        //Act
        const uriPath = "test\\file-test.webfile.yml";
        const fileEntityType = Constants.PowerPagesEntityType.ADVANCED_FORMS;
        //Action

        const result = getFileNameProperties(uriPath, fileEntityType);

        //Assert

        expect(result).deep.eq({
            fileName: "test\\file-test",
            formattedFileName: "test\\file test",
        });
    });

    it("getFileNameProperties_whenFileCompleteNameDontHave.webfile.yml_shouldRemoveHypenAndReturnFileNameAndFormattedFileName", () => {
        //Act
        const uriPath = "test\\file-test";
        const fileEntityType = Constants.PowerPagesEntityType.WEBFILES;
        //Action

        const result = getFileNameProperties(uriPath, fileEntityType);

        //Assert
        expect(result).deep.eq({
            fileName: "test\\file-test",
            formattedFileName: "test\\file test",
        });
    });
    it("getFileNameProperties_whenFileNameIsBlank_shouldReturnUndefined", () => {
        //Act
        const uriPath = "";
        const fileEntityType = Constants.PowerPagesEntityType.WEBFILES;
        //Action

        const result = getFileNameProperties(uriPath, fileEntityType);

        //Assert
        expect(result).deep.eq({
            fileName: undefined,
            formattedFileName: undefined,
        });
    });

    it("getFieldsToUpdate_whenWEBPAGESPassed_shouldReturnFieldsToUpdateWithDataverseFieldAdxTitle,DataverseFieldAdxPartialUrlAndDataverseFieldAdxName", () => {
        //Act
        const fileEntityType = Constants.PowerPagesEntityType.WEBPAGES;
        const expectResult = [
            Constants.DataverseFieldAdxTitle,
            Constants.DataverseFieldAdxPartialUrl,
            Constants.DataverseFieldAdxName,
        ];
        //Action

        const result = getFieldsToUpdate(fileEntityType);

        //Assert
        expect(result).deep.eq(expectResult);
    });

    it("getFieldsToUpdate_whenWEBFILESPassed_shouldReturnFieldsToUpdateWithDataverseFieldFilename,DataverseFieldAdxPartialUrlAndDataverseFieldAdxName", () => {
        //Act
        const fileEntityType = Constants.PowerPagesEntityType.WEBFILES;
        const expectResult = [
            Constants.DataverseFieldAdxName,
            Constants.DataverseFieldFilename,
            Constants.DataverseFieldAdxPartialUrl,
        ];
        //Action

        const result = getFieldsToUpdate(fileEntityType);

        //Assert
        expect(result).deep.eq(expectResult);
    });

    it("getFieldsToUpdate_whenTABLE_PERMISSIONSPassed_shouldReturnFieldsToUpdateWithDataverseFieldAdxEntityNameAndDataverseFieldAdxEntityLogicalName", () => {
        //Act
        const fileEntityType = Constants.PowerPagesEntityType.TABLE_PERMISSIONS;
        const expectResult = [
            Constants.DataverseFieldAdxEntityName,
            Constants.DataverseFieldAdxEntityLogicalName,
        ];
        //Action

        const result = getFieldsToUpdate(fileEntityType);

        //Assert
        expect(result).deep.eq(expectResult);
    });

    it("getFieldsToUpdate_whenCONTENT_SNIPPETSPassed_shouldReturnFieldsToUpdateWithDataverseFieldAdxDisplayNameAndDataverseFieldAdxName", () => {
        //Act
        const fileEntityType = Constants.PowerPagesEntityType.CONTENT_SNIPPETS;
        const expectResult = [
            Constants.DataverseFieldAdxDisplayName,
            Constants.DataverseFieldAdxName,
        ];
        //Action

        const result = getFieldsToUpdate(fileEntityType);

        //Assert
        expect(result).deep.eq(expectResult);
    });

    it("getFieldsToUpdate_whenCONTENT_SNIPPETSPassed_shouldReturnFieldsToUpdateWithDataverseDataverseFieldAdxName", () => {
        //Act
        const fileEntityType = Constants.PowerPagesEntityType.LISTS;
        const expectResult = [Constants.DataverseFieldAdxName];
        //Action

        const result = getFieldsToUpdate(fileEntityType);

        //Assert
        expect(result).deep.eq(expectResult);
    });

    it("getDeletePathUris_whenUriIsValidAndFilePropertiesHavingFileName_shouldReturnVscode.UriArrayWithData", () => {
        //Act
        const uriPath = "\\web-pages\\.webfile.yml";
        const fileEntityType = Constants.PowerPagesEntityType.WEBFILES;
        const fileProperties = { fileName: "testFileName" } as IFileProperties;

        //Action

        const result = getDeletePathUris(
            uriPath,
            fileEntityType,
            fileProperties
        );

        //Assert
        expect(result).deep.eq([
            {
                _formatted: null,
                _fsPath: null,
                authority: "",
                fragment: "",
                path: "/web-pages/",
                query: "",
                scheme: "file",
            },
        ]);
    });

    it("getDeletePathUris_whenUriIsNotValidAndFilePropertiesHavingFileName_shouldReturnEmptyArrray", () => {
        //Act
        const uriPath = "/web-pages/";
        const fileEntityType = Constants.PowerPagesEntityType.WEBFILES;
        const fileProperties = { fileName: "testFileName" } as IFileProperties;

        //Action

        const result = getDeletePathUris(
            uriPath,
            fileEntityType,
            fileProperties
        );

        //Assert
        expect(result).empty;
    });

    it("getDeletePathUris_whenUriIsValidAndButFileNameEmptyIs_shouldReturnVscodeUriArrayWithData", () => {
        //Act
        const uriPath = "\\web-pages\\.webfile.yml";
        const fileEntityType = Constants.PowerPagesEntityType.WEBFILES;
        const fileProperties = { fileName: "" } as IFileProperties;

        //Action

        const result = getDeletePathUris(
            uriPath,
            fileEntityType,
            fileProperties
        );

        //Assert
        expect(result).empty;
    });

    it("getDeletePathUris_whenUriIsValidAndFilePropertiesHavingFileNameAndfileEntityTypeOtherThenWEBFILES_shouldReturnVscodeUriArrayWithData", () => {
        //Act
        const uriPath = "web-pages";
        const fileEntityType = Constants.PowerPagesEntityType.BASIC_FORMS;
        const fileProperties = { fileName: "testFileName" } as IFileProperties;

        //Action

        const result = getDeletePathUris(
            uriPath,
            fileEntityType,
            fileProperties
        );

        //Assert
        expect(result).deep.eq([
            {
                _formatted: null,
                _fsPath: null,
                authority: "",
                fragment: "",
                path: "/web-pages",
                query: "",
                scheme: "file",
            },
        ]);
    });

    it("getDeletePathUris_whenFsPathDontHavewebfile.yml_shouldReturnVscode.UriArrayWithData", () => {
        //Act
        const uriPath = "\\web-pages\\.webfil";
        const fileEntityType = Constants.PowerPagesEntityType.WEBFILES;
        const fileProperties = { fileName: "testFileName" } as IFileProperties;

        //Action

        const result = getDeletePathUris(
            uriPath,
            fileEntityType,
            fileProperties
        );

        //Assert
        expect(result).deep.eq([
            {
                _formatted: null,
                _fsPath: null,
                authority: "",
                fragment: "",
                path: "/web-pages/.webfil.webfile.yml",
                query: "",
                scheme: "file",
            },
        ]);
    });
});
