/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */


import { v4 as uuidv4 } from 'uuid';
import { ITelemetry } from '../../../../OneDSLoggerTelemetry/telemetry/ITelemetry';
import { dataverseAuthentication } from '../../../../services/AuthenticationProvider';
import { PowerPagesComponent, PowerPagesParsedJson, PowerPagesComponentType } from './CreateSiteModel';
import { reGuidPowerPagesSite, getCDSEntityRequestURL, getFileUploadHeaders, base64ToArrayBuffer, createHttpRequestOptions } from './CreateSiteUtils';
import { nl2SiteJson } from './site-templates/Nl2Site';
import * as entityNames from "./SiteEntityNames";
import { API_VERSION, BASE_PAGE, CDS_API_VERSION, CDS_BASE_URL, CDS_URL_PREFIX, DEFAULT_TEMPLATE_NAME, HOME_SITE_MARKER_NAME, PUBLISHED_STATE_NAME } from './CreateSiteConstants';
import { oneDSLoggerWrapper } from '../../../../OneDSLoggerTelemetry/oneDSLoggerWrapper';
import { HTTP_METHODS } from '../../../../constants';
import { VSCODE_EXTENSION_CREATE_SITE_SAVE_OPERATION_ERROR, VSCODE_EXTENSION_CREATE_SITE_OPERATION_ERROR, VSCODE_EXTENSION_CREATE_SITE_OPERATION_SUCCESS, VSCODE_EXTENSION_CREATE_SITE_COMPONENT_OPERATION_ERROR, VSCODE_EXTENSION_CREATE_SITE_COMPONENT_OPERATION_SUCCESS, VSCODE_EXTENSION_CREATE_SITE_COMPONENT_PROCESSING_ERROR, VSCODE_EXTENSION_CREATE_SITE__FILE_COMPONENT_OPERATION_ERROR, VSCODE_EXTENSION_CREATE_SITE__FILE_COMPONENT_OPERATION_SUCCESS, VSCODE_EXTENSION_CREATE_SITE__FILE_COMPONENT_PROCESSING_ERROR } from '../../PowerPagesChatParticipantTelemetryConstants';

export interface IPowerPagesSiteFromJsonActions {
    updateSiteName: (name: string) => void;
    addComponents: (components: PowerPagesComponent[]) => void;
    updateComponent: (component: PowerPagesComponent) => void;
    findComponents: (
        filter: (value: PowerPagesComponent, index: number, obj: PowerPagesComponent[]) => boolean
    ) => PowerPagesComponent[];
    findComponent: (
        filter: (value: PowerPagesComponent, index: number, obj: PowerPagesComponent[]) => boolean
    ) => PowerPagesComponent | undefined;
    addOrUpdatePage: (pageName: string, pageCopy: string, isHomePage: boolean) => Promise<string>;
    getWebPageRootId: (pageName: string) => string;
    addWebRole: (roleName: string, webRoleContent: object) => string;
    save: (orgUrl: string) => Promise<void>;
}

export class PowerPagesSiteManager {
    private siteData: PowerPagesParsedJson;
    private telemetry: ITelemetry;
    // Add for multiple language & template support
    // private templateName: string;
    // private language: string;

    constructor(templateName: string, language: string, telemetry: ITelemetry) {
        this.siteData = {
            powerpagecomponent: [],
            powerpagesite: [],
            powerpagesitelanguage: [],
        };
        this.telemetry = telemetry;
    }

    // Function to fetch and load the template data
    public async loadTemplate(): Promise<void> {
        const ppJsonBlob = nl2SiteJson;
        this.siteData = reGuidPowerPagesSite(ppJsonBlob as PowerPagesParsedJson);
    }

    private getBatchAndFileUploads(orgUrl: string): [any[], any[], PowerPagesComponent[]] {
        const siteAndLanguages: any[] = [];
        const operations: any[] = [];
        const filesToUpload: PowerPagesComponent[] = [];

        // Add site and languages
        this.addSiteAndLanguages(orgUrl, siteAndLanguages);

        // Add components
        this.addComponentsToOperations(orgUrl, operations, filesToUpload);

        return [siteAndLanguages, operations, filesToUpload];
    }

    /**
     * Adds site and language data to the provided array for batch processing.
     * @param orgUrl - The organization URL.
     * @param siteAndLanguages - The array to which site and language data will be added. Each element is an HTTP request option object.
     */
    private addSiteAndLanguages(orgUrl: string, siteAndLanguages: any[]): void {
        const data = this.siteData;

        const siteUrl = `${orgUrl}${CDS_URL_PREFIX}/${CDS_API_VERSION}/powerpagesites`;
        siteAndLanguages.push(
            createHttpRequestOptions(HTTP_METHODS.POST, siteUrl, data.powerpagesite[0])
        );

        data.powerpagesitelanguage.forEach((ppSiteLang) => {
            const entity = {
                ...ppSiteLang,
                [`powerpagesiteid@odata.bind`]: `/${entityNames.PowerPagesSites}(${ppSiteLang.powerpagesiteid!})`,
            };
            delete entity.powerpagesiteid;
            const languageUrl = `${orgUrl}${CDS_URL_PREFIX}/${API_VERSION}/powerpagesitelanguages`;
            siteAndLanguages.push(
                createHttpRequestOptions(HTTP_METHODS.POST, languageUrl, entity)
            );
        });
    }

    private addComponentsToOperations(orgUrl: string, operations: any[], filesToUpload: PowerPagesComponent[]): void {
        const data = this.siteData;

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
            const componentUrl = `${orgUrl}${CDS_URL_PREFIX}/${API_VERSION}/powerpagecomponents`;
            operations.push(
                createHttpRequestOptions(HTTP_METHODS.POST, componentUrl, entity)
            );
        });
    }

    private findComponent(
        filter: (value: PowerPagesComponent, index: number, obj: PowerPagesComponent[]) => boolean
    ): PowerPagesComponent | undefined {
        return this.siteData.powerpagecomponent.find(filter);
    }

    private updateSiteName(name: string): void {
        this.siteData.powerpagesite[0].name = name;
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
        this.siteData.powerpagecomponent = [...this.siteData.powerpagecomponent, ...components];
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

    /**
     * Retrieves the home root page component.
     * The method first finds the site marker component with the name 'HOME_SITE_MARKER_NAME'.
     * It then parses the content of the site marker to get the page ID.
     * Finally, it finds and returns the home root page component using the page ID.
     *
     * @returns {PowerPagesComponent | undefined} The home root page component or undefined if not found.
     */
    private getHomeRootPage(): PowerPagesComponent | undefined {
        const siteMarker = this.findComponent(
            (c) => c.powerpagecomponenttype === PowerPagesComponentType.SiteMarker && c.name === HOME_SITE_MARKER_NAME
        );
        const pageId = siteMarker ? JSON.parse(siteMarker.content).pageid : undefined;

        if (!pageId) {
            return undefined;
        }

        const homeRootPage = this.findComponent(
            (c) =>
                c.powerpagecomponenttype === PowerPagesComponentType.WebPage &&
                c.powerpagecomponentid === pageId &&
                JSON.parse(c.content).isroot
        );
        return homeRootPage;
    }

    private getHomePage(): PowerPagesComponent | undefined {
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

    private getPublishingStateId(): string | undefined {
        const publishingState = this.findComponent(
            (c) => c.powerpagecomponenttype === PowerPagesComponentType.PublishingState && c.name === PUBLISHED_STATE_NAME
        );
        return publishingState?.powerpagecomponentid;
    }

    private async addOrUpdatePage(pageName: string, copy: string, isHomePage: boolean): Promise<string> {
        let rootPageID = '';

        const pageCopy = copy;

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
            const next = { ...component };
            const pageContent = JSON.parse(next.content);
            pageContent.copy = pageCopy;
            next.content = JSON.stringify(pageContent);
            this.updateComponent(next);
        } else {
            let displayOrder = this.findComponents(
                (c) => c.powerpagecomponenttype === PowerPagesComponentType.WebPage && JSON.parse(c.content).isroot
            )
                ?.map((c) => JSON.parse(c.content).displayorder)
                .filter((d) => d ?? false)
                .sort()
                .pop();
            const homeRootPage = this.getHomeRootPage();
            if (!homeRootPage) {
                throw new Error('Home root page not found');
            }
            const homeRootPageContent = JSON.parse(homeRootPage.content);
            const publishingStateId = this.getPublishingStateId();
            const pageTemplate = this.findComponent(
                (c) =>
                    c.powerpagecomponenttype === PowerPagesComponentType.PageTemplate &&
                    c.name === DEFAULT_TEMPLATE_NAME
            );
            const homeWebLink = this.findComponent(
                (c) =>
                    c.powerpagecomponenttype === PowerPagesComponentType.WebLink &&
                    JSON.parse(c.content).pageid === homeRootPage?.powerpagecomponentid
            );

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

            componentsToAdd.push({
                powerpagecomponentid: uuidv4(),
                powerpagesiteid: this.siteData.powerpagesite[0].powerpagesiteid,
                name: pageName,
                powerpagecomponenttype: PowerPagesComponentType.SiteMarker,
                content: JSON.stringify({
                    pageid: rootPageComponent.powerpagecomponentid,
                }),
            });

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

    private async save(orgUrl: string): Promise<void> {
        // Get the batch and file uploads
        const [siteAndLanguages, components, fileComponents] = this.getBatchAndFileUploads(orgUrl);

        // Authenticate and get the Dataverse token
        const dataverseToken = (await dataverseAuthentication(this.telemetry, orgUrl, true)).accessToken;

        // Define fetch options for the operations
        const fetchOptions = (operation: any) => ({
            method: HTTP_METHODS.POST,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${dataverseToken}`,
            },
            body: operation.body,
        });

        try {
            // Process site and language operations
            await this.processOperations(siteAndLanguages, fetchOptions);

            // Process component operations
            await this.processComponents(components, fetchOptions);

            // Process file components
            await this.processFileComponents(fileComponents, dataverseToken, orgUrl);
        } catch (error) {
            this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_CREATE_SITE_SAVE_OPERATION_ERROR, { orgUrl, error: (error as Error).message });
            oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_CREATE_SITE_SAVE_OPERATION_ERROR, (error as Error).message, error as Error, { orgUrl }, {});
            throw new Error(`Save operation failed: ${(error as Error).message}`);
        }
    }
    private async processOperations(operations: any[], fetchOptions: (operation: any) => RequestInit): Promise<void> {
        for (const operation of operations) {
            const response = await fetch(operation.url, fetchOptions(operation));
            if (!response.ok) {
                const errorText = await response.text();
                this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_CREATE_SITE_OPERATION_ERROR, { url: operation.url, error: errorText });
                oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_CREATE_SITE_OPERATION_ERROR, errorText, new Error(errorText), { url: operation.url }, {});
                throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
            }
            this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_CREATE_SITE_OPERATION_SUCCESS, { url: operation.url });
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_CREATE_SITE_OPERATION_SUCCESS, { url: operation.url });
        }
    }

    private async processComponents(components: any[], fetchOptions: (operation: any) => RequestInit): Promise<void> {
        for (const operation of components) {
            try {
                const response = await fetch(operation.url, fetchOptions(operation));
                if (!response.ok) {
                    const errorText = await response.text();
                    this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_CREATE_SITE_COMPONENT_OPERATION_ERROR, { url: operation.url, error: errorText });
                    oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_CREATE_SITE_COMPONENT_OPERATION_ERROR, errorText, new Error(errorText), { url: operation.url }, {});
                    throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
                }
                this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_CREATE_SITE_COMPONENT_OPERATION_SUCCESS, { url: operation.url });
                oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_CREATE_SITE_COMPONENT_OPERATION_SUCCESS, { url: operation.url });
            } catch (error) {
                this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_CREATE_SITE_COMPONENT_PROCESSING_ERROR, { error: (error as Error).message });
                oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_CREATE_SITE_COMPONENT_PROCESSING_ERROR, (error as Error).message, error as Error, {}, {});
                throw error;
            }
        }
    }

    /**
    * Processes file components by uploading their content to the specified organization URL.
    * @param fileComponents - An array of PowerPagesComponent objects representing file components to be uploaded.
    * @param dataverseToken - The authentication token for Dataverse.
    * @param orgUrl - The organization URL.
    */
    private async processFileComponents(fileComponents: PowerPagesComponent[], dataverseToken: string, orgUrl: string): Promise<void> {
        if (fileComponents.length > 0) {
            await Promise.all(
                fileComponents.map(async (f) => {
                    try {
                        const response = await fetch(
                            getCDSEntityRequestURL({
                                entityName: entityNames.PowerPagesComponents,
                                entityId: f.powerpagecomponentid,
                                additionalPathTokens: ['filecontent'],
                            }).replace(CDS_BASE_URL, orgUrl),
                            {
                                method: HTTP_METHODS.PATCH,
                                headers: getFileUploadHeaders(f.name, dataverseToken),
                                body: base64ToArrayBuffer(f.filecontent!),
                            }
                        );

                        if (!response.ok) {
                            const errorText = await response.text();
                            this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_CREATE_SITE__FILE_COMPONENT_OPERATION_ERROR, { url: response.url, error: errorText });
                            oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_CREATE_SITE__FILE_COMPONENT_OPERATION_ERROR, errorText, new Error(errorText), { url: response.url }, {});
                            throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
                        }

                        this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_CREATE_SITE__FILE_COMPONENT_OPERATION_SUCCESS, { url: response.url });
                        oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_CREATE_SITE__FILE_COMPONENT_OPERATION_SUCCESS, { url: response.url });
                    } catch (error) {
                        const errorText = (error as Error).message;
                        this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_CREATE_SITE__FILE_COMPONENT_PROCESSING_ERROR, { error: errorText });
                        oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_CREATE_SITE__FILE_COMPONENT_PROCESSING_ERROR, errorText, error as Error, {}, {});
                        throw new Error(`File component operation failed: ${errorText}`);
                    }
                })
            ).catch((error) => {
                this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_CREATE_SITE__FILE_COMPONENT_PROCESSING_ERROR, { error: (error as Error).message });
                oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_CREATE_SITE__FILE_COMPONENT_PROCESSING_ERROR, (error as Error).message, error as Error, {}, {});
                throw error;
            });
        }
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
                getWebPageRootId: (pageName: string) => this.getWebPageRootId(pageName),
                addWebRole: (roleName: string, webRoleContent: object) => this.addWebRole(roleName, webRoleContent),
                save: (orgUrl: string) => this.save(orgUrl),
            }
        };
    }
}
