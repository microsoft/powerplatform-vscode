/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { INode } from "../interfaces/Node";
import { ITree } from "../interfaces/Tree";

export const getFetchXmlFromQueryTree = (queryTree: ITree) => {
    let query = "";
    const getFetchXML = (node: INode) => {
        query += node.getOpeningTag();
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
                getFetchXML(child);
            });
        }
        query += node.getClosingTag();
    };

    getFetchXML(queryTree.root);
    return query;
}