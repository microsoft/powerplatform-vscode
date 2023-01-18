/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment
// @ts-ignore
import { DesktopFS } from "@microsoft/generator-powerpages/generators/desktopFs";
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

export async function getWebTemplates(
    portalDir: string,
    fs: DesktopFS
): Promise<{
    webTemplateNames: string[];
    webTemplateMap: Map<string, string>;
}> {
    const context = Context.getInstance(portalDir, fs);
    await context.init(["WebTemplate"]);
    const webTemplates: WebTemplate[] = context.getWebTemplates();

    const webTemplateNames = webTemplates.map((template) => template.name);
    const webTemplateMap = new Map<string, string>();
    webTemplates.forEach((template) => {
        webTemplateMap.set(template.name, template.value);
    });
    return { webTemplateNames, webTemplateMap };
}

interface WebTemplate {
    name: string;
    value: string;
}
