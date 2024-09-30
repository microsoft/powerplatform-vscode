/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { nl2SiteJson } from "./Nl2SiteTemplate";
import { PowerPagesParsedJson } from "./PowerPagesSiteModel";
import { getCDSEntityRequestURLPath, reGuidPowerPagesSite } from "./PowerPagesSiteUtils";
import * as entityNames from "./EntityNames";
import { PowerPagesComponent, PowerPagesComponentType } from "./PowerPagesComponent";
import { v4 as uuidv4 } from 'uuid';
import { BASE_PAGE } from "./PowerPagesSiteConstants";

export interface IPowerPagesSiteFromJsonActions {
    updateSiteName: (name: string) => void;
    addComponents: (components: PowerPagesComponent[]) => void;
    updateComponent: (component: PowerPagesComponent) => void;
    findComponents: (
        filter: (value: PowerPagesComponent, index: number, obj: PowerPagesComponent[]) => boolean
    ) => PowerPagesComponent[] | undefined;
    findComponent: (
        filter: (value: PowerPagesComponent, index: number, obj: PowerPagesComponent[]) => boolean
    ) => PowerPagesComponent | undefined;
    addOrUpdatePage: (pageName: string, pageCopy: string, isHomePage: boolean) => Promise<string>;
    getWebPageRootId: (pageName: string) => string;
    addWebRole: (roleName: string, webRoleContent: object) => string;
    save: () => Promise<void>;
}

/**
 * This function allows you to initialize a blank template and mutate the various entities in memory before writing them to
 * dataverse. Currently this function only supports provisioning but could potentially be updated to send upserts instead of
 * inserts. That would also help with retrying failed requests.
 * @param {string} templateName Template to start from. Could potentially be used to start with a template other than
 * Blank.
 * @param {string} language The language code to provision in. Only 1033 is supported currently
 * @returns site data and actions to allow the caller to mutate site data
 */

export class PowerPagesSiteManager {
    private siteData: PowerPagesParsedJson;
    private templateName: string;
    private language: string;

    constructor(templateName: string, language: string) {
        this.siteData = {
            powerpagecomponent: [],
            powerpagesite: [],
            powerpagesitelanguage: [],
        };
        this.templateName = templateName;
        this.language = language;
    }

    // Function to fetch and load the template data
    public async loadTemplate(): Promise<void> {
        //const languageCode = 1033 //Only English is supported for now

        const ppJsonBlob = nl2SiteJson;

        this.siteData = reGuidPowerPagesSite(ppJsonBlob as PowerPagesParsedJson);
    }

    private getBatchAndFileUploads(): [
        Array<Changeset | DeleteOperation | GetOperation | PatchOperation | PostOperation>,
        Array<Changeset | DeleteOperation | GetOperation | PatchOperation | PostOperation>,
        PowerPagesComponent[]
    ] {
        // We need site and language to already be created before creating other components in a batch
        const data = this.siteData;
        const siteAndLanguages = [];
        const operations: any[] = [];

        siteAndLanguages.push({
            method: 'POST',
            url: getCDSEntityRequestURLPath({ entityName: entityNames.PowerPagesSites }),
            headers: {
                'Content-Type': 'application/json; type=entry',
            },
            body: JSON.stringify(data.powerpagesite[0]),
        });

        // Languages
        data.powerpagesitelanguage.forEach((ppSiteLang) => {
            const entity = {
                ...ppSiteLang,
                [`powerpagesiteid@odata.bind`]: `/${entityNames.PowerPagesSites}(${ppSiteLang.powerpagesiteid!})`,
            };
            delete entity.powerpagesiteid;
            siteAndLanguages.push({
                method: 'POST',
                url: getCDSEntityRequestURLPath({ entityName: entityNames.PowerPagesSiteLanguages }),
                headers: {
                    'Content-Type': 'application/json; type=entry',
                },
                body: JSON.stringify(entity),
            });
        });

        const filesToUpload: PowerPagesComponent[] = [];

        // Components
        data.powerpagecomponent.forEach((component) => {
            if (component.powerpagecomponenttype === PowerPagesComponentType.WebFile && component.filecontent) {
                filesToUpload.push(component);
            }
            const entity = {
                ...component,
                [`powerpagesiteid@odata.bind`]: `/${entityNames.PowerPagesSites}(${component.powerpagesiteid!})`,
                [`powerpagesitelanguageid@odata.bind`]: component.powerpagesitelanguageid
                    ? `/${entityNames.PowerPagesSiteLanguages}(${component.powerpagesitelanguageid})`
                    : null,
            };
            delete entity.powerpagesiteid;
            delete entity.powerpagesitelanguageid;
            delete entity.filecontent;
            operations.push({
                method: 'POST',
                url: getCDSEntityRequestURLPath({ entityName: entityNames.PowerPagesComponents }),
                headers: {
                    'Content-Type': 'application/json; type=entry',
                },
                body: JSON.stringify(entity),
            });
        });

        return [siteAndLanguages, operations, filesToUpload];
    }

    private findComponent(
        filter: (value: PowerPagesComponent, index: number, obj: PowerPagesComponent[]) => boolean
    ): PowerPagesComponent | undefined {
        return this.siteData.powerpagecomponent.find(filter);
    }

    /**
* Gets parent page id
* @returns {string} Parent page id
*/

    /**
     * Updates html with new image urls
     * @param pageCopy
     * @param mapping
     * @param uploadMap
     * @returns {string} Updated html
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private updateHTML(pageCopy: string, mapping: Map<string, string>, uploadMap: Map<string, boolean>): string {
        const element = document.createElement('div');
        element.innerHTML = pageCopy;
        // const images = getImagesAndBackgroundImages(element);
        // images.forEach((image) => {
        //     const src = image.getAttribute('src');
        //     const backgroundImage = image.style.backgroundImage;
        //     if (src && mapping.has(src) && uploadMap.get(src)) {
        //         image.setAttribute('src', mapping.get(src)!);
        //     }
        //     if (backgroundImage && mapping.has(backgroundImage) && uploadMap.get(backgroundImage)) {
        //         image.style.backgroundImage = `url(${mapping.get(backgroundImage)!})`;
        //     }
        // });
        return element.innerHTML;
    }

    private updateSiteName(name: string): void {
        this.siteData.powerpagesite[0].name = name;
        // The snippet named 'Site name' is hardcoded to the value 'Company name' in the template JSON.
        // Assign the real site name so that the Header reflects site name.
        // Find the index of the 'site name' snippet in the draft
        const snippetIndex = this.siteData.powerpagecomponent.findIndex(
            (c) =>
                c.powerpagecomponenttype === PowerPagesComponentType.ContentSnippet &&
                c.name.toLowerCase() === 'site name'
        );
        if (snippetIndex !== -1) {
            const siteNameSnippet = this.siteData.powerpagecomponent[snippetIndex];
            const parsedContent = JSON.parse(siteNameSnippet.content);
            parsedContent.value = name;
            siteNameSnippet.content = JSON.stringify(parsedContent);
        }
    }

    private addComponents(components: PowerPagesComponent[]): void {
        this.siteData.powerpagecomponent = this.siteData.powerpagecomponent.concat(components);
    }
    private updateComponent(component: PowerPagesComponent): void {
        const index = this.siteData.powerpagecomponent.findIndex(
            (c) => c.powerpagecomponentid === component.powerpagecomponentid
        );
        if (index >= 0) {
            this.siteData.powerpagecomponent[index] = component;
        }
    }

    private findComponents(
        filter: (value: PowerPagesComponent, index: number, obj: PowerPagesComponent[]) => boolean
    ): PowerPagesComponent[] {
        return this.siteData.powerpagecomponent.filter(filter);
    }

    private getHomeRootPage(): PowerPagesComponent | undefined {
        // Get the Home root (metadata) page.

        // All templates should have a SiteMarker with the same name of 'Home'.
        // Use this component to obtain the pageid.
        const siteMarker = this.findComponent(
            (c) => c.powerpagecomponenttype === PowerPagesComponentType.SiteMarker && c.name === 'Home'
        );
        const pageId = siteMarker ? JSON.parse(siteMarker.content).pageid : undefined;

        if (!pageId) {
            return undefined;
        }

        // Find the Home root (metadata) page. Ensure it is the root component.
        const homeRootPage = this.findComponent(
            (c) =>
                c.powerpagecomponenttype === PowerPagesComponentType.WebPage &&
                c.powerpagecomponentid === pageId &&
                JSON.parse(c.content).isroot
        );
        return homeRootPage;
    }

    private getHomePage(): PowerPagesComponent | undefined {
        // To get the home page, we first need to get the root page.
        // We then use the root page to obtain the correct home page.
        // The name of the component will differ per locale, which is why we can't use the literal 'Home'.
        const homeRootPage = this.getHomeRootPage();
        if (!homeRootPage) {
            return undefined;
        }
        const homePage = this.findComponent(
            (c) =>
                c.powerpagecomponenttype === PowerPagesComponentType.WebPage &&
                c.name === homeRootPage.name &&
                !JSON.parse(c.content).isroot
        );
        return homePage;
    }

    /**
 * Gets publishing state id
 * @returns {string} Publishing state id
 */
    private getPublishingStateId(): string | undefined {
        const publishingState = this.findComponent(
            (c) => c.powerpagecomponenttype === PowerPagesComponentType.PublishingState && c.name === 'Published'
        );
        return publishingState?.powerpagecomponentid;
    }

    private async getBlobAndAddComponent(blobUrl: string, fileName: string, uploadMap: Map<string, boolean>): Promise<void> {
        const blob = await this.getBlobFromUrl(blobUrl);
        if (blob && blob.size < 5242880) {
            const uploadImageBase64Value = await this.getBase64FromBlob(blob);
            uploadMap.set(blobUrl, true);
            this.addComponents([
                {
                    powerpagecomponentid: this.generateUUID(),
                    powerpagesiteid: this.siteData.powerpagesite[0].powerpagesiteid,
                    name: fileName,
                    powerpagecomponenttype: PowerPagesComponentType.WebFile,
                    content: JSON.stringify({
                        name: fileName,
                        parentPageId: this.getHomeRootPage()?.powerpagecomponentid,
                        publishingStateId: this.getPublishingStateId(),
                        partialUrl: fileName,
                        title: '',
                        summary: '',
                        isEnableTracking: false,
                        isExcludeFromSearch: false,
                        isHiddenFormSiteMap: false,
                    }),
                    filecontent: uploadImageBase64Value,
                },
            ]);
        } else if (blob && blob.size >= 5242880) {
            // Log error message
        }
    }

    private async addOrUpdatePage(pageName: string, copy: string, isHomePage: boolean): Promise<string> {
        let rootPageID = '';

        /**
         * Parses html and adds images
         * @param pageName
         * @param pageCopy
         * @returns {string} Updated html
         */
        const parseHTMLandAddImages = async (_pageName: string, _pageCopy: string): Promise<string> => {
            const element = document.createElement('div');
            element.innerHTML = _pageCopy;
            const images = getImagesAndBackgroundImages(element);
            const hubbleUrls = getSourceUrlsFromImages(images);
            const mapping = getFileNamesFromSourceUrls(hubbleUrls, _pageName);
            const uploadMap = new Map<string, boolean>();
            const promises = Array.from(mapping, ([hubbleUrl, fileName]) =>
                this.getBlobAndAddComponent(hubbleUrl, fileName, uploadMap)
            );
            await Promise.all(promises);
            return this.updateHTML(_pageCopy, mapping, uploadMap);
        };

        let pageCopy = copy;
        try {
            pageCopy = enableNL2SiteUploadImagesToDataverse
                ? await parseHTMLandAddImages(pageName, pageCopy)
                : pageCopy;
        } catch (e: unknown) {
            // TelemetryService.getInstance().error(
            //     UPLOAD_HUBBLE_IMAGE_TO_DATAVERSE_FILE_BLOB,
            //     'Failed to upload images',
            //     e as Error
            // );
        }

        const component = isHomePage
            ? this.getHomePage()
            : this.findComponent(
                (c) =>
                    c.name === pageName &&
                    c.powerpagecomponenttype === PowerPagesComponentType.WebPage &&
                    !JSON.parse(c.content).isroot
            );

        if (component) {
            const rootComponent = this.findComponent(
                (c) => c.powerpagecomponentid === JSON.parse(component.content).rootwebpageid
            );
            rootPageID = rootComponent?.powerpagecomponentid ?? '';
            // update
            const next = { ...component };
            const pageContent = JSON.parse(next.content);
            pageContent.copy = pageCopy;
            next.content = JSON.stringify(pageContent);
            this.updateComponent(next);
        } else {
            // Fetch all the dependencies
            let displayOrder = this.findComponents(
                (c) => c.powerpagecomponenttype === PowerPagesComponentType.WebPage && JSON.parse(c.content).isroot
            )
                ?.map((c) => JSON.parse(c.content).displayorder)
                .filter((d) => d ?? false)
                .sort()
                .pop();
            const homeRootPage = this.getHomeRootPage();
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
            const homeRootPageContent = JSON.parse(homeRootPage?.content!);
            const publishingStateId = this.getPublishingStateId();
            const pageTemplate = this.findComponent(
                (c) =>
                    c.powerpagecomponenttype === PowerPagesComponentType.PageTemplate &&
                    c.name === 'Default studio template'
            );
            const homeWebLink = this.findComponent(
                (c) =>
                    c.powerpagecomponenttype === PowerPagesComponentType.WebLink &&
                    JSON.parse(c.content).pageid === homeRootPage?.powerpagecomponentid
            );

            // Add root page
            rootPageID = uuidv4();
            const rootPageComponent = {
                powerpagecomponentid: rootPageID,
                powerpagesiteid: this.siteData.powerpagesite[0].powerpagesiteid,
                name: pageName,
                powerpagecomponenttype: PowerPagesComponentType.WebPage,
                content: JSON.stringify({
                    displayorder: ++displayOrder,
                    ...BASE_PAGE,
                    isroot: true,
                    feedbackpolicy: homeRootPageContent.feedbackpolicy,
                    pagetemplateid: pageTemplate?.powerpagecomponentid,
                    partialurl: pageName.toLowerCase().split(' ').join('-'),
                    publishingstateid: publishingStateId,
                    parentpageid: homeRootPage?.powerpagecomponentid,
                }),
            };
            const componentsToAdd = [rootPageComponent];

            // Add content page
            const contentPageComponent = {
                powerpagecomponentid: uuidv4(),
                powerpagesiteid: this.siteData.powerpagesite[0].powerpagesiteid,
                name: pageName,
                powerpagecomponenttype: PowerPagesComponentType.WebPage,
                powerpagesitelanguageid: this.siteData.powerpagesitelanguage[0].powerpagesitelanguageid,
                content: JSON.stringify({
                    copy: pageCopy,
                    ...BASE_PAGE,
                    isroot: false,
                    rootwebpageid: rootPageComponent.powerpagecomponentid,
                    pagetemplateid: pageTemplate?.powerpagecomponentid,
                    partialurl: pageName.toLowerCase().split(' ').join('-'),
                    publishingstateid: publishingStateId,
                    parentpageid: homeRootPage?.powerpagecomponentid,
                }),
            };
            componentsToAdd.push(contentPageComponent);

            // Add site marker
            componentsToAdd.push({
                powerpagecomponentid: uuidv4(),
                powerpagesiteid: this.siteData.powerpagesite[0].powerpagesiteid,
                name: pageName,
                powerpagecomponenttype: PowerPagesComponentType.SiteMarker,
                content: JSON.stringify({
                    pageid: rootPageComponent.powerpagecomponentid,
                }),
            });

            // Add web link
            if (homeWebLink !== undefined) {
                componentsToAdd.push({
                    powerpagecomponentid: uuidv4(),
                    powerpagesiteid: this.siteData.powerpagesite[0].powerpagesiteid,
                    name: pageName,
                    powerpagecomponenttype: PowerPagesComponentType.WebLink,
                    content: JSON.stringify({
                        disablepagevalidation: false,
                        displayimageonly: false,
                        displayorder: displayOrder,
                        displaypagechildlinks: false,
                        openinnewwindow: false,
                        pageid: rootPageComponent.powerpagecomponentid,
                        publishingstateid: publishingStateId,
                        robotsfollowlink: true,
                        weblinksetid: JSON.parse(homeWebLink.content).weblinksetid,
                    }),
                });
            }
            this.addComponents(componentsToAdd);
        }
        return rootPageID;
    }
    private getWebPageRootId(pageName: string): string {
        const webPageRoot = this.findComponent(
            (c) =>
                c.powerpagecomponenttype === PowerPagesComponentType.WebPage &&
                c.name === pageName &&
                c.powerpagesitelanguageid !== undefined
        );
        return webPageRoot?.powerpagecomponentid ?? '';
    }

    private addWebRole(roleName: string, webRoleContent: object): string {
        const webRoleId = uuidv4();
        const webRole = {
            powerpagecomponentid: webRoleId,
            powerpagesiteid: this.siteData.powerpagesite[0].powerpagesiteid,
            name: roleName,
            powerpagecomponenttype: PowerPagesComponentType.WebRole,
            content: JSON.stringify(webRoleContent),
        };
        this.addComponents([webRole]);
        return webRoleId;
    }

    // Method to expose site data and actions
    public getSiteDataAndActions(): {
        ppSiteData: PowerPagesParsedJson;
        actions: IPowerPagesSiteFromJsonActions;
    } {
        return {
            ppSiteData: this.siteData,
            actions: {
                updateSiteName: (name: string) => this.updateSiteName(name),
                addComponents: (components: PowerPagesComponent[]) => this.addComponents(components),
                updateComponent: (component: PowerPagesComponent) => this.updateComponent(component),
                findComponents: (
                    filter: (value: PowerPagesComponent, index: number, obj: PowerPagesComponent[]) => boolean
                ) => this.findComponents(filter),
                findComponent: (
                    filter: (value: PowerPagesComponent, index: number, obj: PowerPagesComponent[]) => boolean
                ) => this.findComponent(filter),
                addOrUpdatePage: (pageName: string, pageCopy: string, isHomePage: boolean) =>
                    this.addOrUpdatePage(pageName, pageCopy, isHomePage),
                getWebPageRootId: (pageName: string) => this.getWebPageRootId(pageName) ?? '',
                addWebRole: (roleName: string, webRoleContent: object) => this.addWebRole(roleName, webRoleContent),
                save: async () => {
                    // Implement save logic if needed
                },
            }
        };
    }
}

