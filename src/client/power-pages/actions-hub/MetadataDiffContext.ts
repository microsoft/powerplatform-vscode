/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { IFileComparisonResult } from "./models/IFileComparisonResult";

/**
 * Context for storing metadata diff comparison results
 * This allows the ActionsHubTreeDataProvider to display the diff results in the tree view
 */
class MetadataDiffContextClass {
    private _comparisonResults: IFileComparisonResult[] = [];
    private _siteName: string = "";
    private _isActive: boolean = false;

    private _onChanged: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onChanged: vscode.Event<void> = this._onChanged.event;

    public get comparisonResults(): IFileComparisonResult[] {
        return this._comparisonResults;
    }

    public get siteName(): string {
        return this._siteName;
    }

    public get isActive(): boolean {
        return this._isActive;
    }

    public setResults(results: IFileComparisonResult[], siteName: string): void {
        this._comparisonResults = results;
        this._siteName = siteName;
        this._isActive = results.length > 0;
        this._onChanged.fire();
    }

    public clear(): void {
        this._comparisonResults = [];
        this._siteName = "";
        this._isActive = false;
        this._onChanged.fire();
    }
}

const MetadataDiffContext = new MetadataDiffContextClass();
export default MetadataDiffContext;
