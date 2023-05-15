/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { TagToken, Tokenizer, TokenKind } from "liquidjs";
import { FilterToken, IdentifierToken, OutputToken, PropertyAccessToken } from "liquidjs/dist/tokens";
import { CompletionItem, CompletionItemKind } from "vscode-languageserver/node";
import { AUTO_COMPLETE_PLACEHOLDER, EDITABLE_ATTRIBUTES, ENTITY_FORM_ATTRIBUTES, ENTITY_LIST_ATTRIBUTES, PAGE_ATTRIBUTES, PORTAL_FILTERS, PORTAL_OBJECTS, WEB_FORM_ATTRIBUTES, OBJECT_ATTRIBUTES_MAP } from "../constants/AutoComplete";
import { PortalAttributeNames, PortalEntityNames, PortalObjects, PortalTags } from "../constants/PortalEnums";
import { ILiquidRuleEngineContext } from "./LiquidAutoCompleteRuleEngine";
import { getMatchedManifestRecords, IManifestElement } from "./PortalManifestReader";

const DEFAULT_TAG_PRIORITY = 0;
const QUOTES_REGEX = /['"]/g;


export interface ILiquidAutoCompleteRule {
    name: string,
    isValid: (liquidToken: TagToken | OutputToken) => boolean
    priority: number
    apply: (liquidToken: TagToken | OutputToken, ctx: ILiquidRuleEngineContext) => CompletionItem[]
}

const getSuggestionsForEntity = (entityName: PortalEntityNames, ctx: ILiquidRuleEngineContext, textForAutoComplete?: string, insertById?: boolean): CompletionItem[] => {
    const partialMatch = textForAutoComplete?.replace(QUOTES_REGEX, '').replace(AUTO_COMPLETE_PLACEHOLDER, '') || ''
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
    if (identifier?.content.includes(AUTO_COMPLETE_PLACEHOLDER)) {
        suggestions.push(...getSuggestionsForEntity(entityName, ctx, identifier.content))
    }
    return suggestions
}

const snippetObjectRule: ILiquidAutoCompleteRule = {
    name: 'snippetObject',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Output && liquidToken.content.includes(PortalObjects.SNIPPETS),
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken, ctx) => {
        return portalObjectBaseRule(liquidToken as OutputToken, PortalEntityNames.CONTENT_SNIPPET, ctx)
    }
}

const settingsObjectRule: ILiquidAutoCompleteRule = {
    name: 'settingsObject',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Output && liquidToken.content.includes(PortalObjects.SETTINGS),
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken, ctx) => {
        return portalObjectBaseRule(liquidToken as OutputToken, PortalEntityNames.SITE_SETTING, ctx)
    }
}

const weblinksObjectRule: ILiquidAutoCompleteRule = {
    name: 'weblinksObject',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Output && liquidToken.content.includes(PortalObjects.WEBLINKS),
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken, ctx) => {
        return portalObjectBaseRule(liquidToken as OutputToken, PortalEntityNames.WEBLINK_SET, ctx)
    }
}

const sitemakerObjectRule: ILiquidAutoCompleteRule = {
    name: 'sitemakerObject',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Output && liquidToken.content.includes(PortalObjects.SITEMARKER),
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken, ctx) => {
        return portalObjectBaseRule(liquidToken as OutputToken, PortalEntityNames.SITE_MARKER, ctx)
    }
}

const rootObjectRule: ILiquidAutoCompleteRule = {
    name: 'rootObject',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Output && !liquidToken.content.includes('.') && !liquidToken.content.includes('['),
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken) => {
        const suggestions: CompletionItem[] = []
        const property = liquidToken.content
        if (property.includes(AUTO_COMPLETE_PLACEHOLDER)) {
            suggestions.push(...PORTAL_OBJECTS.map(key => {
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

const rootObjectAttributesRule: ILiquidAutoCompleteRule = {
    name: 'rootObjectAttributes',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Output && (liquidToken.content.includes('.') || liquidToken.content.includes('[')),
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken) => {
        const suggestions: CompletionItem[] = []
        const property = liquidToken.content
        const portalObject = property.includes('.') ? property.split(".")[0] : property.includes("[") ? property.split("[")[0] : null;
        if (property.includes(AUTO_COMPLETE_PLACEHOLDER) && portalObject && PORTAL_OBJECTS.includes(portalObject)) {
            suggestions.push(...(OBJECT_ATTRIBUTES_MAP.get(portalObject) ?? []).map(key => {
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
    name: 'entityFormTag',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Tag && (liquidToken as TagToken).name.toLowerCase() === PortalTags.ENTITYFORM,
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken, ctx) => {
        const suggestions: CompletionItem[] = []
        const tokenizer = new Tokenizer((liquidToken as TagToken).args)
        const hashes = tokenizer.readHashes();
        hashes.forEach(hash => {
            const hashName = hash.name.getText()
            if (hashName?.includes(AUTO_COMPLETE_PLACEHOLDER)) {
                suggestions.push(...ENTITY_FORM_ATTRIBUTES.map(key => {
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
    name: 'entityListTag',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Tag && (liquidToken as TagToken).name.toLowerCase() === PortalTags.ENTITYLIST,
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken, ctx) => {
        const suggestions: CompletionItem[] = []
        const tokenizer = new Tokenizer((liquidToken as TagToken).args)
        const hashes = tokenizer.readHashes();
        hashes.forEach(hash => {
            const hashName = hash.name.getText()
            if (hashName?.includes(AUTO_COMPLETE_PLACEHOLDER)) {
                suggestions.push(...ENTITY_LIST_ATTRIBUTES.map(key => {
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
    name: 'webFormTag',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Tag && (liquidToken as TagToken).name.toLowerCase() === PortalTags.WEBFORM,
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken, ctx) => {
        const suggestions: CompletionItem[] = []
        const tokenizer = new Tokenizer((liquidToken as TagToken).args)
        const hashes = tokenizer.readHashes();
        hashes.forEach(hash => {
            const hashName = hash.name.getText()
            if (hashName?.includes(AUTO_COMPLETE_PLACEHOLDER)) {
                suggestions.push(...WEB_FORM_ATTRIBUTES.map(key => {
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
    name: 'includeTag',
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
            if (hashName === PortalAttributeNames.SNIPPET_NAME && hashValue?.includes(AUTO_COMPLETE_PLACEHOLDER) && templateName.replace(QUOTES_REGEX, '').toLowerCase() === PortalAttributeNames.SNIPPET) {
                suggestions.push(...getSuggestionsForEntity(PortalEntityNames.CONTENT_SNIPPET, ctx, hashValue))
                return;
            } else if (hashName === 'key' && hashValue?.includes(AUTO_COMPLETE_PLACEHOLDER) && templateName.replace(QUOTES_REGEX, '').toLowerCase() === PortalAttributeNames.ENTITY_LIST) {
                suggestions.push(...getSuggestionsForEntity(PortalEntityNames.ENTITY_LIST, ctx, hashValue))
                return;
            }
        })
        return suggestions
    }
}

const editableTagRule: ILiquidAutoCompleteRule = {
    name: 'editableTag',
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
            return PAGE_ATTRIBUTES.map(identifier => {
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
                suggestions.push(...EDITABLE_ATTRIBUTES.map(key => {
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

const allFiltersRule: ILiquidAutoCompleteRule = {
    name: 'allFilters',
    isValid: (liquidToken) => liquidToken.content.includes('|'),
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken) => {
        const suggestions: CompletionItem[] = []
        let filters: FilterToken[] = []
        if (liquidToken.kind === TokenKind.Output) {
            const tk = new Tokenizer(liquidToken.content);
            tk.readExpression()
            filters = tk.readFilters();
        } else {
            const tk = new Tokenizer(liquidToken.content.substring(liquidToken.content.indexOf('|')));
            filters = tk.readFilters();
        }

        filters.forEach(filter => {
            if (filter.name.includes(AUTO_COMPLETE_PLACEHOLDER)) {
                suggestions.push(...PORTAL_FILTERS.map(key => {
                    return {
                        label: key,
                        insertText: key,
                        kind: CompletionItemKind.Value
                    } as CompletionItem
                }))
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
    rootObjectAttributesRule,
    snippetObjectRule,
    settingsObjectRule,
    weblinksObjectRule,
    sitemakerObjectRule,
    allFiltersRule
]
