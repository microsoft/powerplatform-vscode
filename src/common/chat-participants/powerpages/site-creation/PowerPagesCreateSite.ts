/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


import { getNL2SiteData } from '../NL2SiteService';
import { getNL2PageData } from '../NL2PageService';
import { PowerPagesSiteManager } from './PowerPagesSiteManager';
import { ITelemetry } from '../../../OneDSLoggerTelemetry/telemetry/ITelemetry';
// import { getLinkedEnvironmentMetadata, getLanguageLcidByLabel, currentEnvironment, language } from './utils'; // Import necessary utilities

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createSite = async (intelligenceEndpoint: string, intelligenceApiToken: string, userPrompt: string, siteUrl: string, sessionId: string, stream: any, telemetry: ITelemetry) => {
    // Call NL2Site service to get initial site content
    const {siteName, pages, siteDescription}= await getNL2SiteData(intelligenceEndpoint, intelligenceApiToken, userPrompt, sessionId);

    console.log(siteName, pages, siteDescription);

    if (!siteName) {
        throw new Error('Failed to get site content from NL2Site service');
    }

    // const siteName = siteContent.siteName;
    const sitePagesList = pages.map((page: { pageName: string; }) => page.pageName);

    stream.progress('Generating webpages...');

    // Call NL2Page service to get page content
    const sitePages = await getNL2PageData(intelligenceEndpoint, intelligenceApiToken, userPrompt, siteName, sitePagesList, sessionId);

    if (!sitePages) {
        throw new Error('Failed to get page content from NL2Page service');
    }


    //create a object of sitePagesList and sitePages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sitePagesMap = sitePagesList.reduce((acc: any, pageName: string, index: number) => {
        acc[pageName] = sitePages[index];
        return acc;
    }, {});

    // Initialize PowerPagesSiteManager
    const siteManager = new PowerPagesSiteManager('BlankTemplate', 'English', telemetry);

    // Load the template
    await siteManager.loadTemplate();
    const { actions } = siteManager.getSiteDataAndActions();
    actions.updateSiteName(siteName);

    const promises = Object.entries(sitePagesMap).map(([pageName, pageContent ]) => {
        if (typeof pageContent === 'object' && pageContent !== null && 'code' in pageContent) {
            return actions.addOrUpdatePage(pageName, (pageContent as { code: string }).code, pageName === 'Home');
        } else {
            throw new Error(`Invalid page content for page: ${pageName}`);
        }
    });

    await Promise.all(promises);

    // Save the site
    await actions.save();

    // Provision the site
    const websiteId = siteManager.getSiteDataAndActions().ppSiteData.powerpagesite[0].powerpagesiteid ?? '';
    //const portal = await createPortal(siteName, siteUrl, websiteId);

    //GetPortalByIdCall

    return {
        siteName,
        websiteId,
        siteDescription,
        //portal: portal
    };
};

// Function to provision the site
// const createPortal = async (siteName: string, siteUrl: string, websiteId: string) => {

//     const {
//         resourceId: orgId,
//         instanceUrl: orgUrl,
//         friendlyName: orgName,
//     } = getLinkedEnvironmentMetadata(currentEnvironment)!;

//     const payload = {
//         orgId,
//         orgUrl,
//         orgName,
//         portalName: siteName,
//         packageName: 'BlankTemplate_V2',
//         portalLanguage: getLanguageLcidByLabel(language).toString(),
//         subDomain: siteUrl,
//         websiteId,
//         isPowerPages: true,
//     };

//     console.log(payload);

//     // try {
//     //     const portal = await createPortalV2.mutateAsync(payload);



//     //     return portal;
//     // } catch (err) {
//     //     //Log error telemetry
//     //     console.log(err);
//     //     throw err;
//     // }
// };
