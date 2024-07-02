/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
const { Tokenizer } = require('liquidjs')
import * as path from "path";
import * as vscode from 'vscode';
import { IPreviewEngineContext } from './TreeView/Utils/IDataResolver';
import { Webpage } from './TreeView/Types/Entity/WebPage';
import { Website } from './TreeView/Types/Entity/Website';
import { WebTemplate } from './TreeView/Types/Entity/WebTemplate';
import { PageTemplate } from './TreeView/Types/Entity/PageTemplate';
import { WebFile } from "./TreeView/Types/Entity/WebFile";
import { ContentSnippet } from "./TreeView/Types/Entity/ContentSnippet";
import { EntityForm } from "./TreeView/Types/Entity/EntityForm";
import { EntityList } from "./TreeView/Types/Entity/EntityList";
import { WebForm } from "./TreeView/Types/Entity/WebForm";
import { SiteMarker } from "./TreeView/Types/Entity/SiteMarker";
import { SiteSetting } from "./TreeView/Types/Entity/SiteSettings";
import { Weblink } from "./TreeView/Types/Entity/Weblink";
import { WeblinkSet } from "./TreeView/Types/Entity/WeblinkSet";
import { PortalWebView } from '../client/PortalWebView';
import { BootstrapSiteSetting, ContextProperty } from './TreeView/Utils/Constant';
import { createTree } from './TreeViewProvider';
import { IItem } from './TreeView/Types/Entity/IItem';
import { getDependencies } from './DataParser';
import { PortalComponentServiceFactory } from "./dataMapperServices/PortalComponentServiceFactory";

const fs = require('fs');
const yaml = require("js-yaml");
const load = yaml.load;
const fallbackURI = vscode.Uri.file('');

const entityFileMap: Map<string, Set<string>> = new Map();

export const treeView = async () => {
  const previewHelper = new PreviewHelper();
  try {
    await previewHelper.createContext();
    const getPath = await previewHelper.getPath();
    const IPortalMetadataContext = await previewHelper.getPreviewHelper();
    console.log(IPortalMetadataContext);
    const web = await previewHelper.web();
    const { allwebTemplate, allwebPage, allwebFile, allcontentSnippet, alllist, allentityForm, allwebForm } = convertAllMetadataToItems(IPortalMetadataContext, getPath);
    const websiteIItem = await createWebsiteItem(previewHelper);
    const { webtemplateIItem, webPageIItem, webFileIItem, contentSnippetIItem, listIItem, entityFormtIItem, webFormIItem, unUsedFileIItem } = createIndividualItems(allwebTemplate, allwebPage, allwebFile, allcontentSnippet, alllist, allentityForm, allwebForm);
    addWebfileToWebPage(IPortalMetadataContext, allwebPage, allwebFile);
    addDependencies(webtemplateIItem, webPageIItem, webFileIItem, contentSnippetIItem, listIItem, entityFormtIItem, webFormIItem);
    console.log(entityFileMap);

    addUnUsedFiles(unUsedFileIItem, webtemplateIItem, contentSnippetIItem, listIItem, entityFormtIItem, webFormIItem);

    webPageIItem.children = webPageIItem.children.filter(item => item.label === "Home");
    (websiteIItem.children as IItem[]).push(webtemplateIItem, webPageIItem, webFileIItem, contentSnippetIItem, listIItem, entityFormtIItem, webFormIItem, unUsedFileIItem);

    console.log(websiteIItem);
    createTree(websiteIItem);

  } catch (error) {
    console.error('Error:', error);
  }
};

function convertAllMetadataToItems(IPortalMetadataContext: any, getPath: any) {
  const allwebTemplate = PortalComponentServiceFactory.getPortalComponent("WebTemplate")?.create(IPortalMetadataContext, getPath) || [];
  const allwebPage = PortalComponentServiceFactory.getPortalComponent("WebPage")?.create(IPortalMetadataContext, getPath) || [];
  const allwebFile = PortalComponentServiceFactory.getPortalComponent("WebFile")?.create(IPortalMetadataContext, getPath) || [];
  const allcontentSnippet = PortalComponentServiceFactory.getPortalComponent("Content Snippet")?.create(IPortalMetadataContext, getPath) || [];
  const alllist = PortalComponentServiceFactory.getPortalComponent("List")?.create(IPortalMetadataContext, getPath) || [];
  const allentityForm = PortalComponentServiceFactory.getPortalComponent("EntityForm")?.create(IPortalMetadataContext, getPath) || [];
  const allwebForm = PortalComponentServiceFactory.getPortalComponent("WebForm")?.create(IPortalMetadataContext, getPath) || [];
  return { allwebTemplate, allwebPage, allwebFile, allcontentSnippet, alllist, allentityForm, allwebForm };
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
    component: "1",
    children: [],
    error: ""
  };
}

function createIndividualItems(allwebTemplate: IItem[], allwebPage: IItem[], allwebFile: IItem[], allcontentSnippet: IItem[], alllist: IItem[], allentityForm: IItem[], allwebForm: IItem[]) {
  const webtemplateIItem = {
    label: 'Web Template',
    title: 'Web Template',
    id: '',
    isFile: false,
    content: "",
    path: vscode.Uri.parse(`/WebTemplate`),
    component: "8",
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
    component: "2",
    children: allwebPage,
    error: ""
  };

  const webFileIItem = {
    label: 'Web File',
    title: 'Web File',
    id: '',
    isFile: false,
    content: "",
    path: vscode.Uri.parse(`/webFile`),
    component: "3",
    children: allwebFile,
    error: ""
  };
  const contentSnippetIItem = {
    label: 'Content Snippet',
    title: 'Content Snippet',
    id: '',
    isFile: false,
    content: "",
    path: vscode.Uri.parse(`/contentSnippet`),
    component: "7",
    children: allcontentSnippet,
    error: ""
  };
  const listIItem = {
    label: 'Lists',
    title: 'Lists',
    id: '',
    isFile: false,
    content: "",
    path: vscode.Uri.parse(`/lists`),
    component: "17",
    children: alllist,
    error: ""
  };

  const entityFormtIItem = {
    label: 'Basic Forms',
    title: 'Basic Forms',
    id: '',
    isFile: false,
    content: "",
    path: vscode.Uri.parse(`/basic-forms`),
    component: "15",
    children: allentityForm,
    error: ""
  };

  const webFormIItem = {
    label: 'Advanced Forms',
    title: 'Advanced Forms',
    id: '',
    isFile: false,
    content: "",
    path: vscode.Uri.parse(`/advanced-forms`),
    component: "19",
    children: allwebForm,
    error: ""
  };
  const unUsedFileIItem = {
    label: 'Unused Components',
    title: 'Unused Components',
    id: '',
    isFile: false,
    content: "",
    path: vscode.Uri.parse(`/unused-files`),
    component: "",
    children: [],
    error: ""
  };


  return { webtemplateIItem, webPageIItem, webFileIItem, contentSnippetIItem, listIItem, entityFormtIItem, webFormIItem, unUsedFileIItem };
}

function addWebfileToWebPage(metadataContext: IPreviewEngineContext, webPageIItem: IItem[], webFileIItem: IItem[]) {
  const items: IItem[] = [];
  const webfile: WebFile[] | undefined = metadataContext.webFiles;

  if (!webfile) {
    return items;
  }
  webfile.forEach(file => {
    webPageIItem.forEach(item => {
      if (file.adx_parentpageid == item.id) {
        webFileIItem.forEach(it => {
          if (it.id == file.adx_webfileid) {
            let webfileItem = item.children.find(child => child.label === "Web File");
            if (!webfileItem) {
              let webFile = createItem('Web File', 'Web File', '', false, vscode.Uri.parse(`/webFile`), "3", [it]);
              item.children.push(webFile);
            } else {
              webfileItem.children.push(it);
            }
          }
        })
      }
    });
  });
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

function addDependencies(webtemplateIItem: IItem, webPageIItem: IItem, webFileIItem: IItem, contentSnippetIItem: IItem, listIItem: IItem, entityFormtIItem: IItem, webFormIItem: IItem): any {
  addDependenciesToIItem(webtemplateIItem, contentSnippetIItem, webtemplateIItem, entityFormtIItem, listIItem, webFormIItem);
  addDependenciesToWebPage(webPageIItem, contentSnippetIItem, webtemplateIItem, entityFormtIItem, listIItem, webFormIItem);
  addDependenciesToIItem(contentSnippetIItem, contentSnippetIItem, webtemplateIItem, entityFormtIItem, listIItem, webFormIItem);
  addDependenciesToIItem(listIItem, contentSnippetIItem, webtemplateIItem, entityFormtIItem, listIItem, webFormIItem);
  addDependenciesToIItem(entityFormtIItem, contentSnippetIItem, webtemplateIItem, entityFormtIItem, listIItem, webFormIItem)
}

function addDependenciesToIItem(entityIItem: IItem, contentSnippetIItem: IItem, webtemplateIItem: IItem, entityFormtIItem: IItem, listIItem: IItem, webFormIItem: IItem): any {
  entityIItem.children.forEach((item: IItem) => {
    let sourceDep = item.children.find((child: IItem) => child.isFile === false);
    if (!sourceDep) {
      sourceDep = createItem(`Uses & UsedBy ${item.label}`, `Uses & UsedBy ${item.label}`, '', false, vscode.Uri.parse(''), "", [], "");
    }
    const htOrJsFile = item.children.find((child: IItem) => child.isFile === true);
    const filePath = htOrJsFile?.path?.fsPath;
    if (filePath && sourceDep) {
      processDependencies(sourceDep, filePath, contentSnippetIItem, webtemplateIItem, entityFormtIItem, listIItem, webFormIItem);
    } else {
      console.log('No valid file path found for:', item);
    }
    if (sourceDep.children.length != 0) {
      item.children.push(sourceDep);
    }
  });
}

function addDependenciesToWebPage(webPageIItem: IItem, contentSnippetIItem: IItem, webtemplateIItem: IItem, entityFormtIItem: IItem, listIItem: IItem, webFormIItem: IItem): any {
  webPageIItem.children.forEach((item: IItem) => {
    const pgcy = item.children.find(child => child.label === "Page Copy");
    const pgsy = item.children.find(child => child.label === "Page Summary");
    const cp = item.children.find(child => child.label === "Content Page")
    const cppgcy = cp?.children.find(child => child.label === "Page Copy");
    const cppgsy = cp?.children.find(child => child.label === "Page Summary");
    const cpjsfile = cp?.children.find((child: IItem) => child.label.endsWith('.js'));
    const jsfile = item.children.find((child: IItem) => child.label.endsWith('.js'));

    handleChildItem(pgcy, contentSnippetIItem, webtemplateIItem, entityFormtIItem, listIItem, webFormIItem, jsfile);
    handleChildItem(pgsy, contentSnippetIItem, webtemplateIItem, entityFormtIItem, listIItem, webFormIItem, jsfile);
    handleChildItem(cppgcy, contentSnippetIItem, webtemplateIItem, entityFormtIItem, listIItem, webFormIItem, cpjsfile);
    handleChildItem(cppgsy, contentSnippetIItem, webtemplateIItem, entityFormtIItem, listIItem, webFormIItem, cpjsfile);
  });
}

function handleChildItem(child: IItem | undefined, contentSnippetIItem: IItem, webtemplateIItem: IItem, entityFormtIItem: IItem, listIItem: IItem, webFormIItem: IItem, jsfile?: IItem) {
  if (child) {
    const ht = child.children.find((child: IItem) => child.isFile === true);
    const filePath = ht?.path?.fsPath;
    const jsFilePath = jsfile?.path?.fsPath;
    let sourceDep = child.children.find((child: IItem) => child.isFile === false);

    if (!sourceDep) {
      sourceDep = createItem("Dependencies", "Dependencies", '', false, vscode.Uri.parse(''), "", [], "");
    }
    if (filePath && sourceDep) {
      processDependencies(sourceDep, filePath, contentSnippetIItem, webtemplateIItem, entityFormtIItem, listIItem, webFormIItem, jsFilePath);
    } else {
      console.log('No valid file path or sourceDep found for:', child);
    }
    if (sourceDep.children.length != 0) {
      child.children.push(sourceDep);
    }
  }
}

function processDependencies(sourceDep: IItem, filePath: string, contentSnippetIItem: IItem, webtemplateIItem: IItem, entityFormtIItem: IItem, listIItem: IItem, webFormIItem: IItem, jsFilePath?: string) {
  const data = fs.readFileSync(filePath, 'utf8');
  const dependencies = getDependencies(data);
  if (jsFilePath) {
    const jsdata = fs.readFileSync(jsFilePath, 'utf8');
    const jsdependencies = getDependencies(jsdata)
    dependencies.push(...jsdependencies);
  }

  dependencies.forEach((entity: any) => {
    const templateName = entity.templateName.replace(/^['"](.*)['"]$/, '$1');
    const hashName = entity.hashName.replace(/^['"](.*)['"]$/, '$1');
    const hashValue = entity.hashValue.replace(/^['"](.*)['"]$/, '$1');

    if (templateName === "snippets" || templateName === "snippet" || (templateName === 'editable' && (hashName === "snippets" || hashName === "snippet"))) {
      processEntity(sourceDep, contentSnippetIItem, entity, 'label');
    } else if (templateName === "Template") {
      processEntity(sourceDep, webtemplateIItem, entity, 'label');
    } else if (templateName === "entityform" || templateName === "entity_form") {
      if (hashName == 'id' && isNaN(hashValue)) {
        processEntity(sourceDep, entityFormtIItem, entity, 'id');
      } else if (hashName == 'name' || hashName == 'key') {
        processEntity(sourceDep, entityFormtIItem, entity, 'label')
      } else {
        console.log("Not Valid EnitityForm");
      }
    } else if (templateName === "entitylist" || templateName === "entity_list") {
      if (hashName == 'id' && isNaN(hashValue)) {
        processEntity(sourceDep, listIItem, entity, 'id');
      } else if (hashName == 'name' || hashName == 'key') {
        processEntity(sourceDep, listIItem, entity, 'label')
      } else {
        console.log("Not Valid EntityList");
      }
    } else if (templateName === "webform") {
      if (hashName == 'id' && isNaN(hashValue)) {
        processEntity(sourceDep, webFormIItem, entity, 'id');
      } else if (hashName == 'name' || hashName == 'key') {
        processEntity(sourceDep, webFormIItem, entity, 'label')
      } else {
        console.log("Not Valid WebForm");
      }
    } else if ((templateName != "entityform" && templateName != "entity_form") && (templateName != "entitylist" && templateName != "entity_list")) {
      entity.hashValue = templateName;
      processEntity(sourceDep, webtemplateIItem, entity, 'label');
    } else {
      console.log("Another Dynamic entity");
    }
  });
}

function processEntity(sourceDep: IItem, targetIItem: IItem, entity: any, compareBy: string) {
  targetIItem.children.forEach((targetItem: IItem) => {
    const hv = entity.hashValue.replace(/^['"](.*)['"]$/, '$1');
    const compareValue = compareBy === 'label' ? targetItem.label : targetItem.id;
    if (compareValue === hv) {
      let ht = targetItem.children.find((child: IItem) => child.isFile === true);
      let htalready = sourceDep.children.find(child => child.label === ht?.label);
      let htLabel = ht?.label ?? '';
      if (!entityFileMap.has(targetIItem.label)) {
        entityFileMap.set(targetIItem.label, new Set());
      }
      entityFileMap.get(targetIItem.label)?.add(htLabel);
      if (ht && !htalready) {
        sourceDep.children.push(ht);
      }
    }
  });
}

function addUnUsedFiles(unUsedFileIItem: IItem, webtemplateIItem: IItem, contentSnippetIItem: IItem, listIItem: IItem, entityFormtIItem: IItem, webFormIItem: IItem) {
  addUnusedFilesHelper('Web Template', unUsedFileIItem, webtemplateIItem, '/WebTemplate', "8");
  addUnusedFilesHelper('Content Snippet', unUsedFileIItem, contentSnippetIItem, '/contentSnippet', "7");
  addUnusedFilesHelper('Lists', unUsedFileIItem, listIItem, '/lists', "17");
  addUnusedFilesHelper('Basic Forms', unUsedFileIItem, entityFormtIItem, '/basic-forms', "15");
  addUnusedFilesHelper('Advanced Forms', unUsedFileIItem, webFormIItem, '/advanced-forms', "19");
}

function addUnusedFilesHelper(entityType: string, unusedFileIItem: IItem, entityIItem: IItem, folderPath: string, order: string) {
  const usedEntityFiles = entityFileMap.get(entityType);
  entityIItem.children.forEach((item: IItem) => {
    const file = item.children.find((child: IItem) => child.isFile === true);
    if (file && !usedEntityFiles?.has(file.label)) {
      let entityPresent = unusedFileIItem.children.find(child => child.label === entityType);
      if (entityPresent) {
        entityPresent.children.push(file);
      } else {
        entityPresent = createItem(entityType, entityType, '', false, vscode.Uri.parse(folderPath), order, []);
        entityPresent.children.push(file);
        unusedFileIItem.children.push(entityPresent);
      }
    }
  });
}

export class PreviewHelper {
  private pathroot: vscode.Uri | null;
  private previewHelper: IPreviewEngineContext;
  private websiteData: Website;
  private isBootstrapV5: boolean;


  constructor() {
    this.isBootstrapV5 = false;
    this.previewHelper = {};
    // this.pathroot = PortalWebView.getPortalRootFolder();
    this.pathroot = vscode.Uri.file('C:/Users/t-mansisingh/OneDrive - Microsoft/Desktop/clone2/mansi-site-1---site-ajx90');
    this.websiteData = {} as Website;
  }

  public createContext = async () => {
    this.websiteData = await this.getWebsite();
    this.previewHelper = await this.createEngineContext();
  }
  public getPath = async () => {
    return this.pathroot;
  }

  public web = async () => {
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
        webFiles: await this.getWebFiles(),
        contentSnippets: await this.getContentSnippets(),
        entityLists: await this.getEntityLists(),
        entityForms: await this.getEntityForms(),
        webForms: await this.getWebForms(),
        siteMarkers: await this.getSiteMarker(),
        siteSettings: await this.getSiteSetting(),
        weblinks: await this.getWeblinks(),
        weblinkSets: await this.getWeblinkSets(),
        website: this.websiteData,
        isBootstrapV5: this.isBootstrapV5,
        // dataResolverExtras: {},
        // resx: {},
        // featureConfig: new Map(),
        // entityAttributeMetadata: [] as IEntityAttributeMetadata[],
        // lcid: '' as string,
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

  private webFileHelper = async (fileUri: vscode.Uri): Promise<WebFile> => {
    const webFileYaml = await vscode.workspace.fs.readFile(fileUri);
    const webFileRecord = load(new TextDecoder().decode(webFileYaml)) as WebFile;
    return webFileRecord;
  };

  private getWebFiles = async (): Promise<WebFile[]> => {
    const webFilesDirectory = await vscode.workspace.fs.readDirectory(this.pathroot?.with({ path: this.pathroot.path + '/web-files' }) || fallbackURI);
    const webFilesArray: WebFile[] = [];
    for (const webFile of webFilesDirectory) {
      if (webFile[0].endsWith("webfile.yml")) {
        webFilesArray.push(await this.webFileHelper(this.pathroot?.with({ path: this.pathroot.path + '/web-files/' + `/${webFile[0]}` }) || fallbackURI));
      }
    }
    return webFilesArray;
  }

  private contentSnippetHelper = async (fileUri: vscode.Uri): Promise<ContentSnippet> => {
    const snippetYaml = await vscode.workspace.fs.readFile(fileUri?.with({ path: fileUri.path + '.contentsnippet.yml' }));
    const snippetValue = await vscode.workspace.fs.readFile(fileUri?.with({ path: fileUri.path + '.contentsnippet.value.html' }));
    const snippetRecord = load(new TextDecoder().decode(snippetYaml)) as ContentSnippet
    snippetRecord.adx_value = new TextDecoder().decode(snippetValue);
    snippetRecord.adx_websiteid = this.websiteData.adx_websiteid;
    snippetRecord.stateCode = 0;
    return snippetRecord;
  };

  private getContentSnippets = async (): Promise<ContentSnippet[]> => {
    const contentSnippetsDirectory = await vscode.workspace.fs.readDirectory(this.pathroot?.with({ path: this.pathroot.path + '/content-snippets' }) || fallbackURI);
    const contentSnippetsArray: ContentSnippet[] = [];
    for (const contentSnippet of contentSnippetsDirectory) {
      const snippetSubDirectory = await vscode.workspace.fs.readDirectory(this.pathroot?.with({ path: this.pathroot.path + '/content-snippets/' + contentSnippet[0] }) || fallbackURI);
      for (const snippet of snippetSubDirectory) {
        if (snippet[0].endsWith(ContextProperty.CONTENT_SNIPPET_YAML)) {
          contentSnippetsArray.push(await this.contentSnippetHelper(this.pathroot?.with({ path: this.pathroot.path + '/content-snippets/' + contentSnippet[0] + `/${snippet[0].slice(0, -19)}` }) || fallbackURI));
        }
      }
    }
    return contentSnippetsArray;
  }

  private entityFormHelper = async (fileUri: vscode.Uri): Promise<EntityForm> => {
    const entityFormYaml = await vscode.workspace.fs.readFile(fileUri);
    const entityFormRecord = load(new TextDecoder().decode(entityFormYaml)) as EntityForm;
    entityFormRecord.adx_websiteid = this.websiteData.adx_websiteid;
    return entityFormRecord;
  };

  private getEntityForms = async (): Promise<EntityForm[]> => {
    const entityFormsDirectory = await vscode.workspace.fs.readDirectory(this.pathroot?.with({ path: this.pathroot.path + '/basic-forms' }) || fallbackURI);

    const entityFormsArray: EntityForm[] = [];
    for (const entityForm of entityFormsDirectory) {
      entityFormsArray.push(await this.entityFormHelper(this.pathroot?.with({ path: this.pathroot.path + '/basic-forms/' + entityForm[0] + `/${entityForm[0]}.basicform.yml` }) || fallbackURI));
    }
    return entityFormsArray;
  }

  private entityListHelper = async (fileUri: vscode.Uri): Promise<EntityList> => {
    const entityListYaml = await vscode.workspace.fs.readFile(fileUri);
    const entityListRecord = load(new TextDecoder().decode(entityListYaml)) as EntityList;
    entityListRecord.adx_websiteid = this.websiteData.adx_websiteid;
    return entityListRecord;
  };

  private getEntityLists = async (): Promise<EntityList[]> => {
    const entityListsDirectory = await vscode.workspace.fs.readDirectory(this.pathroot?.with({ path: this.pathroot.path + '/lists' }) || fallbackURI);

    const entityListsArray: EntityList[] = [];
    for (const entityList of entityListsDirectory) {
      if (entityList[0].endsWith(ContextProperty.ENTITY_LIST)) {
        entityListsArray.push(await this.entityListHelper(this.pathroot?.with({ path: this.pathroot.path + '/lists/' + entityList[0] }) || fallbackURI));
      }
    }
    return entityListsArray;
  }

  private webFormHelper = async (fileUri: vscode.Uri): Promise<WebForm> => {
    const webFormYaml = await vscode.workspace.fs.readFile(fileUri);
    const webFormRecord = load(new TextDecoder().decode(webFormYaml)) as WebForm;
    webFormRecord.adx_websiteid = this.websiteData.adx_websiteid;
    return webFormRecord;
  };


  private getWebForms = async (): Promise<WebForm[]> => {
    const webFormsDirectory = await vscode.workspace.fs.readDirectory(this.pathroot?.with({ path: this.pathroot.path + '/advanced-forms' }) || fallbackURI);

    const webFormsArray: WebForm[] = [];
    for (const webForm of webFormsDirectory) {
      webFormsArray.push(await this.webFormHelper(this.pathroot?.with({ path: this.pathroot.path + '/advanced-forms/' + webForm[0] + `/${webForm[0]}.advancedform.yml` }) || fallbackURI));
    }
    return webFormsArray;
  }

  private getSiteSetting = async (): Promise<SiteSetting[]> => {
    const siteSetting = await vscode.workspace.fs.readFile(this.pathroot?.with({ path: this.pathroot.path + '/sitesetting.yml' }) || fallbackURI);
    const siteSettingYaml = load(new TextDecoder().decode(siteSetting)) as SiteSetting[];
    const siteSettingRecords = siteSettingYaml.map((siteSettingRecord) => {
      if (siteSettingRecord.adx_name === BootstrapSiteSetting) {
        this.isBootstrapV5 = siteSettingRecord.adx_value ? String(siteSettingRecord.adx_value).toLowerCase() === 'true' : false;
      }
      return {
        adx_websiteid: this.websiteData.adx_websiteid,
        adx_name: siteSettingRecord.adx_name,
        adx_value: siteSettingRecord.adx_value,
        adx_sitesettingid: siteSettingRecord.adx_sitesettingid,
      }
    });
    return siteSettingRecords;
  }

  private getSiteMarker = async (): Promise<SiteMarker[]> => {
    const siteMarker = await vscode.workspace.fs.readFile(this.pathroot?.with({ path: this.pathroot.path + '/sitemarker.yml' }) || fallbackURI);
    const siteMarkerYaml = load(new TextDecoder().decode(siteMarker)) as SiteMarker[];
    const siteMarkerRecords = siteMarkerYaml.map((siteMarkerRecord) => {
      return {
        adx_name: siteMarkerRecord.adx_name as string,
        adx_pageid: siteMarkerRecord.adx_pageid as string,
        adx_sitemarkerid: siteMarkerRecord.adx_sitemarkerid,
        adx_websiteid: this.websiteData.adx_websiteid,

      }

    });
    return siteMarkerRecords;
  }

  private getWeblinks = async (): Promise<Weblink[]> => {
    const weblinksDirectory = await vscode.workspace.fs.readDirectory(this.pathroot?.with({ path: this.pathroot.path + '/weblink-sets' }) || fallbackURI);

    const weblinksArray: Weblink[] = [];
    for (const link of weblinksDirectory) {
      const linkSubDirectory = await vscode.workspace.fs.readDirectory(this.pathroot?.with({ path: this.pathroot.path + '/weblink-sets/' + link[0] }) || fallbackURI);
      for (const sublink of linkSubDirectory) {
        if (sublink[0].endsWith(ContextProperty.WEB_LINK)) {
          const weblinkYaml = await vscode.workspace.fs.readFile(this.pathroot?.with({ path: this.pathroot.path + '/weblink-sets/' + link[0] + `/${sublink[0]}` }) || fallbackURI);
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
    weblinkSetRecord.adx_websiteid = this.websiteData.adx_websiteid;
    return weblinkSetRecord;
  };

  private getWeblinkSets = async (): Promise<WeblinkSet[]> => {
    const weblinkSetsDirectory = await vscode.workspace.fs.readDirectory(this.pathroot?.with({ path: this.pathroot.path + '/weblink-sets' }) || fallbackURI);

    const weblinkSetsArray: WeblinkSet[] = [];
    for (const weblinkSet of weblinkSetsDirectory) {
      const linkSubDirectory = await vscode.workspace.fs.readDirectory(this.pathroot?.with({ path: this.pathroot.path + '/weblink-sets/' + weblinkSet[0] }) || fallbackURI);
      for (const sublink of linkSubDirectory) {
        if (sublink[0].endsWith(ContextProperty.WEB_LINK_SET)) {
          weblinkSetsArray.push(await this.webLinkSetHelper(this.pathroot?.with({ path: this.pathroot.path + '/weblink-sets/' + weblinkSet[0] + `/${sublink[0]}` }) || fallbackURI)); // adx_title not in pac data but is manadatory, studio sends as undefined.
        }
      }
    }
    return weblinkSetsArray;
  }
}