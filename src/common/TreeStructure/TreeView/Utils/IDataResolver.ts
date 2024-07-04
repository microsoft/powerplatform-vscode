
import { ContentSnippet } from '../Types/Entity/ContentSnippet';
import { EntityForm } from '../Types/Entity/EntityForm';
import { EntityList } from '../Types/Entity/EntityList';
import { PageTemplate } from '../Types/Entity/PageTemplate';
import { SiteMarker } from '../Types/Entity/SiteMarker';
import { SiteSetting } from '../Types/Entity/SiteSettings';
import { WebForm } from '../Types/Entity/WebForm';
import { Weblink } from '../Types/Entity/Weblink';
import { WeblinkSet } from '../Types/Entity/WeblinkSet';
import { PortalDrop } from '../PortalDrops/PortalDrops';
import { WebpageView } from '../Types/View/WebPage';
import { Webpage } from '../Types/Entity/WebPage';
import { Website } from '../Types/Entity/Website';
import { WebFile } from '../Types/Entity/WebFile';
import { WebTemplate } from '../Types/Entity/WebTemplate';
import { IEntityAttributeMetadata } from '../Types/Entity/EntityAttributeMetadata';

export type PortalEntity =
  | Webpage
  | ContentSnippet
  | WebTemplate
  | SiteSetting
  | SiteMarker
  | Website
  | WeblinkSet
  | WebFile
  | Weblink;

export interface IPreviewEngineContext {
  webpages?: Webpage[];
  contentSnippets?: ContentSnippet[];
  webTemplates?: WebTemplate[];
  webFiles?: WebFile[];
  siteMarkers?: SiteMarker[];
  siteSettings?: SiteSetting[];
  entityLists?: EntityList[];
  entityForms?: EntityForm[];
  webForms?: WebForm[];
  weblinks?: Weblink[];
  weblinkSets?: WeblinkSet[];
  website?: Website;
  pageTemplates?: PageTemplate[];
  dataResolverExtras?: { [key: string]: {} };
  resx?: { [key: string]: string };
  featureConfig?: Map<string, boolean | string | undefined>;
  entityAttributeMetadata?: IEntityAttributeMetadata[];
  lcid?: string;
  isBootstrapV5?: boolean;
}


export enum RenderingMode {
  VIEW = 'viewer',
  EDIT = 'editor',
}

export enum DebugMode {
  OFF = 'OFF',
  INFO = 'INFO',
  ERROR = 'ERROR',
  TRACE = 'TRACE',
}

interface IEngineConfig {
  strictFilters: boolean;
  strictVariables: boolean;
  isDynamicComponentCheck?: boolean;
  addDynamicEntity?: (entityName: string, id: string, attributeName?: string) => void;
  addFetchXMLExpression?: (varName: string, fetchXML: string) => void;
  addPcfControl?: (controlName: string) => void;
  addDynamicDrops?: (dropName: string) => void;
}

export interface IPreviewEngineConfig {
  renderingMode?: RenderingMode;
  debugMode?: DebugMode;
  engineConfig?: IEngineConfig;
  websiteLanguageId?: string;
  breadcrumb?: IBreadcrumbParams;
}

export interface IBreadcrumbParams {
  separator: string;
  home_as: string;
  tag: string;
  textClass: string;
}

export interface IDataResolver {
  context?: IPreviewEngineContext;
  config?: IPreviewEngineConfig;
}

export interface IPortalDrops {
  [key: string]: PortalDrop;
}

export interface IPortalPreviewEngine {
  renderWebpageById: (
    webpageId: string,
    htmlMeta?: WebpageView,
    beforeTagRender?: (tagName: string, entityName: string, entityId: string) => void,
    dynamicContext?: {}
  ) => string;
  evaluateExpression: (
    expression: string,
    webpageId?: string,
    beforeTagRender?: (tagName: string, entityName: string, entityId: string) => void,
    dynamicContext?: {}
  ) => string;
  renderWebpageByURL: (
    pageUrl: string,
    htmlMeta?: WebpageView,
    beforeTagRender?: (tagName: string, entityName: string, entityId: string) => void,
    dynamicContext?: {}
  ) => string;
  updateContext: (context?: IPreviewEngineContext) => void;
  updateConfig: (config?: IPreviewEngineConfig) => void;
  getConfig: () => IPreviewEngineConfig;
  renderPartialWebpageById: (
    webpageId?: string,
    htmlMeta?: WebpageView,
    beforeTagRender?: (tagName: string, entityName: string, entityId: string) => void
  ) => { header: string; mainContent: string; footer: string };
}
