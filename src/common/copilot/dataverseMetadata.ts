/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { NetworkError } from "./constants";
import fetch, { RequestInit } from "node-fetch";

export async function getEntityMetadata(entityName: string, orgUrl: string, apiToken:string) {

    const dataverseURL = `${orgUrl}api/data/v9.2/EntityDefinitions(LogicalName='${entityName}')?$expand=Attributes($select=LogicalName)`

    const requestInit: RequestInit = {
        method: "GET",
        headers: {
            'Content-Type': "application/json",
            Authorization: `Bearer ${apiToken}`,
        }
    }

    try {
        const response = await fetch(dataverseURL, {
          ...requestInit
        });

        if (response.ok) {
            try {
                const jsonResponse = await response.json();
                if (jsonResponse.Attributes && Array.isArray(jsonResponse.Attributes) && jsonResponse.Attributes.length > 0) {
                    const attributes = jsonResponse.Attributes;
                    interface Attribute {
                        LogicalName: string;
                    }
                    const attributesNames = attributes.map((attribute: Attribute) => attribute.LogicalName);
                    return attributesNames;
                }
                throw new Error("Invalid response format");
            } catch (error) {
                return NetworkError;
            }
        }
    }
    catch (error) {
        return NetworkError;
    }
}
