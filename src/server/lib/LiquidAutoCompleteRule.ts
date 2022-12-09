/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { TagToken, Tokenizer, TokenKind } from "liquidjs";
import { IdentifierToken, OutputToken, PropertyAccessToken } from "liquidjs/dist/tokens";
import { CompletionItem, CompletionItemKind } from "vscode-languageserver/node";
import { PortalAttributeNames, PortalEntityNames, PortalObjects, PortalTags } from "../constants/PortalEnums";
import { ILiquidRuleEngineContext } from "./LiquidAutoCompleteRuleEngine";
import { getMatchedManifestRecords, IManifestElement } from "./PortalManifestReader";

const DEFAULT_TAG_PRIORITY = 0;

export const AUTO_COMPLETE_PLACEHOLDER = '_AUTO_COMPLETE_PLACEHOLDER_'

export interface ILiquidAutoCompleteRule {
    isValid: (liquidToken: TagToken | OutputToken) => boolean
    priority: number
    apply: (liquidToken: TagToken | OutputToken, ctx: ILiquidRuleEngineContext) => CompletionItem[]
}

const getSuggestionsForEntity = (entityName: PortalEntityNames, ctx: ILiquidRuleEngineContext, textForAutoComplete?: string, insertById?: boolean): CompletionItem[] => {
    const partialMatch = textForAutoComplete?.replace(/['"]/g, '').replace(AUTO_COMPLETE_PLACEHOLDER, '') || ''
    // return list of web templates for auto completion
    const matchedManifestRecords: IManifestElement[] = getMatchedManifestRecords(ctx.workspaceRootFolders, entityName, ctx.pathOfFileBeingEdited);
    return matchedManifestRecords.filter(record => record.DisplayName.toLowerCase().includes(partialMatch.toLowerCase()))
        .map(record => {
            const toInsert = insertById ? record.RecordId : record.DisplayName
            return {
                label: record.DisplayName,
                insertText: /["'].*['"]/.test(textForAutoComplete || '') ? toInsert : `'${toInsert}'`,
                kind: CompletionItemKind.Value
            } as CompletionItem
        });

}

const portalObjectBaseRule = (liquidToken: OutputToken, entityName: PortalEntityNames, ctx: ILiquidRuleEngineContext) => {
    const suggestions: CompletionItem[] = []
    const tokenizer = new Tokenizer(liquidToken.content)
    const valueToken = tokenizer.readValue() as PropertyAccessToken
    const identifier = (valueToken.props[0] as PropertyAccessToken).variable as IdentifierToken
    if (identifier.content.includes(AUTO_COMPLETE_PLACEHOLDER)) {
        suggestions.push(...getSuggestionsForEntity(entityName, ctx, identifier.content))
    }
    return suggestions
}

const snippetObjectRule: ILiquidAutoCompleteRule = {
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Output && liquidToken.content.includes(PortalObjects.SNIPPETS),
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken, ctx) => {
        return portalObjectBaseRule(liquidToken as OutputToken, PortalEntityNames.CONTENT_SNIPPET, ctx)
    }
}

const settingsObjectRule: ILiquidAutoCompleteRule = {
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Output && liquidToken.content.includes(PortalObjects.SETTINGS),
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken, ctx) => {
        return portalObjectBaseRule(liquidToken as OutputToken, PortalEntityNames.SITE_SETTING, ctx)
    }
}

const weblinksObjectRule: ILiquidAutoCompleteRule = {
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Output && liquidToken.content.includes(PortalObjects.WEBLINKS),
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken, ctx) => {
        return portalObjectBaseRule(liquidToken as OutputToken, PortalEntityNames.WEBLINK_SET, ctx)
    }
}

const sitemakerObjectRule: ILiquidAutoCompleteRule = {
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Output && liquidToken.content.includes(PortalObjects.SITEMARKER),
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken, ctx) => {
        return portalObjectBaseRule(liquidToken as OutputToken, PortalEntityNames.SITE_MARKER, ctx)
    }
}

const rootObjectRule: ILiquidAutoCompleteRule = {
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Output && !liquidToken.content.includes('.') && !liquidToken.content.includes('['),
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken) => {
        const suggestions: CompletionItem[] = []
        const property = liquidToken.content
        if (property.includes(AUTO_COMPLETE_PLACEHOLDER)) {
            suggestions.push(...['page', 'snippets', 'settings', 'sitemap', 'sitemarkers', 'website', 'weblink'].map(key => {
                return {
                    label: key,
                    insertText: key,
                    kind: CompletionItemKind.Value
                } as CompletionItem
            }))
        }
        return suggestions
    }
}

const entityFormTagRule: ILiquidAutoCompleteRule = {
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Tag && (liquidToken as TagToken).name.toLowerCase() === PortalTags.ENTITYFORM,
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken, ctx) => {
        const suggestions: CompletionItem[] = []
        const tokenizer = new Tokenizer((liquidToken as TagToken).args)
        const hashes = tokenizer.readHashes();
        hashes.forEach(hash => {
            const hashName = hash.name.getText()
            if (hashName?.includes(AUTO_COMPLETE_PLACEHOLDER)) {
                suggestions.push(...['id', 'name', 'key', 'language_code'].map(key => {
                    return {
                        label: key,
                        insertText: `${key}:`,
                        kind: CompletionItemKind.Value
                    } as CompletionItem
                }))
                return;
            }
            const hashValue = hash.value?.getText()
            if (hashValue?.includes(AUTO_COMPLETE_PLACEHOLDER) && ['id', 'name', 'key'].includes(hashName)) {
                suggestions.push(...getSuggestionsForEntity(PortalEntityNames.ENTITY_FORM, ctx, hashValue, hashName === 'id'))
                return;
            }
        })
        return suggestions
    }
}

const entityListTagRule: ILiquidAutoCompleteRule = {
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Tag && (liquidToken as TagToken).name.toLowerCase() === PortalTags.ENTITYLIST,
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken, ctx) => {
        const suggestions: CompletionItem[] = []
        const tokenizer = new Tokenizer((liquidToken as TagToken).args)
        const hashes = tokenizer.readHashes();
        hashes.forEach(hash => {
            const hashName = hash.name.getText()
            if (hashName?.includes(AUTO_COMPLETE_PLACEHOLDER)) {
                suggestions.push(...['id', 'name', 'key', 'language_code'].map(key => {
                    return {
                        label: key,
                        insertText: `${key}:`,
                        kind: CompletionItemKind.Value
                    } as CompletionItem
                }))
                return;
            }
            const hashValue = hash.value?.getText()
            if (hashValue?.includes(AUTO_COMPLETE_PLACEHOLDER) && ['id', 'name', 'key'].includes(hashName)) {
                suggestions.push(...getSuggestionsForEntity(PortalEntityNames.ENTITY_LIST, ctx, hashValue, hashName === 'id'))
                return;
            }
        })
        return suggestions
    }
}

const webFormTagRule: ILiquidAutoCompleteRule = {
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Tag && (liquidToken as TagToken).name.toLowerCase() === PortalTags.WEBFORM,
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken, ctx) => {
        const suggestions: CompletionItem[] = []
        const tokenizer = new Tokenizer((liquidToken as TagToken).args)
        const hashes = tokenizer.readHashes();
        hashes.forEach(hash => {
            const hashName = hash.name.getText()
            if (hashName?.includes(AUTO_COMPLETE_PLACEHOLDER)) {
                suggestions.push(...['id', 'name', 'key', 'language_code'].map(key => {
                    return {
                        label: key,
                        insertText: `${key}:`,
                        kind: CompletionItemKind.Value
                    } as CompletionItem
                }))
                return;
            }
            const hashValue = hash.value?.getText()
            if (hashValue?.includes(AUTO_COMPLETE_PLACEHOLDER) && ['id', 'name', 'key'].includes(hashName)) {
                suggestions.push(...getSuggestionsForEntity(PortalEntityNames.WEBFORM, ctx, hashValue, hashName === 'id'))
                return;
            }
        })
        return suggestions
    }
}

const includeTagRule: ILiquidAutoCompleteRule = {
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Tag && (liquidToken as TagToken).name.toLowerCase() === PortalTags.INCLUDE,
    priority: DEFAULT_TAG_PRIORITY,
    apply: (tagToken, ctx) => {
        const suggestions: CompletionItem[] = []
        const tokenizer = new Tokenizer((tagToken as TagToken).args)
        const value = tokenizer.readValue()
        const templateName = value?.getText() || ''
        if (templateName.includes(AUTO_COMPLETE_PLACEHOLDER)) {
            suggestions.push(...getSuggestionsForEntity(PortalEntityNames.WEB_TEMPLATE, ctx, templateName))
            return suggestions
        }
        const hashes = tokenizer.readHashes();
        hashes.forEach(hash => {
            const hashName = hash.name.getText().toLowerCase()
            const hashValue = hash.value?.getText()
            if (hashName === PortalAttributeNames.SNIPPET_NAME && hashValue?.includes(AUTO_COMPLETE_PLACEHOLDER) && templateName.replace(/['"]/g, '').toLowerCase() === PortalAttributeNames.SNIPPET) {
                suggestions.push(...getSuggestionsForEntity(PortalEntityNames.CONTENT_SNIPPET, ctx, hashValue))
                return;
            } else if (hashName === 'key' && hashValue?.includes(AUTO_COMPLETE_PLACEHOLDER) && templateName.replace(/['"]/g, '').toLowerCase() === PortalAttributeNames.ENTITY_LIST) {
                suggestions.push(...getSuggestionsForEntity(PortalEntityNames.ENTITY_LIST, ctx, hashValue))
                return;
            }
        })
        return suggestions
    }
}

const editableTagRule: ILiquidAutoCompleteRule = {
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Tag && (liquidToken as TagToken).name.toLowerCase() === PortalTags.EDITABLE,
    priority: DEFAULT_TAG_PRIORITY,
    apply: (tagToken, ctx) => {
        const suggestions: CompletionItem[] = []
        const tokenizer = new Tokenizer((tagToken as TagToken).args)
        const identifier = tokenizer.readIdentifier().getText();
        if (identifier.includes(AUTO_COMPLETE_PLACEHOLDER)) {
            return ['page', 'snippets', 'weblinks'].map(identifier => {
                return {
                    label: identifier,
                    insertText: identifier,
                    kind: CompletionItemKind.Value
                } as CompletionItem
            })
        }
        const value = tokenizer.readValue()
        const editableAttribute = value?.getText() || ''
        if (editableAttribute.includes(AUTO_COMPLETE_PLACEHOLDER) && identifier.toLowerCase() === 'snippets') {
            suggestions.push(...getSuggestionsForEntity(PortalEntityNames.CONTENT_SNIPPET, ctx, editableAttribute))
            return suggestions
        } else if (editableAttribute.includes(AUTO_COMPLETE_PLACEHOLDER) && identifier.toLowerCase() === 'page') {
            return ['adx_copy', 'adx_summary', 'adx_title', 'adx_partialurl'].map(identifier => {
                return {
                    label: identifier,
                    insertText: identifier,
                    kind: CompletionItemKind.Value
                } as CompletionItem
            })
        }
        const hashes = tokenizer.readHashes();
        hashes.forEach(hash => {
            const hashName = hash.name.getText()
            if (hashName?.includes(AUTO_COMPLETE_PLACEHOLDER)) {
                suggestions.push(...['class', 'default', 'escape', 'liquid', 'tag', 'title', 'type'].map(key => {
                    return {
                        label: key,
                        insertText: `${key}:`,
                        kind: CompletionItemKind.Value
                    } as CompletionItem
                }))
                return
            }
        })
        return suggestions
    }
}

export const ruleDefinitions = [
    includeTagRule,
    editableTagRule,
    entityFormTagRule,
    webFormTagRule,
    entityListTagRule,
    rootObjectRule,
    snippetObjectRule,
    settingsObjectRule,
    weblinksObjectRule,
    sitemakerObjectRule
]
