/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { IPreviewEngineContext } from '@maker-studio/powerportals-preview-engine/lib/RenderingEngine/IDataResolver';
import { ContentSnippet } from '@maker-studio/powerportals-preview-engine/lib/RenderingEngine/Types/Entity/ContentSnippet';
import { IEntityAttributeMetadata } from '@maker-studio/powerportals-preview-engine/lib/RenderingEngine/Types/Entity/EntityAttributeMetadata';
import { EntityForm } from '@maker-studio/powerportals-preview-engine/lib/RenderingEngine/Types/Entity/EntityForm';
import { EntityList } from '@maker-studio/powerportals-preview-engine/lib/RenderingEngine/Types/Entity/EntityList';
import { PageTemplate } from '@maker-studio/powerportals-preview-engine/lib/RenderingEngine/Types/Entity/PageTemplate';
import { SiteMarker } from '@maker-studio/powerportals-preview-engine/lib/RenderingEngine/Types/Entity/SiteMarker';
import { SiteSetting } from '@maker-studio/powerportals-preview-engine/lib/RenderingEngine/Types/Entity/SiteSettings';
import { WebForm } from '@maker-studio/powerportals-preview-engine/lib/RenderingEngine/Types/Entity/WebForm';
import { WebTemplate } from '@maker-studio/powerportals-preview-engine/lib/RenderingEngine/Types/Entity/WebTemplate';
import { Weblink } from '@maker-studio/powerportals-preview-engine/lib/RenderingEngine/Types/Entity/Weblink';
import { WeblinkSet } from '@maker-studio/powerportals-preview-engine/lib/RenderingEngine/Types/Entity/WeblinkSet';
import { Webpage } from '@maker-studio/powerportals-preview-engine/lib/RenderingEngine/Types/Entity/Webpage';
import { Website } from '@maker-studio/powerportals-preview-engine/lib/RenderingEngine/Types/Entity/Website';
import { PortalWebView } from './PortalWebView';
import { load } from 'js-yaml';
import * as vscode from 'vscode';

const fallbackURI = vscode.Uri.file('');
/**
 * Generates and refreshes preview context
 */
export class PreviewEngineContext {

    private previewEngineContext: IPreviewEngineContext;
    private websiteRecord: Website;
    private rootPath: vscode.Uri | null;

    constructor() {
        this.previewEngineContext = {};
        this.rootPath = PortalWebView.getPortalRootFolder();
        this.websiteRecord = {} as Website;
    }

    public createContext = async () => {
        this.websiteRecord = await this.getWebsite();
        this.previewEngineContext = await this.createEngineContext();
    }

    public getPreviewEngineContext = () => {
        return this.previewEngineContext;
    }

    private createEngineContext = async (): Promise<IPreviewEngineContext> => {

        if (this.rootPath) {
            return {
                webpages: await this.getWebpages(),
                contentSnippets: await this.getContentSnippets(),
                webTemplates: await this.getWebTemplates(),
                siteMarkers: await this.getSiteMarker(),
                siteSettings: await this.getSiteSetting(),
                entityLists: await this.getEntityLists(),
                entityForms: await this.getEntityForms(),
                webForms: await this.getWebForms(),
                weblinks: await this.getWeblinks(),
                weblinkSets: await this.getWeblinkSets(),
                website: this.websiteRecord,
                pageTemplates: await this.getPageTemplates(),
                dataResolverExtras: {},
                resx: {},
                featureConfig: new Map(),
                entityAttributeMetadata: [] as IEntityAttributeMetadata[],
                lcid: '' as string,
                isBootstrapV5: false as boolean,
            }
        } else return {}
    }

    private getWebsite = async (): Promise<Website> => {
        const website = await vscode.workspace.fs.readFile(this.rootPath?.with({ path: this.rootPath.path + '/website.yml' }) || fallbackURI);
        const websiteYaml = load(new TextDecoder().decode(website));
        return websiteYaml as Website;
    }

    private webPageHelper = async (pageUri: vscode.Uri): Promise<Webpage> => {
        const webpageYaml = await vscode.workspace.fs.readFile(pageUri?.with({ path: pageUri.path + '.webpage.yml' }));
        const webpageJS = await vscode.workspace.fs.readFile(pageUri?.with({ path: pageUri.path + '.webpage.custom_javascript.js' }));
        const webpageCSS = await vscode.workspace.fs.readFile(pageUri?.with({ path: pageUri.path + '.webpage.custom_css.css' }));
        const webpageCopy = await vscode.workspace.fs.readFile(pageUri?.with({ path: pageUri.path + '.webpage.copy.html' }));
        const webpageSummary = await vscode.workspace.fs.readFile(pageUri?.with({ path: pageUri.path + '.webpage.summary.html' }));
        const webpageRecord = load(new TextDecoder().decode(webpageYaml)) as Webpage;
        webpageRecord.adx_customcss = new TextDecoder().decode(webpageCSS);
        webpageRecord.adx_customjavascript = new TextDecoder().decode(webpageJS);
        webpageRecord.adx_copy = new TextDecoder().decode(webpageCopy);
        webpageRecord.adx_summary = new TextDecoder().decode(webpageSummary);
        webpageRecord.adx_websiteid = this.websiteRecord.adx_websiteid;
        return webpageRecord;
    }


    private getWebpages = async (): Promise<Webpage[]> => {
        const webpagesDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/web-pages' }) || fallbackURI);

        const webpageArray: Webpage[] = [];
        for (const webpage of webpagesDirectory) {
            webpageArray.push(await this.webPageHelper(this.rootPath?.with({ path: this.rootPath.path + '/web-pages/' + webpage[0] + '/' + webpage[0] }) || fallbackURI));

            const contentPageDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/web-pages/' + webpage[0] + '/content-pages' }) || fallbackURI);
            for (const page of contentPageDirectory) {
                if (page[0].endsWith(ymlPattern)) {
                    const pageName = page[0].slice(0, -12);
                    webpageArray.push(await this.webPageHelper(this.rootPath?.with({ path: this.rootPath.path + '/web-pages/' + webpage[0] + '/content-pages/' + pageName }) || fallbackURI));
                }
            }
        }
        return webpageArray;
    }

    private getWeblinks = async (): Promise<Weblink[]> => {
        const weblinksDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/weblink-sets' }) || fallbackURI);

        const weblinksArray: Weblink[] = [];
        for (const link of weblinksDirectory) {
            const linkSubDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/weblink-sets/' + link[0] }) || fallbackURI);
            for (const sublink of linkSubDirectory) {
                if (sublink[0].endsWith(weblinkPattern)) {
                    const weblinkYaml = await vscode.workspace.fs.readFile(this.rootPath?.with({ path: this.rootPath.path + '/weblink-sets/' + link[0] + `/${sublink[0]}` }) || fallbackURI);
                    const weblinkRecord = load(new TextDecoder().decode(weblinkYaml)) as Weblink[]
                    weblinksArray.push(...weblinkRecord);
                }
            }
        }
        return weblinksArray;
    }

    private webLinkSetHelper = async (fileUri: vscode.Uri): Promise<WeblinkSet> => {
        const weblinkSetYaml = await vscode.workspace.fs.readFile(fileUri);
        const weblinkSetRecord = load(new TextDecoder().decode(weblinkSetYaml)) as WeblinkSet;
        weblinkSetRecord.adx_websiteid = this.websiteRecord.adx_websiteid;
        return weblinkSetRecord;
    };

    private getWeblinkSets = async (): Promise<WeblinkSet[]> => {
        const weblinkSetsDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/weblink-sets' }) || fallbackURI);

        const weblinkSetsArray: WeblinkSet[] = [];
        for (const weblinkSet of weblinkSetsDirectory) {
            const linkSubDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/weblink-sets/' + weblinkSet[0] }) || fallbackURI);
            for (const sublink of linkSubDirectory) {
                if (!sublink[0].endsWith(weblinkPattern)) {
                    weblinkSetsArray.push(await this.webLinkSetHelper(this.rootPath?.with({ path: this.rootPath.path + '/weblink-sets/' + weblinkSet[0] + `/${sublink[0]}` }) || fallbackURI)); // adx_title not in pac data but is manadatory, studio sends as undefined.
                }
            }
        }
        return weblinkSetsArray;
    }


    private contentSnippetHelper = async (fileUri: vscode.Uri): Promise<ContentSnippet> => {
        const snippetYaml = await vscode.workspace.fs.readFile(fileUri?.with({ path: fileUri.path + '.contentsnippet.yml' }));
        const snippetValue = await vscode.workspace.fs.readFile(fileUri?.with({ path: fileUri.path + '.contentsnippet.value.html' }));
        const snippetRecord = load(new TextDecoder().decode(snippetYaml)) as ContentSnippet
        snippetRecord.adx_value = new TextDecoder().decode(snippetValue);
        snippetRecord.adx_websiteid = '92d6c1b4-d84b-ee11-be6e-0022482d5cfb';
        snippetRecord.stateCode = 0; //check with PAC SME on how to get this field
        return snippetRecord;
    };


    private getContentSnippets = async (): Promise<ContentSnippet[]> => {
        const contentSnippetsDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/content-snippets' }) || fallbackURI);

        const contentSnippetsArray: ContentSnippet[] = [];
        for (const contentSnippet of contentSnippetsDirectory) {
            const snippetSubDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/content-snippets/' + contentSnippet[0] }) || fallbackURI);
            for (const snippet of snippetSubDirectory) {
                if (snippet[0].endsWith(ymlPattern)) {
                    contentSnippetsArray.push(await this.contentSnippetHelper(this.rootPath?.with({ path: this.rootPath.path + '/content-snippets/' + contentSnippet[0] + `/${snippet[0].slice(0, -19)}` }) || fallbackURI));
                }
            }
        }
        return contentSnippetsArray;
    }

    private pageTemplateHelper = async (fileUri: vscode.Uri): Promise<PageTemplate> => {
        const pageTemplateYaml = await vscode.workspace.fs.readFile(fileUri);
        const pageTemplateRecord = load(new TextDecoder().decode(pageTemplateYaml)) as PageTemplate;
        return pageTemplateRecord;
    };


    private getPageTemplates = async (): Promise<PageTemplate[]> => {
        const pageTemplatesDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/page-templates' }) || fallbackURI);

        const pageTemplatesArray: PageTemplate[] = [];
        for (const pageTemplate of pageTemplatesDirectory) {
            pageTemplatesArray.push(await this.pageTemplateHelper(this.rootPath?.with({ path: this.rootPath.path + '/page-templates/' + pageTemplate[0] }) || fallbackURI));
        }
        return pageTemplatesArray;
    }

    private webTemplateHelper = async (fileUri: vscode.Uri): Promise<WebTemplate> => {
        const webTemplateYaml = await vscode.workspace.fs.readFile(fileUri?.with({ path: fileUri.path + '.webtemplate.yml' }));
        const webTemplateSource = await vscode.workspace.fs.readFile(fileUri?.with({ path: fileUri.path + '.webtemplate.source.html' }));
        const webTemplateSourceHTML = new TextDecoder().decode(webTemplateSource);
        const webTemplateRecord = load(new TextDecoder().decode(webTemplateYaml)) as WebTemplate;
        webTemplateRecord.adx_source = webTemplateSourceHTML;
        webTemplateRecord.adx_websiteid = this.websiteRecord.adx_websiteid;
        return webTemplateRecord;
    };

    private getWebTemplates = async (): Promise<WebTemplate[]> => {
        const webTemplatesDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/web-templates' }) || fallbackURI);

        const webTemplatesArray: WebTemplate[] = [];
        for (const webTemplate of webTemplatesDirectory) {
            webTemplatesArray.push(await this.webTemplateHelper(this.rootPath?.with({ path: this.rootPath.path + '/web-templates/' + webTemplate[0] + `/${webTemplate[0]}` }) || fallbackURI));
        }
        return webTemplatesArray;
    }

    private entityFormHelper = async (fileUri: vscode.Uri): Promise<EntityForm> => {
        const entityFormYaml = await vscode.workspace.fs.readFile(fileUri);
        const entityFormRecord = load(new TextDecoder().decode(entityFormYaml)) as EntityForm;
        entityFormRecord.adx_websiteid = this.websiteRecord.adx_websiteid;
        return entityFormRecord;
    };

    private getEntityForms = async (): Promise<EntityForm[]> => {
        const entityFormsDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/basic-forms' }) || fallbackURI);

        const entityFormsArray: EntityForm[] = [];
        for (const entityForm of entityFormsDirectory) {
            entityFormsArray.push(await this.entityFormHelper(this.rootPath?.with({ path: this.rootPath.path + '/basic-forms/' + entityForm[0] + `/${entityForm[0]}.basicform.yml` }) || fallbackURI));
        }
        return entityFormsArray;
    }

    private entityListHelper = async (fileUri: vscode.Uri): Promise<EntityList> => {
        const entityListYaml = await vscode.workspace.fs.readFile(fileUri);
        const entityListRecord = load(new TextDecoder().decode(entityListYaml)) as EntityList;
        entityListRecord.adx_websiteid = this.websiteRecord.adx_websiteid;
        return entityListRecord;
    };

    private getEntityLists = async (): Promise<EntityList[]> => {
        const entityListsDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/lists' }) || fallbackURI);

        const entityListsArray: EntityList[] = [];
        for (const entityList of entityListsDirectory) {
            if (entityList[0].endsWith(ymlPattern)) {
                entityListsArray.push(await this.entityListHelper(this.rootPath?.with({ path: this.rootPath.path + '/lists/' + entityList[0] }) || fallbackURI));
            }
        }
        return entityListsArray;
    }

    private webFormHelper = async (fileUri: vscode.Uri): Promise<WebForm> => {
        const webFormYaml = await vscode.workspace.fs.readFile(fileUri);
        const webFormRecord = load(new TextDecoder().decode(webFormYaml)) as WebForm;
        webFormRecord.adx_websiteid = this.websiteRecord.adx_websiteid;
        return webFormRecord;
    };


    private getWebForms = async (): Promise<WebForm[]> => {
        const webFormsDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/advanced-forms' }) || fallbackURI);

        const webFormsArray: WebForm[] = [];
        for (const webForm of webFormsDirectory) {
            webFormsArray.push(await this.webFormHelper(this.rootPath?.with({ path: this.rootPath.path + '/advanced-forms/' + webForm[0] + `/${webForm[0]}.advancedform.yml` }) || fallbackURI));
        }
        return webFormsArray;
    }

    private getSiteSetting = async (): Promise<SiteSetting[]> => {
        const siteSetting = await vscode.workspace.fs.readFile(this.rootPath?.with({ path: this.rootPath.path + '/sitesetting.yml' }) || fallbackURI);
        const siteSettingYaml = load(new TextDecoder().decode(siteSetting)) as SiteSetting[];
        const siteSettingRecords = siteSettingYaml.map((siteSettingRecord) => {
            return {
                adx_websiteid: this.websiteRecord.adx_websiteid,
                adx_name: siteSettingRecord.adx_name,
                adx_value: siteSettingRecord.adx_value,
                adx_sitesettingid: siteSettingRecord.adx_sitesettingid,
            }
        });
        return siteSettingRecords;
    }

    private getSiteMarker = async (): Promise<SiteMarker[]> => {
        const siteMarker = await vscode.workspace.fs.readFile(this.rootPath?.with({ path: this.rootPath.path + '/sitemarker.yml' }) || fallbackURI);
        const siteMarkerYaml = load(new TextDecoder().decode(siteMarker)) as SiteMarker[];
        const siteMarkerRecords = siteMarkerYaml.map((siteMarkerRecord) => {
            return {
                adx_name: siteMarkerRecord.adx_name as string,
                adx_pageid: siteMarkerRecord.adx_pageid as string,
                adx_sitemarkerid: siteMarkerRecord.adx_sitemarkerid,
                adx_websiteid: this.websiteRecord.adx_websiteid,

            }

        });
        return siteMarkerRecords;
    }

    public updateContext = async () => {
        //check entity type
        const fileName = getFileName(vscode.window.activeTextEditor?.document.fileName ?? '');
        const fileUri = vscode.window.activeTextEditor?.document.uri || fallbackURI;
        const entityType: ContextProperty = this.getEntityType(fileName);
    
        switch (entityType) {
            case ContextProperty.SITE_MARKER:
                this.previewEngineContext.siteMarkers = await this.getSiteMarker();
                break;
            case ContextProperty.SITE_SETTING:
                this.previewEngineContext.siteSettings = await this.getSiteSetting();
                break;
            case ContextProperty.WEBSITE:
                // update private website record too
                this.previewEngineContext.website = await this.getWebsite();
                break;
            case ContextProperty.WEB_LINK:
                this.previewEngineContext.weblinks = await this.getWeblinks();
                break;
            case ContextProperty.WEB_LINK_SET: {
                const obj = await this.webLinkSetHelper(fileUri);
                const value = obj[ContextPropertyKey.WEB_LINK_SET as unknown as keyof WeblinkSet];
                const index = findObjectIndexByProperty(this.previewEngineContext.weblinkSets, ContextPropertyKey.WEB_LINK_SET, value);
                if (index != -1 && this.previewEngineContext.weblinkSets) {
                    this.previewEngineContext.weblinkSets[index] = obj;
                } else {
                    this.previewEngineContext.weblinkSets = await this.getWeblinkSets();
                }
                break;
            }
            case ContextProperty.ENTITY_FORM:
                {
                    const obj = await this.entityFormHelper(fileUri);
                    const value = obj[ContextPropertyKey.ENTITY_FORM as unknown as keyof EntityForm];
                    const index = findObjectIndexByProperty(this.previewEngineContext.entityForms, ContextPropertyKey.ENTITY_FORM, value);
                    if (index != -1 && this.previewEngineContext.entityForms) {
                        this.previewEngineContext.entityForms[index] = obj;
                    } else {
                        this.previewEngineContext.entityForms = await this.getEntityForms();
                    }
                    break;
                }
            case ContextProperty.ENTITY_LIST:
                {
                    const obj = await this.entityListHelper(fileUri);
                    const value = obj[ContextPropertyKey.ENTITY_LIST as unknown as keyof EntityList];
                    const index = findObjectIndexByProperty(this.previewEngineContext.entityLists, ContextPropertyKey.ENTITY_LIST, value);
                    if (index != -1 && this.previewEngineContext.entityLists) {
                        this.previewEngineContext.entityLists[index] = obj;
                    } else {
                        this.previewEngineContext.entityLists = await this.getEntityLists();
                    }
                    break;
                }
            case ContextProperty.WEB_FORM:
                {
                    const obj = await this.webFormHelper(fileUri);
                    const value = obj[ContextPropertyKey.WEB_FORM as unknown as keyof WebForm];
                    const index = findObjectIndexByProperty(this.previewEngineContext.webForms, ContextPropertyKey.WEB_FORM, value);
                    if (index != -1 && this.previewEngineContext.webForms) {
                        this.previewEngineContext.webForms[index] = obj;
                    } else {
                        this.previewEngineContext.webForms = await this.getWebForms();
                    }
                    break;
                }
            case ContextProperty.PAGE_TEMPLATE:
                {
                    const obj = await this.pageTemplateHelper(fileUri);
                    const value = obj[ContextPropertyKey.PAGE_TEMPLATE as unknown as keyof PageTemplate];
                    const index = findObjectIndexByProperty(this.previewEngineContext.pageTemplates, ContextPropertyKey.PAGE_TEMPLATE, value);
                    if (index != -1 && this.previewEngineContext.pageTemplates) {
                        this.previewEngineContext.pageTemplates[index] = obj;
                    } else {
                        this.previewEngineContext.pageTemplates = await this.getPageTemplates();
                    }
                    break;
                }
            case ContextProperty.WEBPAGE_YAML:
            case ContextProperty.WEBPAGE_COPY:
            case ContextProperty.WEBPAGE_CSS:
            case ContextProperty.WEBPAGE_JS:
            case ContextProperty.WEBPAGE_SUMMARY:
                {
                    const obj = await this.webPageHelper(fileUri?.with({ path: removeExtension(fileUri.path, entityType) }));
                    const value = obj[ContextPropertyKey.WEBPAGE as unknown as keyof Webpage];
                    const index = findObjectIndexByProperty(this.previewEngineContext.webpages, ContextPropertyKey.WEBPAGE, value);//default-offline-page
                    if (index != -1 && this.previewEngineContext.webpages) {
                        this.previewEngineContext.webpages[index] = obj;
                    } else {
                        this.previewEngineContext.webpages = await this.getWebpages();
                    }
                    break;
                }
            case ContextProperty.WEB_TEMPLATE_YAML:
            case ContextProperty.WEB_TEMPLATE_SOURCE:
                {
                    const obj = await this.webTemplateHelper(fileUri?.with({ path: removeExtension(fileUri.path, entityType) }));
                    const value = obj[ContextPropertyKey.WEB_TEMPLATE as unknown as keyof WebTemplate];
                    const index = findObjectIndexByProperty(this.previewEngineContext.webTemplates, ContextPropertyKey.WEB_TEMPLATE, value);//breadcrumb
                    if (index != -1 && this.previewEngineContext.webTemplates) {
                        this.previewEngineContext.webTemplates[index] = obj;
                    } else {
                        this.previewEngineContext.webTemplates = await this.getWebTemplates();
                    }
                    break;
                }
            case ContextProperty.CONTENT_SNIPPET_YAML:
            case ContextProperty.CONTENT_SNIPPET_VALUE:
                {
                    const obj = await this.contentSnippetHelper(fileUri?.with({ path: removeExtension(fileUri.path, entityType) }));
                    const value = obj[ContextPropertyKey.CONTENT_SNIPPET as unknown as keyof ContentSnippet];
                    const index = findObjectIndexByProperty(this.previewEngineContext.contentSnippets, ContextPropertyKey.CONTENT_SNIPPET, value);//confirm email - hindi
                    if (index != -1 && this.previewEngineContext.contentSnippets) {
                        this.previewEngineContext.contentSnippets[index] = obj;
                    } else {
                        this.previewEngineContext.contentSnippets = await this.getContentSnippets();
                    }
                    break;
                }
            default:
                break;
        }
    }

    private getEntityType = (filename: string): ContextProperty => {

        if (filename.endsWith(ContextProperty.WEBSITE)) {
            return ContextProperty.WEBSITE;
        } else if (filename.endsWith(ContextProperty.SITE_SETTING)) {
            return ContextProperty.SITE_SETTING;
        } else if (filename.endsWith(ContextProperty.SITE_MARKER)) {
            return ContextProperty.SITE_MARKER;
        } else if (filename.endsWith(ContextProperty.ENTITY_FORM)) {
            return ContextProperty.ENTITY_FORM;
        } else if (filename.endsWith(ContextProperty.ENTITY_LIST)) {
            return ContextProperty.ENTITY_LIST;
        } else if (filename.endsWith(ContextProperty.WEB_FORM)) {
            return ContextProperty.WEB_FORM;
        } else if (filename.endsWith(ContextProperty.WEB_LINK)) {
            return ContextProperty.WEB_LINK;
        } else if (filename.endsWith(ContextProperty.WEB_LINK_SET)) {
            return ContextProperty.WEB_LINK_SET;
        } else if (filename.endsWith(ContextProperty.PAGE_TEMPLATE)) {
            return ContextProperty.PAGE_TEMPLATE;
        } else if (filename.endsWith(ContextProperty.WEB_TEMPLATE_YAML)) {
            return ContextProperty.WEB_TEMPLATE_YAML;
        } else if (filename.endsWith(ContextProperty.WEB_TEMPLATE_SOURCE)) {
            return ContextProperty.WEB_TEMPLATE_SOURCE;
        } else if (filename.endsWith(ContextProperty.WEBPAGE_YAML)) {
            return ContextProperty.WEBPAGE_YAML;
        } else if (filename.endsWith(ContextProperty.WEBPAGE_COPY)) {
            return ContextProperty.WEBPAGE_COPY;
        } else if (filename.endsWith(ContextProperty.WEBPAGE_CSS)) {
            return ContextProperty.WEBPAGE_CSS;
        } else if (filename.endsWith(ContextProperty.WEBPAGE_JS)) {
            return ContextProperty.WEBPAGE_JS;
        } else if (filename.endsWith(ContextProperty.WEBPAGE_SUMMARY)) {
            return ContextProperty.WEBPAGE_SUMMARY;
        } else if (filename.endsWith(ContextProperty.CONTENT_SNIPPET_YAML)) {
            return ContextProperty.CONTENT_SNIPPET_YAML;
        } else if (filename.endsWith(ContextProperty.CONTENT_SNIPPET_VALUE)) {
            return ContextProperty.CONTENT_SNIPPET_VALUE;
        } else {
            return ContextProperty.UNKNOWN_PROPERTY;
        }
    }
}

// let rootPath: vscode.Uri | null;

// const WEBSITE_ID = 'WEBSITE_ID';
const ymlPattern = '.yml';  //   /\.(yml)$/i;
const weblinkPattern = 'weblink.yml';  // /\.weblink\.yml$/i;

// export const getRenderingContext = async (): Promise<IPreviewEngineContext> => {
//     rootPath = PortalWebView.getPortalRootFolder();

//     console.log(rootPath);
//     const map = new Map();
//     map.set('isFetchXmlForCSREnabled', true)
//     if (rootPath) {
//         return {
//             webpages: await getWebpages(),
//             contentSnippets: await getContentSnippets(),
//             webTemplates: await getWebTemplates(),
//             siteMarkers: await getSiteMarker(),
//             siteSettings: await getSiteSetting(),
//             entityLists: await getEntityLists(),
//             entityForms: await getEntityForms(),
//             webForms: await getWebForms(),
//             weblinks: await getWeblinks(),
//             weblinkSets: await getWeblinkSets(),
//             website: await getWebsite(),
//             pageTemplates: await getPageTemplates(),
//             dataResolverExtras: {},
//             resx: {},
//             featureConfig: map,
//             entityAttributeMetadata: [] as IEntityAttributeMetadata[],
//             lcid: '' as string,
//             isBootstrapV5: false as boolean,
//         }
//     }
//     else {
//         return {}
//     }


// }

enum ContextProperty {
    WEBPAGE_YAML = '.webpage.yml',
    WEBPAGE_COPY = '.webpage.copy.html',
    WEBPAGE_CSS = '.webpage.custom_css.css',
    WEBPAGE_JS = '.webpage.custom_javascript.js',
    WEBPAGE_SUMMARY = '.webpage.summary.html',
    CONTENT_SNIPPET_YAML = '.contentsnippet.yml',
    CONTENT_SNIPPET_VALUE = '.contentsnippet.value.html',
    WEB_TEMPLATE_YAML = '.webtemplate.yml',
    WEB_TEMPLATE_SOURCE = '.webtemplate.source.html',
    SITE_MARKER = 'sitemarker.yml',
    SITE_SETTING = 'sitesetting.yml',
    ENTITY_LIST = '.list.yml',
    ENTITY_FORM = '.basicform.yml',
    WEB_FORM = '.advancedform.yml',
    WEB_LINK = '.weblink.yml',
    WEB_LINK_SET = '.weblinkset.yml',
    WEBSITE = 'website.yml',
    PAGE_TEMPLATE = '.pagetemplate.yml',
    UNKNOWN_PROPERTY = ''
}
enum ContextPropertyKey {
    WEBPAGE = 'adx_webpageid',
    CONTENT_SNIPPET = 'adx_contentsnippetid',
    WEB_TEMPLATE = 'adx_webtemplateid',
    SITE_MARKER = 'adx_sitemarkerid',
    SITE_SETTING = 'adx_sitesettingid',
    ENTITY_LIST = 'adx_entitylistid',
    ENTITY_FORM = 'adx_entityformid',
    WEB_FORM = 'adx_webformid',
    WEB_LINK = 'adx_weblinkid',
    WEB_LINK_SET = 'adx_weblinksetid',
    WEBSITE = 'adx_websiteid',
    PAGE_TEMPLATE = 'adx_pagetemplateid',
}



const getFileName = (fileName: string) => {
    const lastSlashIndex = fileName.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
        return fileName.substring(lastSlashIndex + 1);
    } else {
        // If there is no forward slash in the input string, return the original string.
        return fileName;
    }
}

const findObjectIndexByProperty = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    array: any,
    key: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any
): number => {
    for (let i = 0; i < array.length; i++) {
        if (array[i][key] === value) {
            return i;
        }
    }
    return -1;
}

const removeExtension = (fileName: string, extn: string): string => {
    // Using slice to remove the extension from the end
    return fileName.slice(0, -extn.length);
}


// export const updateContext = async (previewEngineContext: IPreviewEngineContext) => {
//     //check entity type
//     const fileName = getFileName(vscode.window.activeTextEditor?.document.fileName ?? '');
//     const fileUri = vscode.window.activeTextEditor?.document.uri || fallbackURI;
//     const entityType: ContextProperty = getEntityType(fileName);

//     switch (entityType) {
//         case ContextProperty.SITE_MARKER:
//             previewEngineContext.siteMarkers = await getSiteMarker();
//             break;
//         case ContextProperty.SITE_SETTING:
//             previewEngineContext.siteSettings = await getSiteSetting();
//             break;
//         case ContextProperty.WEBSITE:
//             // update private website record too
//             previewEngineContext.website = await getWebsite();
//             break;
//         case ContextProperty.WEB_LINK:
//             previewEngineContext.weblinks = await getWeblinks();
//             break;
//         case ContextProperty.WEB_LINK_SET: {
//             const obj = await webLinkSetHelper(fileUri);
//             const value = obj[ContextPropertyKey.WEB_LINK_SET as unknown as keyof WeblinkSet];
//             const index = findObjectIndexByProperty(previewEngineContext.weblinkSets, ContextPropertyKey.WEB_LINK_SET, value);
//             if (index != -1 && previewEngineContext.weblinkSets) {
//                 previewEngineContext.weblinkSets[index] = obj;
//             } else {
//                 previewEngineContext.weblinkSets = await getWeblinkSets();
//             }
//             break;
//         }
//         case ContextProperty.ENTITY_FORM:
//             {
//                 const obj = await entityFormHelper(fileUri);
//                 const value = obj[ContextPropertyKey.ENTITY_FORM as unknown as keyof EntityForm];
//                 const index = findObjectIndexByProperty(previewEngineContext.entityForms, ContextPropertyKey.ENTITY_FORM, value);
//                 if (index != -1 && previewEngineContext.entityForms) {
//                     previewEngineContext.entityForms[index] = obj;
//                 } else {
//                     previewEngineContext.entityForms = await getEntityForms();
//                 }
//                 break;
//             }
//         case ContextProperty.ENTITY_LIST:
//             {
//                 const obj = await entityListHelper(fileUri);
//                 const value = obj[ContextPropertyKey.ENTITY_LIST as unknown as keyof EntityList];
//                 const index = findObjectIndexByProperty(previewEngineContext.entityLists, ContextPropertyKey.ENTITY_LIST, value);
//                 if (index != -1 && previewEngineContext.entityLists) {
//                     previewEngineContext.entityLists[index] = obj;
//                 } else {
//                     previewEngineContext.entityLists = await getEntityLists();
//                 }
//                 break;
//             }
//         case ContextProperty.WEB_FORM:
//             {
//                 const obj = await webFormHelper(fileUri);
//                 const value = obj[ContextPropertyKey.WEB_FORM as unknown as keyof WebForm];
//                 const index = findObjectIndexByProperty(previewEngineContext.webForms, ContextPropertyKey.WEB_FORM, value);
//                 if (index != -1 && previewEngineContext.webForms) {
//                     previewEngineContext.webForms[index] = obj;
//                 } else {
//                     previewEngineContext.webForms = await getWebForms();
//                 }
//                 break;
//             }
//         case ContextProperty.PAGE_TEMPLATE:
//             {
//                 const obj = await pageTemplateHelper(fileUri);
//                 const value = obj[ContextPropertyKey.PAGE_TEMPLATE as unknown as keyof PageTemplate];
//                 const index = findObjectIndexByProperty(previewEngineContext.pageTemplates, ContextPropertyKey.PAGE_TEMPLATE, value);
//                 if (index != -1 && previewEngineContext.pageTemplates) {
//                     previewEngineContext.pageTemplates[index] = obj;
//                 } else {
//                     previewEngineContext.pageTemplates = await getPageTemplates();
//                 }
//                 break;
//             }
//         case ContextProperty.WEBPAGE_YAML:
//         case ContextProperty.WEBPAGE_COPY:
//         case ContextProperty.WEBPAGE_CSS:
//         case ContextProperty.WEBPAGE_JS:
//         case ContextProperty.WEBPAGE_SUMMARY:
//             {
//                 const obj = await webPageHelper(fileUri?.with({ path: removeExtension(fileUri.path, entityType) }));
//                 const value = obj[ContextPropertyKey.WEBPAGE as unknown as keyof Webpage];
//                 const index = findObjectIndexByProperty(previewEngineContext.webpages, ContextPropertyKey.WEBPAGE, value);//default-offline-page
//                 if (index != -1 && previewEngineContext.webpages) {
//                     previewEngineContext.webpages[index] = obj;
//                 } else {
//                     previewEngineContext.webpages = await getWebpages();
//                 }
//                 break;
//             }
//         case ContextProperty.WEB_TEMPLATE_YAML:
//         case ContextProperty.WEB_TEMPLATE_SOURCE:
//             {
//                 const obj = await webTemplateHelper(fileUri?.with({ path: removeExtension(fileUri.path, entityType) }));
//                 const value = obj[ContextPropertyKey.WEB_TEMPLATE as unknown as keyof WebTemplate];
//                 const index = findObjectIndexByProperty(previewEngineContext.webTemplates, ContextPropertyKey.WEB_TEMPLATE, value);//breadcrumb
//                 if (index != -1 && previewEngineContext.webTemplates) {
//                     previewEngineContext.webTemplates[index] = obj;
//                 } else {
//                     previewEngineContext.webTemplates = await getWebTemplates();
//                 }
//                 break;
//             }
//         case ContextProperty.CONTENT_SNIPPET_YAML:
//         case ContextProperty.CONTENT_SNIPPET_VALUE:
//             {
//                 const obj = await contentSnippetHelper(fileUri?.with({ path: removeExtension(fileUri.path, entityType) }));
//                 const value = obj[ContextPropertyKey.CONTENT_SNIPPET as unknown as keyof ContentSnippet];
//                 const index = findObjectIndexByProperty(previewEngineContext.contentSnippets, ContextPropertyKey.CONTENT_SNIPPET, value);//confirm email - hindi
//                 if (index != -1 && previewEngineContext.contentSnippets) {
//                     previewEngineContext.contentSnippets[index] = obj;
//                 } else {
//                     previewEngineContext.contentSnippets = await getContentSnippets();
//                 }
//                 break;
//             }
//         default:
//             break;
//     }
// }

// const webPageHelper = async (pageUri: vscode.Uri): Promise<Webpage> => {
//     const webpageYaml = await vscode.workspace.fs.readFile(pageUri?.with({ path: pageUri.path + '.webpage.yml' }));
//     const webpageJS = await vscode.workspace.fs.readFile(pageUri?.with({ path: pageUri.path + '.webpage.custom_javascript.js' }));
//     const webpageCSS = await vscode.workspace.fs.readFile(pageUri?.with({ path: pageUri.path + '.webpage.custom_css.css' }));
//     const webpageCopy = await vscode.workspace.fs.readFile(pageUri?.with({ path: pageUri.path + '.webpage.copy.html' }));
//     const webpageSummary = await vscode.workspace.fs.readFile(pageUri?.with({ path: pageUri.path + '.webpage.summary.html' }));
//     const webpageRecord = load(new TextDecoder().decode(webpageYaml)) as Webpage
//     webpageRecord.adx_customcss = new TextDecoder().decode(webpageCSS)
//     webpageRecord.adx_customjavascript = new TextDecoder().decode(webpageJS)
//     webpageRecord.adx_copy = new TextDecoder().decode(webpageCopy)
//     webpageRecord.adx_summary = new TextDecoder().decode(webpageSummary)
//     webpageRecord.adx_websiteid = WEBSITE_ID
//     return webpageRecord;
// }

// const getWebpages = async (): Promise<Webpage[]> => {
//     const webpagesDirectory = await vscode.workspace.fs.readDirectory(rootPath?.with({ path: rootPath.path + '/web-pages' }) || fallbackURI);

//     const webpageArray: Webpage[] = [];
//     for (const webpage of webpagesDirectory) {
//         webpageArray.push(await webPageHelper(rootPath?.with({ path: rootPath.path + '/web-pages/' + webpage[0] + '/' + webpage[0] }) || fallbackURI));

//         const contentPageDirectory = await vscode.workspace.fs.readDirectory(rootPath?.with({ path: rootPath.path + '/web-pages/' + webpage[0] + '/content-pages' }) || fallbackURI);
//         for (const page of contentPageDirectory) {
//             if (page[0].endsWith(ymlPattern)) {
//                 const pageName = page[0].slice(0, -12);
//                 webpageArray.push(await webPageHelper(rootPath?.with({ path: rootPath.path + '/web-pages/' + webpage[0] + '/content-pages/' + pageName }) || fallbackURI));
//             }
//         }
//     }
//     return webpageArray;
// }


// const getWeblinks = async (): Promise<Weblink[]> => {
//     const weblinksDirectory = await vscode.workspace.fs.readDirectory(rootPath?.with({ path: rootPath.path + '/weblink-sets' }) || fallbackURI);

//     const weblinksArray: Weblink[] = [];
//     for (const link of weblinksDirectory) {
//         const linkSubDirectory = await vscode.workspace.fs.readDirectory(rootPath?.with({ path: rootPath.path + '/weblink-sets/' + link[0] }) || fallbackURI);
//         for (const sublink of linkSubDirectory) {
//             if (sublink[0].endsWith(weblinkPattern)) {
//                 const weblinkYaml = await vscode.workspace.fs.readFile(rootPath?.with({ path: rootPath.path + '/weblink-sets/' + link[0] + `/${sublink[0]}` }) || fallbackURI);
//                 const weblinkRecord = load(new TextDecoder().decode(weblinkYaml)) as Weblink[]
//                 weblinksArray.push(...weblinkRecord);
//             }
//         }
//     }
//     return weblinksArray;
// }

// const webLinkSetHelper = async (fileUri: vscode.Uri): Promise<WeblinkSet> => {
//     const weblinkSetYaml = await vscode.workspace.fs.readFile(fileUri);
//     const weblinkSetRecord = load(new TextDecoder().decode(weblinkSetYaml)) as WeblinkSet;
//     weblinkSetRecord.adx_websiteid = WEBSITE_ID;
//     return weblinkSetRecord;
// };


// const getWeblinkSets = async (): Promise<WeblinkSet[]> => {
//     const weblinkSetsDirectory = await vscode.workspace.fs.readDirectory(rootPath?.with({ path: rootPath.path + '/weblink-sets' }) || fallbackURI);

//     const weblinkSetsArray: WeblinkSet[] = [];
//     for (const weblinkSet of weblinkSetsDirectory) {
//         const linkSubDirectory = await vscode.workspace.fs.readDirectory(rootPath?.with({ path: rootPath.path + '/weblink-sets/' + weblinkSet[0] }) || fallbackURI);
//         for (const sublink of linkSubDirectory) {
//             if (!sublink[0].endsWith(weblinkPattern)) {
//                 weblinkSetsArray.push(await webLinkSetHelper(rootPath?.with({ path: rootPath.path + '/weblink-sets/' + weblinkSet[0] + `/${sublink[0]}` }) || fallbackURI)); // adx_title not in pac data but is manadatory, studio sends as undefined.
//             }
//         }
//     }
//     return weblinkSetsArray;
// }

// const contentSnippetHelper = async (fileUri: vscode.Uri): Promise<ContentSnippet> => {
//     const snippetYaml = await vscode.workspace.fs.readFile(fileUri?.with({ path: fileUri.path + 'yml' }));
//     const snippetValue = await vscode.workspace.fs.readFile(fileUri?.with({ path: fileUri.path + 'value.html' }));
//     const snippetRecord = load(new TextDecoder().decode(snippetYaml)) as ContentSnippet
//     snippetRecord.adx_value = new TextDecoder().decode(snippetValue);
//     snippetRecord.adx_websiteid = '92d6c1b4-d84b-ee11-be6e-0022482d5cfb';
//     snippetRecord.stateCode = 0; //check with PAC SME on how to get this field
//     return snippetRecord;
// };


// const getContentSnippets = async (): Promise<ContentSnippet[]> => {
//     const contentSnippetsDirectory = await vscode.workspace.fs.readDirectory(rootPath?.with({ path: rootPath.path + '/content-snippets' }) || fallbackURI);

//     const contentSnippetsArray: ContentSnippet[] = [];
//     for (const contentSnippet of contentSnippetsDirectory) {
//         const snippetSubDirectory = await vscode.workspace.fs.readDirectory(rootPath?.with({ path: rootPath.path + '/content-snippets/' + contentSnippet[0] }) || fallbackURI);
//         for (const snippet of snippetSubDirectory) {
//             if (snippet[0].endsWith(ymlPattern)) {
//                 contentSnippetsArray.push(await contentSnippetHelper(rootPath?.with({ path: rootPath.path + '/content-snippets/' + contentSnippet[0] + `/${snippet[0].slice(0, -3)}` }) || fallbackURI));
//             }
//         }
//     }
//     return contentSnippetsArray;
// }

// const pageTemplateHelper = async (fileUri: vscode.Uri): Promise<PageTemplate> => {
//     const pageTemplateYaml = await vscode.workspace.fs.readFile(fileUri);
//     const pageTemplateRecord = load(new TextDecoder().decode(pageTemplateYaml)) as PageTemplate;
//     return pageTemplateRecord;
// };

// const getPageTemplates = async (): Promise<PageTemplate[]> => {
//     const pageTemplatesDirectory = await vscode.workspace.fs.readDirectory(rootPath?.with({ path: rootPath.path + '/page-templates' }) || fallbackURI);

//     const pageTemplatesArray: PageTemplate[] = [];
//     for (const pageTemplate of pageTemplatesDirectory) {
//         pageTemplatesArray.push(await pageTemplateHelper(rootPath?.with({ path: rootPath.path + '/page-templates/' + pageTemplate[0] }) || fallbackURI));
//     }
//     return pageTemplatesArray;
// }

// const webTemplateHelper = async (fileUri: vscode.Uri): Promise<WebTemplate> => {
//     const webTemplateYaml = await vscode.workspace.fs.readFile(fileUri?.with({ path: fileUri.path + '.webtemplate.yml' }));
//     const webTemplateSource = await vscode.workspace.fs.readFile(fileUri?.with({ path: fileUri.path + '.webtemplate.source.html' }));
//     const webTemplateSourceHTML = new TextDecoder().decode(webTemplateSource);
//     const webTemplateRecord = load(new TextDecoder().decode(webTemplateYaml)) as WebTemplate;
//     webTemplateRecord.adx_source = webTemplateSourceHTML;
//     webTemplateRecord.adx_websiteid = WEBSITE_ID;
//     return webTemplateRecord;
// };


// const getWebTemplates = async (): Promise<WebTemplate[]> => {
//     const webTemplatesDirectory = await vscode.workspace.fs.readDirectory(rootPath?.with({ path: rootPath.path + '/web-templates' }) || fallbackURI);

//     const webTemplatesArray: WebTemplate[] = [];
//     for (const webTemplate of webTemplatesDirectory) {
//         webTemplatesArray.push(await webTemplateHelper(rootPath?.with({ path: rootPath.path + '/web-templates/' + webTemplate[0] + `/${webTemplate[0]}` }) || fallbackURI));
//     }
//     return webTemplatesArray;
// }

// const entityFormHelper = async (fileUri: vscode.Uri): Promise<EntityForm> => {
//     const entityFormYaml = await vscode.workspace.fs.readFile(fileUri);
//     const entityFormRecord = load(new TextDecoder().decode(entityFormYaml)) as EntityForm;
//     entityFormRecord.adx_websiteid = WEBSITE_ID;
//     return entityFormRecord;
// };

// const getEntityForms = async (): Promise<EntityForm[]> => {
//     const entityFormsDirectory = await vscode.workspace.fs.readDirectory(rootPath?.with({ path: rootPath.path + '/basic-forms' }) || fallbackURI);

//     const entityFormsArray: EntityForm[] = [];
//     for (const entityForm of entityFormsDirectory) {
//         entityFormsArray.push(await entityFormHelper(rootPath?.with({ path: rootPath.path + '/basic-forms/' + entityForm[0] + `/${entityForm[0]}.basicform.yml` }) || fallbackURI));
//     }
//     return entityFormsArray;
// }

// const entityListHelper = async (fileUri: vscode.Uri): Promise<EntityList> => {
//     const entityListYaml = await vscode.workspace.fs.readFile(fileUri);
//     const entityListRecord = load(new TextDecoder().decode(entityListYaml)) as EntityList;
//     entityListRecord.adx_websiteid = WEBSITE_ID;
//     return entityListRecord;
// };

// const getEntityLists = async (): Promise<EntityList[]> => {
//     const entityListsDirectory = await vscode.workspace.fs.readDirectory(rootPath?.with({ path: rootPath.path + '/lists' }) || fallbackURI);

//     const entityListsArray: EntityList[] = [];
//     for (const entityList of entityListsDirectory) {
//         if (entityList[0].endsWith(ymlPattern)) {
//             entityListsArray.push(await entityListHelper(rootPath?.with({ path: rootPath.path + '/lists/' + entityList[0] }) || fallbackURI));
//         }
//     }
//     return entityListsArray;
// }

// const webFormHelper = async (fileUri: vscode.Uri): Promise<WebForm> => {
//     const webFormYaml = await vscode.workspace.fs.readFile(fileUri);
//     const webFormRecord = load(new TextDecoder().decode(webFormYaml)) as WebForm;
//     webFormRecord.adx_websiteid = WEBSITE_ID;
//     return webFormRecord;
// };

// const getWebForms = async (): Promise<WebForm[]> => {
//     const webFormsDirectory = await vscode.workspace.fs.readDirectory(rootPath?.with({ path: rootPath.path + '/advanced-forms' }) || fallbackURI);

//     const webFormsArray: WebForm[] = [];
//     for (const webForm of webFormsDirectory) {
//         webFormsArray.push(await webFormHelper(rootPath?.with({ path: rootPath.path + '/advanced-forms/' + webForm[0] + `/${webForm[0]}.advancedform.yml` }) || fallbackURI));
//     }
//     return webFormsArray;
// }

// const getWebsite = async (): Promise<Website> => {
//     const website = await vscode.workspace.fs.readFile(rootPath?.with({ path: rootPath.path + '/website.yml' }) || fallbackURI);
//     const websiteYaml = load(new TextDecoder().decode(website));
//     return websiteYaml as Website;
// }

// const getSiteSetting = async (): Promise<SiteSetting[]> => {
//     const siteSetting = await vscode.workspace.fs.readFile(rootPath?.with({ path: rootPath.path + '/sitesetting.yml' }) || fallbackURI);
//     const siteSettingYaml = load(new TextDecoder().decode(siteSetting)) as SiteSetting[];
//     const siteSettingRecords = siteSettingYaml.map((siteSettingRecord) => {
//         return {
//             adx_websiteid: siteSettingRecord.adx_websiteid,//should we use static id?
//             adx_name: siteSettingRecord.adx_name,
//             adx_value: siteSettingRecord.adx_value,
//             adx_sitesettingid: siteSettingRecord.adx_sitesettingid,

//         }

//     });
//     return siteSettingRecords;
// }

// const getSiteMarker = async (): Promise<SiteMarker[]> => {
//     const siteMarker = await vscode.workspace.fs.readFile(rootPath?.with({ path: rootPath.path + '/sitemarker.yml' }) || fallbackURI);
//     const siteMarkerYaml = load(new TextDecoder().decode(siteMarker)) as SiteMarker[];
//     const siteMarkerRecords = siteMarkerYaml.map((siteMarkerRecord) => {
//         return {
//             adx_name: siteMarkerRecord.adx_name as string,
//             adx_pageid: siteMarkerRecord.adx_pageid as string,
//             adx_sitemarkerid: siteMarkerRecord.adx_sitemarkerid,
//             adx_websiteid: WEBSITE_ID,

//         }

//     });
//     return siteMarkerRecords;
// }

