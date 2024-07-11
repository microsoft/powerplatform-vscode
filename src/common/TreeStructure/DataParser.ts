/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Tokenizer, TokenKind } from "liquidjs";
import { OutputToken, TagToken } from "liquidjs/dist/tokens";
import { DataParserRule, ruleDefinitions, DyanmicEntity } from "./DataParserRule";
import { oneDSLoggerWrapper } from "../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";

const rules: DataParserRule[] = [];
ruleDefinitions.forEach(rule => rules.push(rule))

export const getDependencies = (content: string): DyanmicEntity[] => {
    const tokenizer = new Tokenizer(content);
    const liquidTokens = tokenizer.readTopLevelTokens();
    const allDependencey: DyanmicEntity[] = [];
    liquidTokens.forEach(token => {
        if (token.kind !== TokenKind.HTML) {
            const info = checkRule(token as TagToken | OutputToken);
            allDependencey.push(...info);
        }
    });
    return allDependencey;
};

const checkRule = (liquidToken: TagToken | OutputToken): DyanmicEntity[] => {
    return rules
        .map(r => {
            if (r.isValid(liquidToken)) {
                oneDSLoggerWrapper.getLogger().traceInfo("Tag Used", {
                    "tags": liquidToken.content
                });
                const info = r.apply(liquidToken)
                return info;
            } else {
                return []
            }
        })
        .reduce(function (prev, next) {
            return prev.concat(next);
        }, []);
}