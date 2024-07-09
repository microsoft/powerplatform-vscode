/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { TagToken, Tokenizer, TokenKind, Value } from "liquidjs";
import { OutputToken, PropertyAccessToken } from "liquidjs/dist/tokens";
import { PortalObjects, PortalTags } from "../../server/constants/PortalEnums";

export interface DyanmicEntity {
    tagName: string,
    property: string;
    fileNameOrID?: string;
}

export interface DataParserRule {
    name: string,
    isValid: (liquidToken: TagToken | OutputToken) => boolean
    apply: (liquidToken: TagToken | OutputToken) => DyanmicEntity[]
}

const snippetObjectRule: DataParserRule = {
    name: 'snippetObject',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Output && liquidToken.content.includes(PortalObjects.SNIPPETS),
    apply: (liquidToken) => {
        const entities: DyanmicEntity[] = [];
        const tokenizer = new Tokenizer(liquidToken.content)
        const property = tokenizer.readIdentifier().getText();
        const value = tokenizer.readValue() as PropertyAccessToken;
        const fileNameOrID = value.propertyName;
        const tagName = PortalObjects.SNIPPETS;
        entities.push({ tagName, property, fileNameOrID });
        return entities;
    }
}


const entityFormTagRule: DataParserRule = {
    name: 'entityFormTag',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Tag && (liquidToken as TagToken).name.toLowerCase() === PortalTags.ENTITYFORM,
    apply: (liquidToken) => {
        const entities: DyanmicEntity[] = [];
        const tokenizer = new Tokenizer((liquidToken as TagToken).args)
        const hashes = tokenizer.readHashes();
        hashes.forEach(hash => {
            const property = hash.name.getText()
            const fileNameOrID = hash.value?.getText()
            if (['id', 'name', 'key'].includes(property)) {
                const tagName = PortalTags.ENTITYFORM;
                entities.push({ tagName, property, fileNameOrID });
            }
        })
        return entities
    }
}

const entityListTagRule: DataParserRule = {
    name: 'entityListTag',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Tag && (liquidToken as TagToken).name.toLowerCase() === PortalTags.ENTITYLIST,
    apply: (liquidToken) => {
        const entities: DyanmicEntity[] = [];
        const tokenizer = new Tokenizer((liquidToken as TagToken).args)
        const hashes = tokenizer.readHashes();
        hashes.forEach(hash => {
            const property = hash.name.getText()
            const fileNameOrID = hash.value?.getText()
            if (['id', 'name', 'key'].includes(property)) {
                const tagName = PortalTags.ENTITYLIST;
                entities.push({ tagName, property, fileNameOrID });
            }
        })
        return entities;
    }
}

const webFormTagRule: DataParserRule = {
    name: 'webFormTag',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Tag && (liquidToken as TagToken).name.toLowerCase() === PortalTags.WEBFORM,
    apply: (liquidToken) => {
        const entities: DyanmicEntity[] = [];
        const tokenizer = new Tokenizer((liquidToken as TagToken).args)
        const hashes = tokenizer.readHashes();
        hashes.forEach(hash => {
            const property = hash.name.getText()
            const fileNameOrID = hash.value?.getText()
            if (['id', 'name', 'key'].includes(property)) {
                const tagName = PortalTags.WEBFORM;
                entities.push({ tagName, property, fileNameOrID });
            }
        })
        return entities;
    }
}

const includeTagRule: DataParserRule = {
    name: 'includeTag',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Tag && (liquidToken as TagToken).name.toLowerCase() === PortalTags.INCLUDE,
    apply: (tagToken: TagToken | OutputToken): DyanmicEntity[] => {
        const entities: DyanmicEntity[] = [];
        const tokenizer = new Tokenizer((tagToken as TagToken).args);
        const value = tokenizer.readValue();
        const hashes = tokenizer.readHashes();
        //Handling case - {% include 'Search' %}
        if (hashes.length == 0) {
            const property = "name";
            const fileNameOrID = value?.getText() || '';
            const tagName = "Web Template";
            entities.push({ tagName, property, fileNameOrID });
        } else {
            hashes.forEach(hash => {
                const tagName = value?.getText() || '';
                const property = hash.name.getText().toLowerCase();
                const fileNameOrID = hash.value?.getText();
                entities.push({ tagName, property, fileNameOrID });
            });
        }
        return entities;
    }
};

const editableTagRule: DataParserRule = {
    name: 'editableTag',
    isValid: (liquidToken) => liquidToken.kind === TokenKind.Tag && (liquidToken as TagToken).name.toLowerCase() === PortalTags.EDITABLE,
    apply: (liquidToken) => {
        const entities: DyanmicEntity[] = [];
        const tokenizer = new Tokenizer((liquidToken as TagToken).args)
        const property = tokenizer.readIdentifier().getText();
        const value = tokenizer.readValue()
        const fileNameOrID = value?.getText() || '';
        const tagName = PortalTags.EDITABLE;
        entities.push({ tagName, property, fileNameOrID });
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

