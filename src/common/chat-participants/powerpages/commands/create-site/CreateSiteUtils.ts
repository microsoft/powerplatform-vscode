/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */



import { v4 as uuidv4 } from 'uuid';
import { PresetThemeIds, CDS_API_BASE_URL, CDS_API_VERSION, CONTENT_TYPE_JSON } from './CreateSiteConstants';
import { PowerPagesParsedJson, IURLParams } from './CreateSiteModel';


/* eslint-disable @typescript-eslint/no-non-null-assertion */

export const reGuidPowerPagesSite = (site: PowerPagesParsedJson): PowerPagesParsedJson => {
    if (
        site.powerpagesite.length === 0 ||
        site.powerpagesitelanguage.length === 0 ||
        site.powerpagesite[0].powerpagesiteid === null ||
        site.powerpagesite[0].powerpagesiteid === undefined
    ) {
        return {
            powerpagecomponent: [],
            powerpagesite: [],
            powerpagesitelanguage: [],
        };
    }
    const guidMap = new Map<string, string>();
    guidMap.set(site.powerpagesite[0].powerpagesiteid, uuidv4());

    // Ensure site theme ids dont get overwritten by mapping them to themselves
    for (const key of Object.keys(PresetThemeIds) as Array<keyof typeof PresetThemeIds>) {
        guidMap.set(PresetThemeIds[key], PresetThemeIds[key]);
    }

    const reguidContent = (content: string): string => {
        if (content) {
            let newContent = content;
            const regex = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
            let match = regex.exec(newContent);
            while (match !== null && match.length > 0) {
                const current = match[0] as string;
                if (!guidMap.has(current)) {
                    guidMap.set(current, uuidv4());
                }
                newContent = newContent.replace(current, guidMap.get(current)!);
                match = regex.exec(content);
            }
            return newContent;
        }
        return content;
    };

    const powerPagesSites = [
        {
            ...site.powerpagesite[0],
            powerpagesiteid: guidMap.get(site.powerpagesite[0].powerpagesiteid)!,
            content: reguidContent(site.powerpagesite[0].content),
        },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const powerPagesSiteLanguages = site.powerpagesitelanguage.map((language: any) => {
        if (!guidMap.has(language.powerpagesitelanguageid)) {
            guidMap.set(language.powerpagesitelanguageid, uuidv4());
        }
        return {
            ...language,
            powerpagesitelanguageid: guidMap.get(language.powerpagesitelanguageid)!,
            powerpagesiteid: guidMap.get(language.powerpagesiteid!)!,
            content: reguidContent(language.content),
        };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const powerPagesComponents = site.powerpagecomponent.map((component: any) => {
        if (!guidMap.has(component.powerpagecomponentid)) {
            guidMap.set(component.powerpagecomponentid, uuidv4());
        }
        return {
            ...component,
            powerpagecomponentid: guidMap.get(component.powerpagecomponentid)!,
            content: reguidContent(component.content),
            powerpagesitelanguageid: component.powerpagesitelanguageid
                ? guidMap.get(component.powerpagesitelanguageid)!
                : null,
            powerpagesiteid: guidMap.get(component.powerpagesiteid!)!,
        };
    });

    return {
        powerpagecomponent: powerPagesComponents,
        powerpagesite: powerPagesSites,
        powerpagesitelanguage: powerPagesSiteLanguages,
    };
};

/**
* Get the request URL
* @param URLParams IURLParams
*/
export const getCDSEntityRequestURL = (URLParams: IURLParams): string => {
    const { entityId, entityName, query, apiVersion, additionalPathTokens } = URLParams;
    let url = `${CDS_API_BASE_URL}/${apiVersion ? apiVersion : CDS_API_VERSION}`;
    if (entityName) {
        url = `${url}/${entityName}`;
        if (entityId) {
            url = `${url}(${entityId})`;
        }
    }
    if (additionalPathTokens && additionalPathTokens.length > 0) {
        url = `${url}/${additionalPathTokens.join('/')}`;
    }
    if (query) {
        url = `${url}?${query}`;
    }
    return url;
};

/**
* Get the path for the CDS Entity URL
* @param URLParams
* @returns path of the URL
*/
export const getCDSEntityRequestURLPath = (URLParams: IURLParams): string => {
    const url = getCDSEntityRequestURL(URLParams);
    const urlObj = new URL(url);
    return urlObj.pathname;
};


export const generateRandomColorNumber = () => {
    const colorNumbers = [1, 2, 3, 5, 6, 7, 8];
    return colorNumbers[Math.floor(Math.random() * colorNumbers.length)];
};

/**
 * Converts base-64 encoded string to an array buffer
 * @param base64String the string containing data to convert
 * @returns ArrayBuffer
 */
export function base64ToArrayBuffer(base64String: string): ArrayBuffer {
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length).map((_, i) => binaryString.charCodeAt(i));
    return bytes.buffer;
}

export const getFileUploadHeaders = (fileName: string, dataverseToken: string) => {
    return {
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Content-Type': 'application/octet-stream',
        'x-ms-file-name': `${fileName}`,
        Authorization: `Bearer ${dataverseToken}`
    };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createHttpRequestOptions(method: string, url: string, body: any, headers?: Record<string, string>): any {
    return {
        method,
        url,
        headers: {
            'Content-Type': CONTENT_TYPE_JSON,
            ...headers,
        },
        body: JSON.stringify(body),
    };
}
