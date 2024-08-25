/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */



import { v4 as uuidv4 } from 'uuid';
import { PresetThemeIds } from './PowerPagesSiteConstants';
import { PowerPagesParsedJson } from './PowerPagesSiteModel';

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

    const powerPagesSiteLanguages = site.powerpagesitelanguage.map((language:any) => {
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
