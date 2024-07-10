/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import {IPortalComponentService} from "./IPortalComponentService";
import {WebsiteService} from "./WebsiteService";
import {WebPageService} from "./WebPageService";
import {DefaultPortalComponentService} from  "./DefaultPortalComponentService";

export class PortalComponentServiceFactory {
  static getPortalComponent(componentType: string): IPortalComponentService | null {
    switch (componentType) {
      case "Website": {
        return new WebsiteService();
      }
      case "WebPage": {
        return new WebPageService();
      }
      default: {
        return new DefaultPortalComponentService();
      }
    }
  }
}