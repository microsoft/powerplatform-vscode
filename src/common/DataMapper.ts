/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as path from "path";
import * as vscode from 'vscode';
import { IPreviewEngineContext } from './TreeView/Utils/IDataResolver';
import { Webpage } from './TreeView/Types/Entity/WebPage';
import { Website } from './TreeView/Types/Entity/Website';
import { WebTemplate } from './TreeView/Types/Entity/WebTemplate';
import { PageTemplate } from './TreeView/Types/Entity/PageTemplate';
import { PortalWebView } from '../client/PortalWebView';
import { ContextProperty } from './TreeView/Utils/Constant';
import { createTree } from './TreeViewProvider';
import { IItem } from './TreeView/Types/Entity/IItem';

const yaml = require("js-yaml");
const load = yaml.load;
const fallbackURI = vscode.Uri.file('');

export const treeView = async () => {
  const previewHelper = new PreviewHelper();
  try {
    await previewHelper.createContext();  
    const getPath=await previewHelper.getPath();
    const IPortalMetadataContext = await previewHelper.getPreviewHelper();
    console.log(IPortalMetadataContext);
    const web=await previewHelper.web();
    const { allwebTemplate, allwebPage, allpageTemplate } = convertAllMetadataToItems(IPortalMetadataContext, getPath);
    const websiteIItem = await createWebsiteItem(previewHelper);
    const { webtemplateIItem, webPageIItem, pageTemplateItem } = createIndividualItems(allwebTemplate, allwebPage, allpageTemplate);
    (websiteIItem.children as IItem[]).push(webtemplateIItem, webPageIItem, pageTemplateItem);
    console.log(websiteIItem);
    createTree(websiteIItem);

  } catch (error) {
    console.error('Error:', error);
  }
};

function convertAllMetadataToItems(IPortalMetadataContext: any, getPath: any) {
  const allwebTemplate = convertWebTemplatesToIItems(IPortalMetadataContext, getPath);
  const allwebPage = convertWebpagesToItems(IPortalMetadataContext, getPath);
  const allpageTemplate = convertPageTemplateToItems(IPortalMetadataContext);
  return { allwebTemplate, allwebPage, allpageTemplate };
}

async function createWebsiteItem(previewHelper: PreviewHelper) {
  const web = await previewHelper.web();
  return {
    label: web.adx_name ?? 'Unnamed Website',
    title: web.adx_name ?? 'Unnamed Website',
    id: web.adx_websiteid,
    isFile: false,
    content: "",
    path: vscode.Uri.parse(`/${web.adx_name}`),
    component: "12",
    children: [],
    error: ""
  };
}

function createIndividualItems(allwebTemplate: IItem[], allwebPage: IItem[], allpageTemplate: IItem[]) {
  const webtemplateIItem = {
    label: 'Web Template',
    title: 'Web Template',
    id: '',
    isFile: false,
    content: "",
    path: vscode.Uri.parse(`/WebTemplate`),
    component: "",
    children: allwebTemplate,
    error: ""
  };

  const webPageIItem = {
    label: 'Web Page',
    title: 'Web Page',
    id: '',
    isFile: false,
    content: "",
    path: vscode.Uri.parse(`/WebPage`),
    component: "",
    children: allwebPage,
    error: ""
  };

  const pageTemplateItem = {
    label: 'Page Template',
    title: 'Page Template',
    id: '',
    isFile: false,
    content: "",
    path: vscode.Uri.parse(`/PageTemplate`),
    component: "",
    children: allpageTemplate,
    error: ""
  };

  return { webtemplateIItem, webPageIItem, pageTemplateItem };
}






function createItem(label: string, title: string, id: string, isFile: boolean, path: vscode.Uri, component: string, children: IItem[] = [], content: string = '', error: string = ''): IItem {
  return {
    label,
    title,
    id,
    isFile,
    content,
    path,
    component,
    children,
    error,
  };
}

function createCopyItems(webpage: Webpage, getPath: any, y: string, x: string, langSuffix: string = '',content: string = ''): IItem[] {
  const basePath = `${getPath.path}/web-pages/${y}${content}/${x}${langSuffix}`;
  const copyItem = createItem(`${webpage.adx_name} Copy`, `${webpage.adx_name} Copy`, `${webpage.adx_webpageid}_copy`, true, vscode.Uri.file(`${basePath}.webpage.copy.html`), "01");
  const dependenciesItem = createItem(`Dependencies`, `Dependencies`, '', false, vscode.Uri.file(`/dependencies`), "01");
  const cssItem = createItem(`${webpage.adx_name}.css`, `${webpage.adx_name}.css`, `${webpage.adx_webpageid}_css`, true, vscode.Uri.file(`${basePath}.webpage.custom_css.css`), "01");
  const jsItem = createItem(`${webpage.adx_name}.js`, `${webpage.adx_name}.js`, `${webpage.adx_webpageid}_js`, true, vscode.Uri.file(`${basePath}.webpage.custom_javascript.js`), "01");
  const summaryItem = createItem(`${webpage.adx_name} Summary`, `${webpage.adx_name} Summary`, `${webpage.adx_webpageid}_summary`, true, vscode.Uri.file(`${basePath}.webpage.summary.html`), "01");
  const pageCopy = createItem(`Page Copy`, `Page Copy`, `Page_copy`, false, vscode.Uri.file(`/pagecopy`), "01", [copyItem, dependenciesItem]);
  const pageSummary = createItem(`Page Summary`, `Page Summary`, `Page_Summary`, false, vscode.Uri.file(`/pageSummary`), "01", [summaryItem]);

  return [pageCopy, cssItem, jsItem, pageSummary];
}

function convertWebpagesToItems(metadataContext: IPreviewEngineContext, getPath: any): IItem[] {
  const items: IItem[] = [];
  const webpages: Webpage[] | undefined = metadataContext.webpages;

  if (!webpages) {
    return items;
  }

  const contentPage: Webpage[] = [];

  for (const webpage of webpages) {
    if (!webpage.adx_webpagelanguageid) {
      const str = webpage.adx_name;
      let x = str.replace(/\s+/g, '-');
      let y = x.toLowerCase();
      const [pageCopy, cssItem, jsItem, pageSummary] = createCopyItems(webpage, getPath, y, x);
      const webpageItem = createItem(webpage.adx_name, webpage.adx_name, webpage.adx_webpageid, false, vscode.Uri.parse(`/${webpage.adx_name}`), "03", [pageCopy, cssItem, jsItem, pageSummary]);
      items.push(webpageItem);
    } else {
      contentPage.push(webpage);
    }
  }

  items.forEach(item => {
    webpages.forEach(webpage => {
      if (item.id === webpage.adx_parentpageid) {
        const subItem = items.find(it => webpage.adx_webpageid === it.id);
        if (subItem) {
          let subpageItem = item.children.find(child => child.label === "Subpage");
          if (!subpageItem) {
            subpageItem = createItem('Subpage', 'Subpage', '', false, vscode.Uri.parse(`/Subpage`), "", [subItem]);
            item.children.push(subpageItem);
          } else {
            subpageItem.children.push(subItem);
          }
        }
      }
    });
  });

  for (const contentpg of contentPage) {
    const str = contentpg.adx_name;
    let x = str.replace(/\s+/g, '-');
    let y = x.toLowerCase();
    const [pageCopy, cssItem, jsItem, pageSummary] = createCopyItems(contentpg, getPath, y, x, '.en-US','/content-pages');
    const contentPageItem = createItem(`${contentpg.adx_name} Content Page`, `${contentpg.adx_name} Content Page`, `${contentpg.adx_webpageid}_content`, false, vscode.Uri.file(`${contentpg.adx_name}/Content`), "", [pageCopy, cssItem, jsItem, pageSummary]);

    items.forEach(item => {
      if (item.title === contentpg.adx_name) {
        item.children.push(contentPageItem);
      }
    });
  }

  console.log(items);
  return items.filter(item => item.label === "Home");
}

function convertWebTemplatesToIItems(metadataContext: IPreviewEngineContext,getPath: any): IItem[] {
  const items: IItem[] = [];
  const webTemplates: WebTemplate[] | undefined = metadataContext.webTemplates;

  if (!webTemplates) {
    return items; 
  }

  for (const template of webTemplates) {
    const str=template.adx_name;
    let x=str.replace(/\s+/g, '-');
    let y=x.toLowerCase();
    const children: IItem[] = [
      {
        label: "SourceDependencies",
        title: "SourceDependencies",
        id: `${template.adx_webtemplateid}_sourceDependencies`,
        isFile: false,
        content: "",
        path: vscode.Uri.parse(`/${template.adx_name}/sourceDependencies`),
        component: "", 
        children: [],
        error: ""
      },
      {
        label: `${template.adx_name}.html`,
        title: `${template.adx_name}.html`,
        id: `${template.adx_webtemplateid}_html`,
        isFile: true,
        content: template.adx_source,
        // path: vscode.Uri.parse(`/${template.adx_name}/${template.adx_name}.html`),
        path: vscode.Uri.file(`${getPath.path}/web-templates/${y}/${x}.webtemplate.source.html`),
        component: "01", 
        children: [],
        error: ""
      }
    ];

    const item: IItem = {
      label: template.adx_name,
      title: template.adx_name,
      id: template.adx_webtemplateid,
      isFile: false,
      content: '',
      path: vscode.Uri.parse(`/${template.adx_name}`),
      component: "8",
      children: children,
      error: ""
    };

    items.push(item);
  }
  return items;
}

function convertPageTemplateToItems(metadataContext: IPreviewEngineContext): IItem[] {
  const items: IItem[] = [];
  const pageTemplates: PageTemplate[] | undefined = metadataContext.pageTemplates;

  if (!pageTemplates) {
    return items; 
  }

  for (const template of pageTemplates) {
    const item: IItem = {
      label: template.adx_name,
      title: template.adx_name,
      id: template.adx_pagetemplateid,
      isFile: true,
      content: template.adx_description || '',
      path: undefined,
      component: "8",
      children: [],
      error: ""
    };

    items.push(item);
  }
  return items;
}





export class PreviewHelper {
    private pathroot: vscode.Uri | null;
    private previewHelper: IPreviewEngineContext;
    private websiteData: Website;

    constructor() {
        this.previewHelper = {};
        // this.pathroot = PortalWebView.getPortalRootFolder();
        this.pathroot= vscode.Uri.file('/c:/Users/t-mansisingh/Desktop/clone2/mansi-site-1---site-ajx90');
        this.websiteData = {} as Website;
    }

    public createContext = async () => {
        this.websiteData = await this.getWebsite();
        this.previewHelper = await this.createEngineContext();
    }
    public getPath=async()=>{
      return this.pathroot;
    }

    public web=async()=>{
      return this.websiteData;
    }

    public getPreviewHelper = () => {
        return this.previewHelper;
    }

    private getWebsite = async (): Promise<Website> => {
      const website = await vscode.workspace.fs.readFile(this.pathroot?.with({ path: this.pathroot.path + '/website.yml' }) || fallbackURI);
      const websiteYaml = load(new TextDecoder().decode(website));
      return websiteYaml as Website;
  }

    private createEngineContext = async (): Promise<IPreviewEngineContext> => {
        if (this.pathroot) {
            return {
                webpages: await this.getWebpages(),
                pageTemplates: await this.getPageTemplates(),
                webTemplates: await this.getWebTemplates(),
            }
        } else return {}
    }

    private getWebpages = async (): Promise<Webpage[]> => {
        const webpagesDir = await vscode.workspace.fs.readDirectory(this.pathroot?.with({ path: this.pathroot.path + '/web-pages' }) || fallbackURI);
        const webpageArray: Webpage[] = [];

        for (const webpage of webpagesDir) {
            webpageArray.push(await this.webPageHelper(this.pathroot?.with({ path: this.pathroot.path + '/web-pages/' + webpage[0] + '/' + webpage[0] }) || fallbackURI));

            const contentPageDir = await vscode.workspace.fs.readDirectory(this.pathroot?.with({ path: this.pathroot.path + '/web-pages/' + webpage[0] + '/content-pages' }) || fallbackURI);
            for (const page of contentPageDir) {
                if (page[0].endsWith(ContextProperty.WEBPAGE_YAML)) {
                    const pageName = page[0].slice(0, -12);
                    webpageArray.push(await this.webPageHelper(this.pathroot?.with({ path: this.pathroot.path + '/web-pages/' + webpage[0] + '/content-pages/' + pageName }) || fallbackURI));
                }
            }
        }
        return webpageArray;
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
        webpageRecord.adx_websiteid = this.websiteData.adx_websiteid;
        return webpageRecord;
    }

    private getPageTemplates = async (): Promise<PageTemplate[]> => {
        const pageTemplatesDirectory = await vscode.workspace.fs.readDirectory(this.pathroot?.with({ path: this.pathroot.path + '/page-templates' }) || fallbackURI);
        const pageTemplatesArray: PageTemplate[] = [];

        for (const pageTemplate of pageTemplatesDirectory) {
            pageTemplatesArray.push(await this.pageTemplateHelper(this.pathroot?.with({ path: this.pathroot.path + '/page-templates/' + pageTemplate[0] }) || fallbackURI));
        }
        return pageTemplatesArray;
    }

    private pageTemplateHelper = async (fileUri: vscode.Uri): Promise<PageTemplate> => {
        const pageTemplateYaml = await vscode.workspace.fs.readFile(fileUri);
        const pageTemplateRecord = load(new TextDecoder().decode(pageTemplateYaml)) as PageTemplate;
        return pageTemplateRecord;
    };


    private webTemplateHelper = async (fileUri: vscode.Uri): Promise<WebTemplate> => {
      const webTemplateYaml = await vscode.workspace.fs.readFile(fileUri?.with({ path: fileUri.path + '.webtemplate.yml' }));
      const webTemplateSource = await vscode.workspace.fs.readFile(fileUri?.with({ path: fileUri.path + '.webtemplate.source.html' }));
      const webTemplateSourceHTML = new TextDecoder().decode(webTemplateSource);
      const webTemplateRecord = load(new TextDecoder().decode(webTemplateYaml)) as WebTemplate;
      webTemplateRecord.adx_source = webTemplateSourceHTML;
      webTemplateRecord.adx_websiteid = this.websiteData.adx_websiteid;
      return webTemplateRecord;
  };

  private getWebTemplates = async (): Promise<WebTemplate[]> => {
      const webTemplatesDirectory = await vscode.workspace.fs.readDirectory(this.pathroot?.with({ path: this.pathroot.path + '/web-templates' }) || fallbackURI);

      const webTemplatesArray: WebTemplate[] = [];
      for (const webTemplate of webTemplatesDirectory) {
          webTemplatesArray.push(await this.webTemplateHelper(this.pathroot?.with({ path: this.pathroot.path + '/web-templates/' + webTemplate[0] + `/${webTemplate[0]}` }) || fallbackURI));
      }
      return webTemplatesArray;
  }
}
















































// export class PreviewEngineContext {

//     private previewEngineContext: IPreviewEngineContext;
//     private websiteRecord: Website;
//     private rootPath: vscode.Uri | null;
//     private isBootstrapV5: boolean;

//     constructor() {
//         this.isBootstrapV5 = false;
//         this.previewEngineContext = {};
//         this.rootPath = PortalWebView.getPortalRootFolder();
//         this.websiteRecord = {} as Website;
//         console.log(this.rootPath);
//     }

//     public createContext = async () => {
//         this.websiteRecord = await this.getWebsite();
//         this.previewEngineContext = await this.createEngineContext();
//     }

//     public getPreviewEngineContext = () => {
//         return this.previewEngineContext;
//     }

//     private createEngineContext = async (): Promise<IPreviewEngineContext> => {

//         if (this.rootPath) {
//             return {
//                 webpages: await this.getWebpages(),
//                 contentSnippets: await this.getContentSnippets(),
//                 webTemplates: await this.getWebTemplates(),
//                 siteMarkers: await this.getSiteMarker(),
//                 siteSettings: await this.getSiteSetting(),
//                 entityLists: await this.getEntityLists(),
//                 entityForms: await this.getEntityForms(),
//                 webForms: await this.getWebForms(),
//                 weblinks: await this.getWeblinks(),
//                 weblinkSets: await this.getWeblinkSets(),
//                 website: this.websiteRecord,
//                 pageTemplates: await this.getPageTemplates(),
//                 dataResolverExtras: {},
//                 resx: {},
//                 featureConfig: new Map(),
//                 entityAttributeMetadata: [] as IEntityAttributeMetadata[],
//                 lcid: '' as string,
//                 isBootstrapV5: this.isBootstrapV5,
//             }
//         } else return {}
//     }

//     private getWebsite = async (): Promise<Website> => {
//         const website = await vscode.workspace.fs.readFile(this.rootPath?.with({ path: this.rootPath.path + '/website.yml' }) || fallbackURI);
//         const websiteYaml = load(new TextDecoder().decode(website));
//         console.log(websiteYaml);
//         return websiteYaml as Website;
//     }

//     private webPageHelper = async (pageUri: vscode.Uri): Promise<Webpage> => {
//         const webpageYaml = await vscode.workspace.fs.readFile(pageUri?.with({ path: pageUri.path + '.webpage.yml' }));
//         const webpageJS = await vscode.workspace.fs.readFile(pageUri?.with({ path: pageUri.path + '.webpage.custom_javascript.js' }));
//         const webpageCSS = await vscode.workspace.fs.readFile(pageUri?.with({ path: pageUri.path + '.webpage.custom_css.css' }));
//         const webpageCopy = await vscode.workspace.fs.readFile(pageUri?.with({ path: pageUri.path + '.webpage.copy.html' }));
//         const webpageSummary = await vscode.workspace.fs.readFile(pageUri?.with({ path: pageUri.path + '.webpage.summary.html' }));
//         const webpageRecord = load(new TextDecoder().decode(webpageYaml)) as Webpage;
//         webpageRecord.adx_customcss = new TextDecoder().decode(webpageCSS);
//         webpageRecord.adx_customjavascript = new TextDecoder().decode(webpageJS);
//         webpageRecord.adx_copy = new TextDecoder().decode(webpageCopy);
//         webpageRecord.adx_summary = new TextDecoder().decode(webpageSummary);
//         webpageRecord.adx_websiteid = this.websiteRecord.adx_websiteid;
//         return webpageRecord;
//     }


//     private getWebpages = async (): Promise<Webpage[]> => {
//         const webpagesDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/web-pages' }) || fallbackURI);

//         const webpageArray: Webpage[] = [];
//         for (const webpage of webpagesDirectory) {
//             webpageArray.push(await this.webPageHelper(this.rootPath?.with({ path: this.rootPath.path + '/web-pages/' + webpage[0] + '/' + webpage[0] }) || fallbackURI));

//             const contentPageDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/web-pages/' + webpage[0] + '/content-pages' }) || fallbackURI);
//             for (const page of contentPageDirectory) {
//                 if (page[0].endsWith(ContextProperty.WEBPAGE_YAML)) {
//                     const pageName = page[0].slice(0, -12);
//                     webpageArray.push(await this.webPageHelper(this.rootPath?.with({ path: this.rootPath.path + '/web-pages/' + webpage[0] + '/content-pages/' + pageName }) || fallbackURI));
//                 }
//             }
//         }
//         console.log(webpageArray);
//         return webpageArray;
//     }

//     private getWeblinks = async (): Promise<Weblink[]> => {
//         const weblinksDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/weblink-sets' }) || fallbackURI);

//         const weblinksArray: Weblink[] = [];
//         for (const link of weblinksDirectory) {
//             const linkSubDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/weblink-sets/' + link[0] }) || fallbackURI);
//             for (const sublink of linkSubDirectory) {
//                 if (sublink[0].endsWith(ContextProperty.WEB_LINK)) {
//                     const weblinkYaml = await vscode.workspace.fs.readFile(this.rootPath?.with({ path: this.rootPath.path + '/weblink-sets/' + link[0] + `/${sublink[0]}` }) || fallbackURI);
//                     const weblinkRecord = load(new TextDecoder().decode(weblinkYaml)) as Weblink[]
//                     weblinksArray.push(...weblinkRecord);
//                 }
//             }
//         }
//         return weblinksArray;
//     }

//     private webLinkSetHelper = async (fileUri: vscode.Uri): Promise<WeblinkSet> => {
//         const weblinkSetYaml = await vscode.workspace.fs.readFile(fileUri);
//         const weblinkSetRecord = load(new TextDecoder().decode(weblinkSetYaml)) as WeblinkSet;
//         weblinkSetRecord.adx_websiteid = this.websiteRecord.adx_websiteid;
//         return weblinkSetRecord;
//     };

//     private getWeblinkSets = async (): Promise<WeblinkSet[]> => {
//         const weblinkSetsDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/weblink-sets' }) || fallbackURI);

//         const weblinkSetsArray: WeblinkSet[] = [];
//         for (const weblinkSet of weblinkSetsDirectory) {
//             const linkSubDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/weblink-sets/' + weblinkSet[0] }) || fallbackURI);
//             for (const sublink of linkSubDirectory) {
//                 if (sublink[0].endsWith(ContextProperty.WEB_LINK_SET)) {
//                     weblinkSetsArray.push(await this.webLinkSetHelper(this.rootPath?.with({ path: this.rootPath.path + '/weblink-sets/' + weblinkSet[0] + `/${sublink[0]}` }) || fallbackURI)); // adx_title not in pac data but is manadatory, studio sends as undefined.
//                 }
//             }
//         }
//         return weblinkSetsArray;
//     }


//     private contentSnippetHelper = async (fileUri: vscode.Uri): Promise<ContentSnippet> => {
//         const snippetYaml = await vscode.workspace.fs.readFile(fileUri?.with({ path: fileUri.path + '.contentsnippet.yml' }));
//         const snippetValue = await vscode.workspace.fs.readFile(fileUri?.with({ path: fileUri.path + '.contentsnippet.value.html' }));
//         const snippetRecord = load(new TextDecoder().decode(snippetYaml)) as ContentSnippet
//         snippetRecord.adx_value = new TextDecoder().decode(snippetValue);
//         snippetRecord.adx_websiteid = '92d6c1b4-d84b-ee11-be6e-0022482d5cfb';
//         snippetRecord.stateCode = 0; //check with PAC SME on how to get this field
//         return snippetRecord;
//     };


//     private getContentSnippets = async (): Promise<ContentSnippet[]> => {
//         const contentSnippetsDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/content-snippets' }) || fallbackURI);

//         const contentSnippetsArray: ContentSnippet[] = [];
//         for (const contentSnippet of contentSnippetsDirectory) {
//             const snippetSubDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/content-snippets/' + contentSnippet[0] }) || fallbackURI);
//             for (const snippet of snippetSubDirectory) {
//                 if (snippet[0].endsWith(ContextProperty.CONTENT_SNIPPET_YAML)) {
//                     contentSnippetsArray.push(await this.contentSnippetHelper(this.rootPath?.with({ path: this.rootPath.path + '/content-snippets/' + contentSnippet[0] + `/${snippet[0].slice(0, -19)}` }) || fallbackURI));
//                 }
//             }
//         }
//         return contentSnippetsArray;
//     }

//     private pageTemplateHelper = async (fileUri: vscode.Uri): Promise<PageTemplate> => {
//         const pageTemplateYaml = await vscode.workspace.fs.readFile(fileUri);
//         const pageTemplateRecord = load(new TextDecoder().decode(pageTemplateYaml)) as PageTemplate;
//         return pageTemplateRecord;
//     };


//     private getPageTemplates = async (): Promise<PageTemplate[]> => {
//         const pageTemplatesDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/page-templates' }) || fallbackURI);

//         const pageTemplatesArray: PageTemplate[] = [];
//         for (const pageTemplate of pageTemplatesDirectory) {
//             pageTemplatesArray.push(await this.pageTemplateHelper(this.rootPath?.with({ path: this.rootPath.path + '/page-templates/' + pageTemplate[0] }) || fallbackURI));
//         }
//         return pageTemplatesArray;
//     }

//     private webTemplateHelper = async (fileUri: vscode.Uri): Promise<WebTemplate> => {
//         const webTemplateYaml = await vscode.workspace.fs.readFile(fileUri?.with({ path: fileUri.path + '.webtemplate.yml' }));
//         const webTemplateSource = await vscode.workspace.fs.readFile(fileUri?.with({ path: fileUri.path + '.webtemplate.source.html' }));
//         const webTemplateSourceHTML = new TextDecoder().decode(webTemplateSource);
//         const webTemplateRecord = load(new TextDecoder().decode(webTemplateYaml)) as WebTemplate;
//         webTemplateRecord.adx_source = webTemplateSourceHTML;
//         webTemplateRecord.adx_websiteid = this.websiteRecord.adx_websiteid;
//         return webTemplateRecord;
//     };

//     private getWebTemplates = async (): Promise<WebTemplate[]> => {
//         const webTemplatesDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/web-templates' }) || fallbackURI);

//         const webTemplatesArray: WebTemplate[] = [];
//         for (const webTemplate of webTemplatesDirectory) {
//             webTemplatesArray.push(await this.webTemplateHelper(this.rootPath?.with({ path: this.rootPath.path + '/web-templates/' + webTemplate[0] + `/${webTemplate[0]}` }) || fallbackURI));
//         }
//         return webTemplatesArray;
//     }

//     private entityFormHelper = async (fileUri: vscode.Uri): Promise<EntityForm> => {
//         const entityFormYaml = await vscode.workspace.fs.readFile(fileUri);
//         const entityFormRecord = load(new TextDecoder().decode(entityFormYaml)) as EntityForm;
//         entityFormRecord.adx_websiteid = this.websiteRecord.adx_websiteid;
//         return entityFormRecord;
//     };

//     private getEntityForms = async (): Promise<EntityForm[]> => {
//         const entityFormsDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/basic-forms' }) || fallbackURI);

//         const entityFormsArray: EntityForm[] = [];
//         for (const entityForm of entityFormsDirectory) {
//             entityFormsArray.push(await this.entityFormHelper(this.rootPath?.with({ path: this.rootPath.path + '/basic-forms/' + entityForm[0] + `/${entityForm[0]}.basicform.yml` }) || fallbackURI));
//         }
//         return entityFormsArray;
//     }

//     private entityListHelper = async (fileUri: vscode.Uri): Promise<EntityList> => {
//         const entityListYaml = await vscode.workspace.fs.readFile(fileUri);
//         const entityListRecord = load(new TextDecoder().decode(entityListYaml)) as EntityList;
//         entityListRecord.adx_websiteid = this.websiteRecord.adx_websiteid;
//         return entityListRecord;
//     };

//     private getEntityLists = async (): Promise<EntityList[]> => {
//         const entityListsDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/lists' }) || fallbackURI);

//         const entityListsArray: EntityList[] = [];
//         for (const entityList of entityListsDirectory) {
//             if (entityList[0].endsWith(ContextProperty.ENTITY_LIST)) {
//                 entityListsArray.push(await this.entityListHelper(this.rootPath?.with({ path: this.rootPath.path + '/lists/' + entityList[0] }) || fallbackURI));
//             }
//         }
//         return entityListsArray;
//     }

//     private webFormHelper = async (fileUri: vscode.Uri): Promise<WebForm> => {
//         const webFormYaml = await vscode.workspace.fs.readFile(fileUri);
//         const webFormRecord = load(new TextDecoder().decode(webFormYaml)) as WebForm;
//         webFormRecord.adx_websiteid = this.websiteRecord.adx_websiteid;
//         return webFormRecord;
//     };


//     private getWebForms = async (): Promise<WebForm[]> => {
//         const webFormsDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/advanced-forms' }) || fallbackURI);

//         const webFormsArray: WebForm[] = [];
//         for (const webForm of webFormsDirectory) {
//             webFormsArray.push(await this.webFormHelper(this.rootPath?.with({ path: this.rootPath.path + '/advanced-forms/' + webForm[0] + `/${webForm[0]}.advancedform.yml` }) || fallbackURI));
//         }
//         return webFormsArray;
//     }

//     private getSiteSetting = async (): Promise<SiteSetting[]> => {
//         const siteSetting = await vscode.workspace.fs.readFile(this.rootPath?.with({ path: this.rootPath.path + '/sitesetting.yml' }) || fallbackURI);
//         const siteSettingYaml = load(new TextDecoder().decode(siteSetting)) as SiteSetting[];
//         const siteSettingRecords = siteSettingYaml.map((siteSettingRecord) => {
//             if (siteSettingRecord.adx_name === BootstrapSiteSetting) {
//                 this.isBootstrapV5 = siteSettingRecord.adx_value ? String(siteSettingRecord.adx_value).toLowerCase() === 'true' : false;
//             }
//             return {
//                 adx_websiteid: this.websiteRecord.adx_websiteid,
//                 adx_name: siteSettingRecord.adx_name,
//                 adx_value: siteSettingRecord.adx_value,
//                 adx_sitesettingid: siteSettingRecord.adx_sitesettingid,
//             }
//         });
//         return siteSettingRecords;
//     }

//     private getSiteMarker = async (): Promise<SiteMarker[]> => {
//         const siteMarker = await vscode.workspace.fs.readFile(this.rootPath?.with({ path: this.rootPath.path + '/sitemarker.yml' }) || fallbackURI);
//         const siteMarkerYaml = load(new TextDecoder().decode(siteMarker)) as SiteMarker[];
//         const siteMarkerRecords = siteMarkerYaml.map((siteMarkerRecord) => {
//             return {
//                 adx_name: siteMarkerRecord.adx_name as string,
//                 adx_pageid: siteMarkerRecord.adx_pageid as string,
//                 adx_sitemarkerid: siteMarkerRecord.adx_sitemarkerid,
//                 adx_websiteid: this.websiteRecord.adx_websiteid,

//             }

//         });
//         return siteMarkerRecords;
//     }

//     public updateContext = async () => {
//         const fileUri = vscode.window.activeTextEditor?.document.uri || fallbackURI;
//         const fileName = getFileProperties(fileUri.path).fileCompleteName;
//         if (!fileName) {
//             // TODO: Handle this scenario
//             return;
//         }
//         // Check entity type
//         const entityType: ContextProperty = this.getEntityType(fileName);

//         switch (entityType) {
//             case ContextProperty.SITE_MARKER:
//                 this.previewEngineContext.siteMarkers = await this.getSiteMarker();
//                 break;
//             case ContextProperty.SITE_SETTING:
//                 this.previewEngineContext.siteSettings = await this.getSiteSetting();
//                 break;
//             case ContextProperty.WEBSITE:
//                 {
//                     const websiteObj = await this.getWebsite();
//                     if (websiteObj?.adx_websiteid === this.websiteRecord?.adx_websiteid) {
//                         this.websiteRecord = websiteObj;
//                     }
//                     else {
//                         this.websiteRecord = websiteObj;
//                         this.previewEngineContext = await this.createEngineContext();
//                     }
//                     break;
//                 }
//             case ContextProperty.WEB_LINK:
//                 this.previewEngineContext.weblinks = await this.getWeblinks();
//                 break;
//             case ContextProperty.WEB_LINK_SET: {
//                 const obj = await this.webLinkSetHelper(fileUri);
//                 const value = obj[ContextPropertyKey.WEB_LINK_SET as unknown as keyof WeblinkSet];
//                 const index = findObjectIndexByProperty(this.previewEngineContext.weblinkSets, ContextPropertyKey.WEB_LINK_SET, value);
//                 if (index != -1 && this.previewEngineContext.weblinkSets) {
//                     this.previewEngineContext.weblinkSets[index] = obj;
//                 } else {
//                     this.previewEngineContext.weblinkSets = await this.getWeblinkSets();
//                 }
//                 break;
//             }
//             case ContextProperty.ENTITY_FORM:
//                 {
//                     const obj = await this.entityFormHelper(fileUri);
//                     const value = obj[ContextPropertyKey.ENTITY_FORM as unknown as keyof EntityForm];
//                     const index = findObjectIndexByProperty(this.previewEngineContext.entityForms, ContextPropertyKey.ENTITY_FORM, value);
//                     if (index != -1 && this.previewEngineContext.entityForms) {
//                         this.previewEngineContext.entityForms[index] = obj;
//                     } else {
//                         this.previewEngineContext.entityForms = await this.getEntityForms();
//                     }
//                     break;
//                 }
//             case ContextProperty.ENTITY_LIST:
//                 {
//                     const obj = await this.entityListHelper(fileUri);
//                     const value = obj[ContextPropertyKey.ENTITY_LIST as unknown as keyof EntityList];
//                     const index = findObjectIndexByProperty(this.previewEngineContext.entityLists, ContextPropertyKey.ENTITY_LIST, value);
//                     if (index != -1 && this.previewEngineContext.entityLists) {
//                         this.previewEngineContext.entityLists[index] = obj;
//                     } else {
//                         this.previewEngineContext.entityLists = await this.getEntityLists();
//                     }
//                     break;
//                 }
//             case ContextProperty.WEB_FORM:
//                 {
//                     const obj = await this.webFormHelper(fileUri);
//                     const value = obj[ContextPropertyKey.WEB_FORM as unknown as keyof WebForm];
//                     const index = findObjectIndexByProperty(this.previewEngineContext.webForms, ContextPropertyKey.WEB_FORM, value);
//                     if (index != -1 && this.previewEngineContext.webForms) {
//                         this.previewEngineContext.webForms[index] = obj;
//                     } else {
//                         this.previewEngineContext.webForms = await this.getWebForms();
//                     }
//                     break;
//                 }
//             case ContextProperty.PAGE_TEMPLATE:
//                 {
//                     const obj = await this.pageTemplateHelper(fileUri);
//                     const value = obj[ContextPropertyKey.PAGE_TEMPLATE as unknown as keyof PageTemplate];
//                     const index = findObjectIndexByProperty(this.previewEngineContext.pageTemplates, ContextPropertyKey.PAGE_TEMPLATE, value);
//                     if (index != -1 && this.previewEngineContext.pageTemplates) {
//                         this.previewEngineContext.pageTemplates[index] = obj;
//                     } else {
//                         this.previewEngineContext.pageTemplates = await this.getPageTemplates();
//                     }
//                     break;
//                 }
//             case ContextProperty.WEBPAGE_YAML:
//             case ContextProperty.WEBPAGE_COPY:
//             case ContextProperty.WEBPAGE_CSS:
//             case ContextProperty.WEBPAGE_JS:
//             case ContextProperty.WEBPAGE_SUMMARY:
//                 {
//                     const obj = await this.webPageHelper(fileUri?.with({ path: removeExtension(fileUri.path, entityType) }));
//                     const value = obj[ContextPropertyKey.WEBPAGE as unknown as keyof Webpage];
//                     const index = findObjectIndexByProperty(this.previewEngineContext.webpages, ContextPropertyKey.WEBPAGE, value);
//                     if (index != -1 && this.previewEngineContext.webpages) {
//                         this.previewEngineContext.webpages[index] = obj;
//                     } else {
//                         this.previewEngineContext.webpages = await this.getWebpages();
//                     }
//                     break;
//                 }
//             case ContextProperty.WEB_TEMPLATE_YAML:
//             case ContextProperty.WEB_TEMPLATE_SOURCE:
//                 {
//                     const obj = await this.webTemplateHelper(fileUri?.with({ path: removeExtension(fileUri.path, entityType) }));
//                     const value = obj[ContextPropertyKey.WEB_TEMPLATE as unknown as keyof WebTemplate];
//                     const index = findObjectIndexByProperty(this.previewEngineContext.webTemplates, ContextPropertyKey.WEB_TEMPLATE, value);
//                     if (index != -1 && this.previewEngineContext.webTemplates) {
//                         this.previewEngineContext.webTemplates[index] = obj;
//                     } else {
//                         this.previewEngineContext.webTemplates = await this.getWebTemplates();
//                     }
//                     break;
//                 }
//             case ContextProperty.CONTENT_SNIPPET_YAML:
//             case ContextProperty.CONTENT_SNIPPET_VALUE:
//                 {
//                     const obj = await this.contentSnippetHelper(fileUri?.with({ path: removeExtension(fileUri.path, entityType) }));
//                     const value = obj[ContextPropertyKey.CONTENT_SNIPPET as unknown as keyof ContentSnippet];
//                     const index = findObjectIndexByProperty(this.previewEngineContext.contentSnippets, ContextPropertyKey.CONTENT_SNIPPET, value);
//                     if (index != -1 && this.previewEngineContext.contentSnippets) {
//                         this.previewEngineContext.contentSnippets[index] = obj;
//                     } else {
//                         this.previewEngineContext.contentSnippets = await this.getContentSnippets();
//                     }
//                     break;
//                 }
//             default:
//                 break;
//         }
//     }

//     private getEntityType = (filename: string): ContextProperty => {

//         if (filename.endsWith(ContextProperty.WEBSITE)) {
//             return ContextProperty.WEBSITE;
//         } else if (filename.endsWith(ContextProperty.SITE_SETTING)) {
//             return ContextProperty.SITE_SETTING;
//         } else if (filename.endsWith(ContextProperty.SITE_MARKER)) {
//             return ContextProperty.SITE_MARKER;
//         } else if (filename.endsWith(ContextProperty.ENTITY_FORM)) {
//             return ContextProperty.ENTITY_FORM;
//         } else if (filename.endsWith(ContextProperty.ENTITY_LIST)) {
//             return ContextProperty.ENTITY_LIST;
//         } else if (filename.endsWith(ContextProperty.WEB_FORM)) {
//             return ContextProperty.WEB_FORM;
//         } else if (filename.endsWith(ContextProperty.WEB_LINK)) {
//             return ContextProperty.WEB_LINK;
//         } else if (filename.endsWith(ContextProperty.WEB_LINK_SET)) {
//             return ContextProperty.WEB_LINK_SET;
//         } else if (filename.endsWith(ContextProperty.PAGE_TEMPLATE)) {
//             return ContextProperty.PAGE_TEMPLATE;
//         } else if (filename.endsWith(ContextProperty.WEB_TEMPLATE_YAML)) {
//             return ContextProperty.WEB_TEMPLATE_YAML;
//         } else if (filename.endsWith(ContextProperty.WEB_TEMPLATE_SOURCE)) {
//             return ContextProperty.WEB_TEMPLATE_SOURCE;
//         } else if (filename.endsWith(ContextProperty.WEBPAGE_YAML)) {
//             return ContextProperty.WEBPAGE_YAML;
//         } else if (filename.endsWith(ContextProperty.WEBPAGE_COPY)) {
//             return ContextProperty.WEBPAGE_COPY;
//         } else if (filename.endsWith(ContextProperty.WEBPAGE_CSS)) {
//             return ContextProperty.WEBPAGE_CSS;
//         } else if (filename.endsWith(ContextProperty.WEBPAGE_JS)) {
//             return ContextProperty.WEBPAGE_JS;
//         } else if (filename.endsWith(ContextProperty.WEBPAGE_SUMMARY)) {
//             return ContextProperty.WEBPAGE_SUMMARY;
//         } else if (filename.endsWith(ContextProperty.CONTENT_SNIPPET_YAML)) {
//             return ContextProperty.CONTENT_SNIPPET_YAML;
//         } else if (filename.endsWith(ContextProperty.CONTENT_SNIPPET_VALUE)) {
//             return ContextProperty.CONTENT_SNIPPET_VALUE;
//         } else {
//             return ContextProperty.UNKNOWN_PROPERTY;
//         }
//     }
// }
















































// export const treeView = () => {
//     const web = new PreviewEngineContext();
//     web.createContext();
//     console.log(web.getPreviewEngineContext());
// }

// export class PreviewEngineContext {
//     private previewEngineContext: IPreviewEngineContext;
//     private websiteRecord: Website;
//     private rootPath: vscode.Uri | null;
//     private isBootstrapV5: boolean;

//     constructor() {
//         this.isBootstrapV5 = false;
//         this.previewEngineContext = {};
//         this.rootPath = PortalWebView.getPortalRootFolder();
//         this.websiteRecord = {} as Website;
//     }

//     public createContext = async () => {
//         this.websiteRecord = await this.getWebsite();
//         this.previewEngineContext = await this.createEngineContext();
//     }

//     public getPreviewEngineContext = () => {
//         return this.previewEngineContext;
//     }

//     private createEngineContext = async (): Promise<IPreviewEngineContext> => {

//         if (this.rootPath) {
//             return {
//                 webpages: await this.getWebpages(),
//                 contentSnippets: await this.getContentSnippets(),
//                 webTemplates: await this.getWebTemplates(),
//                 siteMarkers: await this.getSiteMarker(),
//                 siteSettings: await this.getSiteSetting(),
//                 entityLists: await this.getEntityLists(),
//                 entityForms: await this.getEntityForms(),
//                 webForms: await this.getWebForms(),
//                 weblinks: await this.getWeblinks(),
//                 weblinkSets: await this.getWeblinkSets(),
//                 website: this.websiteRecord,
//                 pageTemplates: await this.getPageTemplates(),
//                 dataResolverExtras: {},
//                 resx: {},
//                 featureConfig: new Map(),
//                 entityAttributeMetadata: [] as IEntityAttributeMetadata[],
//                 lcid: '' as string,
//                 isBootstrapV5: this.isBootstrapV5,
//             }
//         } else return {}
//     }

//     private getWebsite = async (): Promise<Website> => {
//         const website = await vscode.workspace.fs.readFile(this.rootPath?.with({ path: this.rootPath.path + '/website.yml' }) || fallbackURI);
//         const websiteYaml = load(new TextDecoder().decode(website));
//         return websiteYaml as Website;
//     }

//     private webPageHelper = async (pageUri: vscode.Uri): Promise<Webpage> => {
//         const webpageYaml = await vscode.workspace.fs.readFile(pageUri?.with({ path: pageUri.path + '.webpage.yml' }));
//         const webpageJS = await vscode.workspace.fs.readFile(pageUri?.with({ path: pageUri.path + '.webpage.custom_javascript.js' }));
//         const webpageCSS = await vscode.workspace.fs.readFile(pageUri?.with({ path: pageUri.path + '.webpage.custom_css.css' }));
//         const webpageCopy = await vscode.workspace.fs.readFile(pageUri?.with({ path: pageUri.path + '.webpage.copy.html' }));
//         const webpageSummary = await vscode.workspace.fs.readFile(pageUri?.with({ path: pageUri.path + '.webpage.summary.html' }));
//         const webpageRecord = load(new TextDecoder().decode(webpageYaml)) as Webpage;
//         webpageRecord.adx_customcss = new TextDecoder().decode(webpageCSS);
//         webpageRecord.adx_customjavascript = new TextDecoder().decode(webpageJS);
//         webpageRecord.adx_copy = new TextDecoder().decode(webpageCopy);
//         webpageRecord.adx_summary = new TextDecoder().decode(webpageSummary);
//         webpageRecord.adx_websiteid = this.websiteRecord.adx_websiteid;
//         return webpageRecord;
//     }


//     private getWebpages = async (): Promise<Webpage[]> => {
//         const webpagesDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/web-pages' }) || fallbackURI);

//         const webpageArray: Webpage[] = [];
//         for (const webpage of webpagesDirectory) {
//             webpageArray.push(await this.webPageHelper(this.rootPath?.with({ path: this.rootPath.path + '/web-pages/' + webpage[0] + '/' + webpage[0] }) || fallbackURI));

//             const contentPageDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/web-pages/' + webpage[0] + '/content-pages' }) || fallbackURI);
//             for (const page of contentPageDirectory) {
//                 if (page[0].endsWith(ContextProperty.WEBPAGE_YAML)) {
//                     const pageName = page[0].slice(0, -12);
//                     webpageArray.push(await this.webPageHelper(this.rootPath?.with({ path: this.rootPath.path + '/web-pages/' + webpage[0] + '/content-pages/' + pageName }) || fallbackURI));
//                 }
//             }
//         }
//         return webpageArray;
//     }

//     private getWeblinks = async (): Promise<Weblink[]> => {
//         const weblinksDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/weblink-sets' }) || fallbackURI);

//         const weblinksArray: Weblink[] = [];
//         for (const link of weblinksDirectory) {
//             const linkSubDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/weblink-sets/' + link[0] }) || fallbackURI);
//             for (const sublink of linkSubDirectory) {
//                 if (sublink[0].endsWith(ContextProperty.WEB_LINK)) {
//                     const weblinkYaml = await vscode.workspace.fs.readFile(this.rootPath?.with({ path: this.rootPath.path + '/weblink-sets/' + link[0] + `/${sublink[0]}` }) || fallbackURI);
//                     const weblinkRecord = load(new TextDecoder().decode(weblinkYaml)) as Weblink[]
//                     weblinksArray.push(...weblinkRecord);
//                 }
//             }
//         }
//         return weblinksArray;
//     }

//     private webLinkSetHelper = async (fileUri: vscode.Uri): Promise<WeblinkSet> => {
//         const weblinkSetYaml = await vscode.workspace.fs.readFile(fileUri);
//         const weblinkSetRecord = load(new TextDecoder().decode(weblinkSetYaml)) as WeblinkSet;
//         weblinkSetRecord.adx_websiteid = this.websiteRecord.adx_websiteid;
//         return weblinkSetRecord;
//     };

//     private getWeblinkSets = async (): Promise<WeblinkSet[]> => {
//         const weblinkSetsDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/weblink-sets' }) || fallbackURI);

//         const weblinkSetsArray: WeblinkSet[] = [];
//         for (const weblinkSet of weblinkSetsDirectory) {
//             const linkSubDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/weblink-sets/' + weblinkSet[0] }) || fallbackURI);
//             for (const sublink of linkSubDirectory) {
//                 if (sublink[0].endsWith(ContextProperty.WEB_LINK_SET)) {
//                     weblinkSetsArray.push(await this.webLinkSetHelper(this.rootPath?.with({ path: this.rootPath.path + '/weblink-sets/' + weblinkSet[0] + `/${sublink[0]}` }) || fallbackURI)); // adx_title not in pac data but is manadatory, studio sends as undefined.
//                 }
//             }
//         }
//         return weblinkSetsArray;
//     }


//     private contentSnippetHelper = async (fileUri: vscode.Uri): Promise<ContentSnippet> => {
//         const snippetYaml = await vscode.workspace.fs.readFile(fileUri?.with({ path: fileUri.path + '.contentsnippet.yml' }));
//         const snippetValue = await vscode.workspace.fs.readFile(fileUri?.with({ path: fileUri.path + '.contentsnippet.value.html' }));
//         const snippetRecord = load(new TextDecoder().decode(snippetYaml)) as ContentSnippet
//         snippetRecord.adx_value = new TextDecoder().decode(snippetValue);
//         snippetRecord.adx_websiteid = '92d6c1b4-d84b-ee11-be6e-0022482d5cfb';
//         snippetRecord.stateCode = 0; //check with PAC SME on how to get this field
//         return snippetRecord;
//     };


//     private getContentSnippets = async (): Promise<ContentSnippet[]> => {
//         const contentSnippetsDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/content-snippets' }) || fallbackURI);

//         const contentSnippetsArray: ContentSnippet[] = [];
//         for (const contentSnippet of contentSnippetsDirectory) {
//             const snippetSubDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/content-snippets/' + contentSnippet[0] }) || fallbackURI);
//             for (const snippet of snippetSubDirectory) {
//                 if (snippet[0].endsWith(ContextProperty.CONTENT_SNIPPET_YAML)) {
//                     contentSnippetsArray.push(await this.contentSnippetHelper(this.rootPath?.with({ path: this.rootPath.path + '/content-snippets/' + contentSnippet[0] + `/${snippet[0].slice(0, -19)}` }) || fallbackURI));
//                 }
//             }
//         }
//         return contentSnippetsArray;
//     }

//     private pageTemplateHelper = async (fileUri: vscode.Uri): Promise<PageTemplate> => {
//         const pageTemplateYaml = await vscode.workspace.fs.readFile(fileUri);
//         const pageTemplateRecord = load(new TextDecoder().decode(pageTemplateYaml)) as PageTemplate;
//         return pageTemplateRecord;
//     };


//     private getPageTemplates = async (): Promise<PageTemplate[]> => {
//         const pageTemplatesDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/page-templates' }) || fallbackURI);

//         const pageTemplatesArray: PageTemplate[] = [];
//         for (const pageTemplate of pageTemplatesDirectory) {
//             pageTemplatesArray.push(await this.pageTemplateHelper(this.rootPath?.with({ path: this.rootPath.path + '/page-templates/' + pageTemplate[0] }) || fallbackURI));
//         }
//         return pageTemplatesArray;
//     }

//     private webTemplateHelper = async (fileUri: vscode.Uri): Promise<WebTemplate> => {
//         const webTemplateYaml = await vscode.workspace.fs.readFile(fileUri?.with({ path: fileUri.path + '.webtemplate.yml' }));
//         const webTemplateSource = await vscode.workspace.fs.readFile(fileUri?.with({ path: fileUri.path + '.webtemplate.source.html' }));
//         const webTemplateSourceHTML = new TextDecoder().decode(webTemplateSource);
//         const webTemplateRecord = load(new TextDecoder().decode(webTemplateYaml)) as WebTemplate;
//         webTemplateRecord.adx_source = webTemplateSourceHTML;
//         webTemplateRecord.adx_websiteid = this.websiteRecord.adx_websiteid;
//         return webTemplateRecord;
//     };

//     private getWebTemplates = async (): Promise<WebTemplate[]> => {
//         const webTemplatesDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/web-templates' }) || fallbackURI);

//         const webTemplatesArray: WebTemplate[] = [];
//         for (const webTemplate of webTemplatesDirectory) {
//             webTemplatesArray.push(await this.webTemplateHelper(this.rootPath?.with({ path: this.rootPath.path + '/web-templates/' + webTemplate[0] + `/${webTemplate[0]}` }) || fallbackURI));
//         }
//         return webTemplatesArray;
//     }

//     private entityFormHelper = async (fileUri: vscode.Uri): Promise<EntityForm> => {
//         const entityFormYaml = await vscode.workspace.fs.readFile(fileUri);
//         const entityFormRecord = load(new TextDecoder().decode(entityFormYaml)) as EntityForm;
//         entityFormRecord.adx_websiteid = this.websiteRecord.adx_websiteid;
//         return entityFormRecord;
//     };

//     private getEntityForms = async (): Promise<EntityForm[]> => {
//         const entityFormsDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/basic-forms' }) || fallbackURI);

//         const entityFormsArray: EntityForm[] = [];
//         for (const entityForm of entityFormsDirectory) {
//             entityFormsArray.push(await this.entityFormHelper(this.rootPath?.with({ path: this.rootPath.path + '/basic-forms/' + entityForm[0] + `/${entityForm[0]}.basicform.yml` }) || fallbackURI));
//         }
//         return entityFormsArray;
//     }

//     private entityListHelper = async (fileUri: vscode.Uri): Promise<EntityList> => {
//         const entityListYaml = await vscode.workspace.fs.readFile(fileUri);
//         const entityListRecord = load(new TextDecoder().decode(entityListYaml)) as EntityList;
//         entityListRecord.adx_websiteid = this.websiteRecord.adx_websiteid;
//         return entityListRecord;
//     };

//     private getEntityLists = async (): Promise<EntityList[]> => {
//         const entityListsDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/lists' }) || fallbackURI);

//         const entityListsArray: EntityList[] = [];
//         for (const entityList of entityListsDirectory) {
//             if (entityList[0].endsWith(ContextProperty.ENTITY_LIST)) {
//                 entityListsArray.push(await this.entityListHelper(this.rootPath?.with({ path: this.rootPath.path + '/lists/' + entityList[0] }) || fallbackURI));
//             }
//         }
//         return entityListsArray;
//     }

//     private webFormHelper = async (fileUri: vscode.Uri): Promise<WebForm> => {
//         const webFormYaml = await vscode.workspace.fs.readFile(fileUri);
//         const webFormRecord = load(new TextDecoder().decode(webFormYaml)) as WebForm;
//         webFormRecord.adx_websiteid = this.websiteRecord.adx_websiteid;
//         return webFormRecord;
//     };


//     private getWebForms = async (): Promise<WebForm[]> => {
//         const webFormsDirectory = await vscode.workspace.fs.readDirectory(this.rootPath?.with({ path: this.rootPath.path + '/advanced-forms' }) || fallbackURI);

//         const webFormsArray: WebForm[] = [];
//         for (const webForm of webFormsDirectory) {
//             webFormsArray.push(await this.webFormHelper(this.rootPath?.with({ path: this.rootPath.path + '/advanced-forms/' + webForm[0] + `/${webForm[0]}.advancedform.yml` }) || fallbackURI));
//         }
//         return webFormsArray;
//     }

//     private getSiteSetting = async (): Promise<SiteSetting[]> => {
//         const siteSetting = await vscode.workspace.fs.readFile(this.rootPath?.with({ path: this.rootPath.path + '/sitesetting.yml' }) || fallbackURI);
//         const siteSettingYaml = load(new TextDecoder().decode(siteSetting)) as SiteSetting[];
//         const siteSettingRecords = siteSettingYaml.map((siteSettingRecord) => {
//             if (siteSettingRecord.adx_name === BootstrapSiteSetting) {
//                 this.isBootstrapV5 = siteSettingRecord.adx_value ? String(siteSettingRecord.adx_value).toLowerCase() === 'true' : false;
//             }
//             return {
//                 adx_websiteid: this.websiteRecord.adx_websiteid,
//                 adx_name: siteSettingRecord.adx_name,
//                 adx_value: siteSettingRecord.adx_value,
//                 adx_sitesettingid: siteSettingRecord.adx_sitesettingid,
//             }
//         });
//         return siteSettingRecords;
//     }

//     private getSiteMarker = async (): Promise<SiteMarker[]> => {
//         const siteMarker = await vscode.workspace.fs.readFile(this.rootPath?.with({ path: this.rootPath.path + '/sitemarker.yml' }) || fallbackURI);
//         const siteMarkerYaml = load(new TextDecoder().decode(siteMarker)) as SiteMarker[];
//         const siteMarkerRecords = siteMarkerYaml.map((siteMarkerRecord) => {
//             return {
//                 adx_name: siteMarkerRecord.adx_name as string,
//                 adx_pageid: siteMarkerRecord.adx_pageid as string,
//                 adx_sitemarkerid: siteMarkerRecord.adx_sitemarkerid,
//                 adx_websiteid: this.websiteRecord.adx_websiteid,

//             }

//         });
//         return siteMarkerRecords;
//     }

//     public updateContext = async () => {
//         const fileUri = vscode.window.activeTextEditor?.document.uri || fallbackURI;
//         const fileName = getFileProperties(fileUri.path).fileCompleteName;
//         if (!fileName) {
//             // TODO: Handle this scenario
//             return;
//         }
//         // Check entity type
//         const entityType: ContextProperty = this.getEntityType(fileName);

//         switch (entityType) {
//             case ContextProperty.SITE_MARKER:
//                 this.previewEngineContext.siteMarkers = await this.getSiteMarker();
//                 break;
//             case ContextProperty.SITE_SETTING:
//                 this.previewEngineContext.siteSettings = await this.getSiteSetting();
//                 break;
//             case ContextProperty.WEBSITE:
//                 {
//                     const websiteObj = await this.getWebsite();
//                     if (websiteObj?.adx_websiteid === this.websiteRecord?.adx_websiteid) {
//                         this.websiteRecord = websiteObj;
//                     }
//                     else {
//                         this.websiteRecord = websiteObj;
//                         this.previewEngineContext = await this.createEngineContext();
//                     }
//                     break;
//                 }
//             case ContextProperty.WEB_LINK:
//                 this.previewEngineContext.weblinks = await this.getWeblinks();
//                 break;
//             case ContextProperty.WEB_LINK_SET: {
//                 const obj = await this.webLinkSetHelper(fileUri);
//                 const value = obj[ContextPropertyKey.WEB_LINK_SET as unknown as keyof WeblinkSet];
//                 const index = findObjectIndexByProperty(this.previewEngineContext.weblinkSets, ContextPropertyKey.WEB_LINK_SET, value);
//                 if (index != -1 && this.previewEngineContext.weblinkSets) {
//                     this.previewEngineContext.weblinkSets[index] = obj;
//                 } else {
//                     this.previewEngineContext.weblinkSets = await this.getWeblinkSets();
//                 }
//                 break;
//             }
//             case ContextProperty.ENTITY_FORM:
//                 {
//                     const obj = await this.entityFormHelper(fileUri);
//                     const value = obj[ContextPropertyKey.ENTITY_FORM as unknown as keyof EntityForm];
//                     const index = findObjectIndexByProperty(this.previewEngineContext.entityForms, ContextPropertyKey.ENTITY_FORM, value);
//                     if (index != -1 && this.previewEngineContext.entityForms) {
//                         this.previewEngineContext.entityForms[index] = obj;
//                     } else {
//                         this.previewEngineContext.entityForms = await this.getEntityForms();
//                     }
//                     break;
//                 }
//             case ContextProperty.ENTITY_LIST:
//                 {
//                     const obj = await this.entityListHelper(fileUri);
//                     const value = obj[ContextPropertyKey.ENTITY_LIST as unknown as keyof EntityList];
//                     const index = findObjectIndexByProperty(this.previewEngineContext.entityLists, ContextPropertyKey.ENTITY_LIST, value);
//                     if (index != -1 && this.previewEngineContext.entityLists) {
//                         this.previewEngineContext.entityLists[index] = obj;
//                     } else {
//                         this.previewEngineContext.entityLists = await this.getEntityLists();
//                     }
//                     break;
//                 }
//             case ContextProperty.WEB_FORM:
//                 {
//                     const obj = await this.webFormHelper(fileUri);
//                     const value = obj[ContextPropertyKey.WEB_FORM as unknown as keyof WebForm];
//                     const index = findObjectIndexByProperty(this.previewEngineContext.webForms, ContextPropertyKey.WEB_FORM, value);
//                     if (index != -1 && this.previewEngineContext.webForms) {
//                         this.previewEngineContext.webForms[index] = obj;
//                     } else {
//                         this.previewEngineContext.webForms = await this.getWebForms();
//                     }
//                     break;
//                 }
//             case ContextProperty.PAGE_TEMPLATE:
//                 {
//                     const obj = await this.pageTemplateHelper(fileUri);
//                     const value = obj[ContextPropertyKey.PAGE_TEMPLATE as unknown as keyof PageTemplate];
//                     const index = findObjectIndexByProperty(this.previewEngineContext.pageTemplates, ContextPropertyKey.PAGE_TEMPLATE, value);
//                     if (index != -1 && this.previewEngineContext.pageTemplates) {
//                         this.previewEngineContext.pageTemplates[index] = obj;
//                     } else {
//                         this.previewEngineContext.pageTemplates = await this.getPageTemplates();
//                     }
//                     break;
//                 }
//             case ContextProperty.WEBPAGE_YAML:
//             case ContextProperty.WEBPAGE_COPY:
//             case ContextProperty.WEBPAGE_CSS:
//             case ContextProperty.WEBPAGE_JS:
//             case ContextProperty.WEBPAGE_SUMMARY:
//                 {
//                     const obj = await this.webPageHelper(fileUri?.with({ path: removeExtension(fileUri.path, entityType) }));
//                     const value = obj[ContextPropertyKey.WEBPAGE as unknown as keyof Webpage];
//                     const index = findObjectIndexByProperty(this.previewEngineContext.webpages, ContextPropertyKey.WEBPAGE, value);
//                     if (index != -1 && this.previewEngineContext.webpages) {
//                         this.previewEngineContext.webpages[index] = obj;
//                     } else {
//                         this.previewEngineContext.webpages = await this.getWebpages();
//                     }
//                     break;
//                 }
//             case ContextProperty.WEB_TEMPLATE_YAML:
//             case ContextProperty.WEB_TEMPLATE_SOURCE:
//                 {
//                     const obj = await this.webTemplateHelper(fileUri?.with({ path: removeExtension(fileUri.path, entityType) }));
//                     const value = obj[ContextPropertyKey.WEB_TEMPLATE as unknown as keyof WebTemplate];
//                     const index = findObjectIndexByProperty(this.previewEngineContext.webTemplates, ContextPropertyKey.WEB_TEMPLATE, value);
//                     if (index != -1 && this.previewEngineContext.webTemplates) {
//                         this.previewEngineContext.webTemplates[index] = obj;
//                     } else {
//                         this.previewEngineContext.webTemplates = await this.getWebTemplates();
//                     }
//                     break;
//                 }
//             case ContextProperty.CONTENT_SNIPPET_YAML:
//             case ContextProperty.CONTENT_SNIPPET_VALUE:
//                 {
//                     const obj = await this.contentSnippetHelper(fileUri?.with({ path: removeExtension(fileUri.path, entityType) }));
//                     const value = obj[ContextPropertyKey.CONTENT_SNIPPET as unknown as keyof ContentSnippet];
//                     const index = findObjectIndexByProperty(this.previewEngineContext.contentSnippets, ContextPropertyKey.CONTENT_SNIPPET, value);
//                     if (index != -1 && this.previewEngineContext.contentSnippets) {
//                         this.previewEngineContext.contentSnippets[index] = obj;
//                     } else {
//                         this.previewEngineContext.contentSnippets = await this.getContentSnippets();
//                     }
//                     break;
//                 }
//             default:
//                 break;
//         }
//     }

//     private getEntityType = (filename: string): ContextProperty => {

//         if (filename.endsWith(ContextProperty.WEBSITE)) {
//             return ContextProperty.WEBSITE;
//         } else if (filename.endsWith(ContextProperty.SITE_SETTING)) {
//             return ContextProperty.SITE_SETTING;
//         } else if (filename.endsWith(ContextProperty.SITE_MARKER)) {
//             return ContextProperty.SITE_MARKER;
//         } else if (filename.endsWith(ContextProperty.ENTITY_FORM)) {
//             return ContextProperty.ENTITY_FORM;
//         } else if (filename.endsWith(ContextProperty.ENTITY_LIST)) {
//             return ContextProperty.ENTITY_LIST;
//         } else if (filename.endsWith(ContextProperty.WEB_FORM)) {
//             return ContextProperty.WEB_FORM;
//         } else if (filename.endsWith(ContextProperty.WEB_LINK)) {
//             return ContextProperty.WEB_LINK;
//         } else if (filename.endsWith(ContextProperty.WEB_LINK_SET)) {
//             return ContextProperty.WEB_LINK_SET;
//         } else if (filename.endsWith(ContextProperty.PAGE_TEMPLATE)) {
//             return ContextProperty.PAGE_TEMPLATE;
//         } else if (filename.endsWith(ContextProperty.WEB_TEMPLATE_YAML)) {
//             return ContextProperty.WEB_TEMPLATE_YAML;
//         } else if (filename.endsWith(ContextProperty.WEB_TEMPLATE_SOURCE)) {
//             return ContextProperty.WEB_TEMPLATE_SOURCE;
//         } else if (filename.endsWith(ContextProperty.WEBPAGE_YAML)) {
//             return ContextProperty.WEBPAGE_YAML;
//         } else if (filename.endsWith(ContextProperty.WEBPAGE_COPY)) {
//             return ContextProperty.WEBPAGE_COPY;
//         } else if (filename.endsWith(ContextProperty.WEBPAGE_CSS)) {
//             return ContextProperty.WEBPAGE_CSS;
//         } else if (filename.endsWith(ContextProperty.WEBPAGE_JS)) {
//             return ContextProperty.WEBPAGE_JS;
//         } else if (filename.endsWith(ContextProperty.WEBPAGE_SUMMARY)) {
//             return ContextProperty.WEBPAGE_SUMMARY;
//         } else if (filename.endsWith(ContextProperty.CONTENT_SNIPPET_YAML)) {
//             return ContextProperty.CONTENT_SNIPPET_YAML;
//         } else if (filename.endsWith(ContextProperty.CONTENT_SNIPPET_VALUE)) {
//             return ContextProperty.CONTENT_SNIPPET_VALUE;
//         } else {
//             return ContextProperty.UNKNOWN_PROPERTY;
//         }
//     }
// }