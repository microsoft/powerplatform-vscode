/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { TagToken, Tokenizer, TokenKind, Value } from "liquidjs";
import { OutputToken, PropertyAccessToken } from "liquidjs/dist/tokens";
import { PortalObjects, PortalTags } from "../server/constants/PortalEnums";

const DEFAULT_TAG_PRIORITY = 0;

export interface DyanmicEntity {
    templateName: string,
    hashName: string;
    hashValue?: string;
}

export interface DataParserRule {
    name: string,
    isValid: (liquidToken: TagToken | OutputToken) => boolean
    priority: number
    apply: (liquidToken: TagToken | OutputToken) => DyanmicEntity[]
}

const portalObjectBaseRule = (liquidToken: OutputToken, templateName: PortalObjects) => {
    const entities: DyanmicEntity[] = [];
    const tokenizer = new Tokenizer(liquidToken.content)
    const hashName = tokenizer.readIdentifier().getText();
    const value = tokenizer.readValue() as PropertyAccessToken;
    const hashValue = value.propertyName;
    entities.push({ templateName, hashName, hashValue });
    return entities;
}

const snippetObjectRule: DataParserRule = {
    name: 'snippetObject',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Output && liquidToken.content.includes(PortalObjects.SNIPPETS),
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken) => {
        return portalObjectBaseRule(liquidToken as OutputToken, PortalObjects.SNIPPETS);
    }
}


const entityFormTagRule: DataParserRule = {
    name: 'entityFormTag',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Tag && (liquidToken as TagToken).name.toLowerCase() === PortalTags.ENTITYFORM,
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken) => {
        const entities: DyanmicEntity[] = [];
        const tokenizer = new Tokenizer((liquidToken as TagToken).args)
        const hashes = tokenizer.readHashes();
        hashes.forEach(hash => {
            const hashName = hash.name.getText()
            const hashValue = hash.value?.getText()
            if (['id', 'name', 'key'].includes(hashName)) {
                const templateName = PortalTags.ENTITYFORM;
                entities.push({ templateName, hashName, hashValue });
            }
        })
        return entities
    }
}

const entityListTagRule: DataParserRule = {
    name: 'entityListTag',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Tag && (liquidToken as TagToken).name.toLowerCase() === PortalTags.ENTITYLIST,
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken) => {
        const entities: DyanmicEntity[] = [];
        const tokenizer = new Tokenizer((liquidToken as TagToken).args)
        const hashes = tokenizer.readHashes();
        hashes.forEach(hash => {
            const hashName = hash.name.getText()
            const hashValue = hash.value?.getText()
            if (['id', 'name', 'key'].includes(hashName)) {
                const templateName = PortalTags.ENTITYLIST;
                entities.push({ templateName, hashName, hashValue });
            }
        })
        return entities;
    }
}

const webFormTagRule: DataParserRule = {
    name: 'webFormTag',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Tag && (liquidToken as TagToken).name.toLowerCase() === PortalTags.WEBFORM,
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken) => {
        const entities: DyanmicEntity[] = [];
        const tokenizer = new Tokenizer((liquidToken as TagToken).args)
        const hashes = tokenizer.readHashes();
        hashes.forEach(hash => {
            const hashName = hash.name.getText()
            const hashValue = hash.value?.getText()
            if (['id', 'name', 'key'].includes(hashName)) {
                const templateName = PortalTags.WEBFORM;
                entities.push({ templateName, hashName, hashValue });
            }
        })
        return entities;
    }
}

const includeTagRule: DataParserRule = {
    name: 'includeTag',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Tag && (liquidToken as TagToken).name.toLowerCase() === PortalTags.INCLUDE,
    priority: DEFAULT_TAG_PRIORITY,
    apply: (tagToken: TagToken | OutputToken): DyanmicEntity[] => {
        const entities: DyanmicEntity[] = [];
        const tokenizer = new Tokenizer((tagToken as TagToken).args);
        const value = tokenizer.readValue();
        const hashes = tokenizer.readHashes();
        //Handling case - {% include 'Search' %}
        if (hashes.length == 0) {
            const hashName = "name";
            const hashValue = value?.getText() || '';
            const templateName = "Template";
            entities.push({ templateName, hashName, hashValue });
        } else {
            hashes.forEach(hash => {
                const templateName = value?.getText() || '';
                const hashName = hash.name.getText().toLowerCase();
                const hashValue = hash.value?.getText();
                entities.push({ templateName, hashName, hashValue });
            });
        }
        return entities;
    }
};

const editableTagRule: DataParserRule = {
    name: 'editableTag',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Tag && (liquidToken as TagToken).name.toLowerCase() === PortalTags.EDITABLE,
    priority: DEFAULT_TAG_PRIORITY,
    apply: (liquidToken) => {
        const entities: DyanmicEntity[] = [];
        const tokenizer = new Tokenizer((liquidToken as TagToken).args)
        const hashName = tokenizer.readIdentifier().getText();
        const value = tokenizer.readValue()
        const hashValue = value?.getText() || '';
        const templateName = PortalTags.EDITABLE;
        entities.push({ templateName, hashName, hashValue });
        return entities;
    }
}



export const ruleDefinitions = [
    includeTagRule,
    editableTagRule,
    entityFormTagRule,
    webFormTagRule,
    entityListTagRule,
    snippetObjectRule,
]

