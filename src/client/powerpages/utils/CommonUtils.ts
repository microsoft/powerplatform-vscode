/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Context } from "@microsoft/generator-powerpages/generators/context";

export const isNullOrEmpty = (str: string | undefined): boolean => {
    return !str || str.trim().length === 0;
};

export const folderName = (name: string) => {
    return name.replace(/[/ ]/g, "-").toLowerCase();
};

export const fileName = (name: string) => {
    const words = name.split(/[/ ]/);

    // Uppercase the first letter of each word and join the words back together
    return words.map((word) => word[0].toUpperCase() + word.slice(1)).join("-");
};

interface pageTemplate {
    name: string;
    value: string;
}

// Function to get the names and values of page templates from a provided context
export function getPageTemplate(context: Context): {
    pageTemplateNames: string[];
    pageTemplateMap: Map<string, string>;
} {
    // Get the page templates from the provided context
    const pageTemplates: pageTemplate[] = context.getPageTemplates();

    // Check if pageTemplates is not empty
    if (!pageTemplates.length) {
        return { pageTemplateNames: [], pageTemplateMap: new Map() };
    }

    // Extract the names of the page templates
    const pageTemplateNames = pageTemplates.map((template) => template.name);

    // Create a map of page template names to their corresponding values
    const pageTemplateMap = new Map<string, string>();
    pageTemplates.forEach((template) => {
        pageTemplateMap.set(template.name, template.value);
    });

    // Return the extracted page template names and map
    return { pageTemplateNames, pageTemplateMap };
}

export function getParentPagePaths(ctx: Context): {
    paths: Array<string>;
    pathsMap: Map<string, string>;
    webpageNames: Array<string>
} {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pages: Map<string, any> = new Map();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx.webpageMap.forEach((page: any) => {
        pages.set(page.id, page.content);
    });

    if (pages.size === 0) {
        return { paths: [], pathsMap: new Map(), webpageNames: [] };
    }
    const paths: Array<string> = [];
    const pathsMap: Map<string, string> = new Map();
    const webpageNames : Array<string> = []
    // eslint-disable-next-line prefer-const
    for (let [webpageid, page] of pages) {
        if (!page.adx_name || !webpageid) {
            continue;
        }
        let path = page.adx_name;
        webpageNames.push(path);

        // If the page is a home page, add it to the paths array
        if (!page.adx_parentpageid && page.adx_partialurl === "/") {
            paths.push(path);
            pathsMap.set(path, webpageid);
            continue;
        }
        let prevPage = null;
        if (pages.has(page.adx_parentpageid)) {
            while (page.adx_parentpageid) {
                if (!pages.has(page.adx_parentpageid)) {
                    break;
                }
                // to check for circular reference
                if (prevPage === page) {
                    break;
                }
                prevPage = page;
                page = pages.get(page.adx_parentpageid);
                path = `${page.adx_name}/${path}`;
            }
            // to check for duplicates
            if (paths.indexOf(path) === -1) {
                paths.push(path);
                pathsMap.set(path, webpageid);
            }
        }
    }
    paths.sort();
    return { paths, pathsMap, webpageNames };
}
