/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { Tokenizer, TokenKind } from "liquidjs";
import { OutputToken, TagToken } from "liquidjs/dist/tokens";
import { TextDocument } from "vscode-languageserver-textdocument";
import { CompletionItem, WorkspaceFolder } from "vscode-languageserver/node";
import { getEditedLineContent } from "./LineReader";
import { AUTO_COMPLETE_PLACEHOLDER, ILiquidAutoCompleteRule, ruleDefinitions } from "./LiquidAutoCompleteRule";

export interface ILiquidRuleEngineContext {
    workspaceRootFolders: WorkspaceFolder[] | null
    pathOfFileBeingEdited: string
}

interface ILiquidAutoComplete {
    LiquidExpression: string;
    AutoCompleteAtIndex: number;
}

const liquidTagStartExpression = '{%';
const liquidTagEndExpression = '%}';

const liquidOutputStartExpression = '{{';
const liquidOutputEndExpression = '}}';

const rules: ILiquidAutoCompleteRule[] = []

export const initLiquidRuleEngine = () => {
    ruleDefinitions.forEach(rule => rules.push(rule))
}

const getSuggestionsFromRules = (liquidToken: TagToken | OutputToken, context: ILiquidRuleEngineContext): CompletionItem[] => {
    return rules
        .sort((r1, r2) => { return r1.priority - r2.priority })
        .map(r => r.isValid(liquidToken) ? r.apply(liquidToken, context) : [])
        .reduce(function (prev, next) {
            return prev.concat(next);
        }, []);
}

export const getSuggestions = (rowIndex: number, colIndex: number, pathOfFileBeingEdited: string, workspaceRootFolders: WorkspaceFolder[] | null, editedTextDocument: TextDocument) => {
    const editedLine = getEditedLineContent(rowIndex, editedTextDocument);
    const liquidForAutocomplete = getEditedLiquidExpression(colIndex, editedLine);
    if (!liquidForAutocomplete) {
        return []
    }
    try {
        const tokenizer = new Tokenizer(
            liquidForAutocomplete.LiquidExpression.slice(0, liquidForAutocomplete.AutoCompleteAtIndex)
            + AUTO_COMPLETE_PLACEHOLDER
            + liquidForAutocomplete.LiquidExpression.slice(liquidForAutocomplete.AutoCompleteAtIndex
            ));
        const liquidTokens = tokenizer.readTopLevelTokens();
        if (liquidTokens[0].kind === TokenKind.HTML) {
            return []
        }
        return getSuggestionsFromRules(liquidTokens[0] as TagToken | OutputToken, { workspaceRootFolders, pathOfFileBeingEdited })
    } catch (e) {
        // Add telemetry log. Failed to parse liquid expression. (This may bloat up the logs so double check about this)
    }
    return []
}

const getEditedLiquidExpression = (colIndex: number, editedLine: string) => {
    try {
        return getLiquidExpression(editedLine, colIndex, liquidTagStartExpression, liquidTagEndExpression) || getLiquidExpression(editedLine, colIndex, liquidOutputStartExpression, liquidOutputEndExpression)
    } catch (e) {
        // Add Telemetry for index out of bounds...not a proper liquid expression. This may again bloat up the logs (since the autocomplete events can be fired even for non-portal html files)
    }
}

const getLiquidExpression = (editedLine: string, colIndex: number, startDelimiter: string, endDelimiter: string) => {
    const contentOnLeftOfCursor = editedLine.substring(0, colIndex);
    const startIndexOfEditedLiquidExpression = contentOnLeftOfCursor.lastIndexOf(startDelimiter)
    const editedLiquidExpressionOnLeftOfCursor = contentOnLeftOfCursor.substring(startIndexOfEditedLiquidExpression, contentOnLeftOfCursor.length);
    const contentOnRightOfCursor = editedLine.substring(colIndex, editedLine.length);
    const endIndexOfEditedLiquidExpression = contentOnRightOfCursor.indexOf(endDelimiter);
    const editedLiquidExpressionOnRightOfCursor = contentOnRightOfCursor.substring(0, endIndexOfEditedLiquidExpression + liquidTagEndExpression.length);
    if (startIndexOfEditedLiquidExpression >= 0 && endIndexOfEditedLiquidExpression >= 0) {
        return {
            LiquidExpression: editedLiquidExpressionOnLeftOfCursor + editedLiquidExpressionOnRightOfCursor,
            AutoCompleteAtIndex: colIndex - startIndexOfEditedLiquidExpression,
        } as ILiquidAutoComplete
    } else {
        return;
    }
}
