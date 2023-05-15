/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { PacWrapper } from '../pac/PacWrapper';
import { AuthTreeView } from './AuthPanelView';
import { EnvAndSolutionTreeView } from './EnvAndSolutionTreeView';

export function RegisterPanels(pacWrapper: PacWrapper): vscode.Disposable[] {
    const authPanel = new AuthTreeView(() => pacWrapper.authList(), pacWrapper);
    const envAndSolutionPanel = new EnvAndSolutionTreeView(
        () => pacWrapper.orgList(),
        (environmentUrl) => pacWrapper.solutionListFromEnvironment(environmentUrl),
        authPanel.onDidChangeTreeData);

    return [authPanel, envAndSolutionPanel];
}
