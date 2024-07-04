/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */
import { IPortalComponentService } from "./IPortalComponentService";
import { WebPageService } from "./WebPageService";
import { DefaultPortalComponentService } from "./DefaultPortalComponentService";
import { WebFileService } from './WebFileService'
import { contentSnippetConfig, webTemplateConfig, listConfig, entityFormConfig, webFormConfig } from "./portalComponentConfigs";

export class PortalComponentServiceFactory {
  static getPortalComponent(componentType: string): IPortalComponentService | null {
    switch (componentType) {
      case "WebPage": {
        return new WebPageService();
      }
      case "WebFile": {
        return new WebFileService();
      }
      case "WebTemplate": {
        return new DefaultPortalComponentService(webTemplateConfig);
      }
      case "Content Snippet": {
        return new DefaultPortalComponentService(contentSnippetConfig);
      }
      case "List": {
        return new DefaultPortalComponentService(listConfig);
      }
      case "EntityForm": {
        return new DefaultPortalComponentService(entityFormConfig);
      }
      case "WebForm": {
        return new DefaultPortalComponentService(webFormConfig);
      }
      default: {
        return null;
      }
    }
  }
}