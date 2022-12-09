/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { OutputToken, TagToken } from "liquidjs/dist/tokens";
import { CompletionItem, WorkspaceFolder } from "vscode-languageserver/node";
import { ILiquidAutoCompleteRule, ruleDefinitions } from "./LiquidAutoCompleteRule";

export interface ILiquidRuleEngineContext {
    workspaceRootFolders: WorkspaceFolder[] | null
    pathOfFileBeingEdited: string
}

const rules: ILiquidAutoCompleteRule[] = []

export const addRule = (rule: ILiquidAutoCompleteRule) => {
    rules.push(rule)
}

export const initLiquidRuleEngine = () => {
    ruleDefinitions.forEach(rule => rules.push(rule))
}

export const getSuggestionsFromRules = (liquidToken: TagToken | OutputToken, context: ILiquidRuleEngineContext): CompletionItem[] => {
    return rules
        .sort((r1, r2) => { return r1.priority - r2.priority })
        .map(r => r.isValid(liquidToken) ? r.apply(liquidToken, context) : [])
        .reduce(function(prev, next) {
            return prev.concat(next);
        },[]);
}
