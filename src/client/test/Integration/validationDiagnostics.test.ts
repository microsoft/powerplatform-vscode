/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import vscode from "vscode";
import {
    showDiagnosticMessage,
    validateTextDocument,
} from "../../power-pages/validationDiagnostics";
import { expect } from "chai";
import path from "path";
import sinon from "sinon";
import { ITelemetry } from "../../../common/OneDSLoggerTelemetry/telemetry/ITelemetry";

describe("validationDiagnostics", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    afterEach(() => {
        //  createTerminalSpy.restore();
        sinon.restore();
    });

    it("validateTextDocument_whenPattrenDoesNot_shouldNotSetValueInDiagnostics", async () => {
        //Act
        const filePath = path.join(
            __dirname,
            "..",
            "..",
            "..",
            "..",
            "/src/client/test/Integration/MockValidationDiagnosticsTextDoc.txt"
        );

        const uri = vscode.Uri.parse(path.join("file:///", filePath));
        const patterns = [/z/g];
        const searchByName = true;
        const telemetry = {} as ITelemetry;
        //Action
        await validateTextDocument(uri, patterns, searchByName, telemetry);
        //Assert
        const connection = await vscode.languages.getDiagnostics();
        expect(connection[0][0].scheme).eq("file");
        expect(connection[0][0].path).eq("/\\" + filePath);
        expect(connection[0][1]).empty;
    });

    it("validateTextDocument_whenPattrenIsEmptyArray_shouldNotSetValueInDiagnostics", async () => {
        //Act
        const filePath = path.join(
            __dirname,
            "..",
            "..",
            "..",
            "..",
            "/src/client/test/Integration/MockValidationDiagnosticsTextDoc.txt"
        );

        const uri = vscode.Uri.parse(path.join("file:///", filePath));
        const patterns: RegExp[] = [];
        const searchByName = true;
        const telemetry = {} as ITelemetry;
        //Action
        await validateTextDocument(uri, patterns, searchByName, telemetry);
        //Assert
        const connection = await vscode.languages.getDiagnostics();
        expect(connection[0][0].scheme).eq("file");
        expect(connection[0][0].path).eq("/\\" + filePath);
        expect(connection[0][1]).empty;
    });

    it("validateTextDocument_whenPattrenMatchAndSearchByNameIsTrue_shouldSetValueInDiagnostics", async () => {
        //Act
        const filePath = path.join(
            __dirname,
            "..",
            "..",
            "..",
            "..",
            "/src/client/test/Integration/MockValidationDiagnosticsTextDoc.txt"
        );

        const uri = vscode.Uri.parse(path.join("file:///", filePath));
        const patterns = [/keyword/g, /contains/g];
        const searchByName = true;
        const telemetry = {} as ITelemetry;
        //Action
        await validateTextDocument(uri, patterns, searchByName, telemetry);
        //Assert
        const connection = await vscode.languages.getDiagnostics();
        expect(connection[0][0].scheme).eq("file");
        expect(connection[0][0].path).eq("/\\" + filePath);

        expect(connection[0][1][0].message).eq(
            'PowerPages: File might be referenced by name keyword here.'
        );
        expect(connection[0][1][1].message).eq(
            'PowerPages: File might be referenced by name contains here.'
        );

        expect(connection[0][1][0].source).eq("ex");
        expect(connection[0][1][1].source).eq("ex");

        expect(connection[0][1][0].severity).eq(
            vscode.DiagnosticSeverity.Warning
        );
        expect(connection[0][1][1].severity).eq(
            vscode.DiagnosticSeverity.Warning
        );

        expect(connection[0][1][0].range).not.undefined;
        expect(connection[0][1][1].range).not.undefined;
    });

    it("validateTextDocument_whenPattrenMatchAndSearchByNameIsFalse_shouldSetValueInDiagnostics", async () => {
        //Act
        const filePath = path.join(
            __dirname,
            "..",
            "..",
            "..",
            "..",
            "/src/client/test/Integration/MockValidationDiagnosticsTextDoc.txt"
        );

        const uri = vscode.Uri.parse(path.join("file:///", filePath));
        const patterns = [/keyword/g, /contains/g];
        const searchByName = false;
        const telemetry = {} as ITelemetry;
        //Action
        await validateTextDocument(uri, patterns, searchByName, telemetry);
        //Assert
        const connection = await vscode.languages.getDiagnostics();
        expect(connection[0][0].scheme).eq("file");
        expect(connection[0][0].path).eq("/\\" + filePath);

        expect(connection[0][1][0].message).eq("PowerPages: ");
        expect(connection[0][1][1].message).eq("PowerPages: ");

        expect(connection[0][1][0].source).eq("ex");
        expect(connection[0][1][1].source).eq("ex");

        expect(connection[0][1][0].severity).eq(
            vscode.DiagnosticSeverity.Warning
        );
        expect(connection[0][1][1].severity).eq(
            vscode.DiagnosticSeverity.Warning
        );

        expect(connection[0][1][0].range).not.undefined;
        expect(connection[0][1][1].range).not.undefined;
    });

    it("should show warning message and create new terminal if there is no active terminal", () => {
        // Act
        const showWarningMessageSpy = sinon.spy(
            vscode.window,
            "showWarningMessage"
        );

        const createTerminal = sinon.spy(vscode.window, "createTerminal");
        // Action
        showDiagnosticMessage();

        //Assert
        const showWarningMessageArgs = showWarningMessageSpy.getCalls()[0].args;
        expect(showWarningMessageArgs[0]).eq(
            "Some references might be broken. Please check diagnostics for details."
        );
        expect(showWarningMessageArgs[1]).eq(undefined);

        const createTerminalArgs = createTerminal.getCalls()[0].args;

        expect(createTerminalArgs[0]).eq("Power Apps Portal");
    });
});
