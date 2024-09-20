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
        if (node.getChildren() && node.getChildren().length > 0) {
            node.getChildren().forEach(child => {
                getFetchXML(child);
            });
        }
        query += node.getClosingTag();
    };

    getFetchXML(queryTree.root);
    return query;
}

export const generateId = () => {
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const vs = acquireVsCodeApi();

export const getVSCodeApi = () => {
    return vs;
}

export const prettifyXml = (xml: string) =>{
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'application/xml');
    
    // Check for any parsing errors
    const parserError = xmlDoc.getElementsByTagName('parsererror');
    if (parserError.length > 0) {
      throw new Error('Invalid XML format');
    }
  
    // Serialize the DOM Document back to a string with proper indentation
    const serializer = new XMLSerializer();
    const serializedString = serializer.serializeToString(xmlDoc);
  
    // Use regex to format the serialized XML with line breaks and indentation
    return serializedString.replace(/(>)(<)(\/*)/g, '$1\n$2$3').replace(/(<.+?>)/g, (match) => {
      let indent = 0;
      if (match.match(/^<\/.+>/)) {
        indent--;
      }
      const padding = '  '.repeat(Math.max(indent, 0));
      if (match.match(/^<[^/].+[^/]>.*$/)) {
        indent++;
      }
      return padding + match;
    });
}  