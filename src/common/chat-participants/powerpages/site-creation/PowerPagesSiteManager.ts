/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { PowerPagesParsedJson } from "./PowerPagesSiteModel";
import { reGuidPowerPagesSite } from "./PowerPagesSiteUtils";



  type IPowerPagesSiteFromJsonActions = {
    // Define actions that will be returned
  };

  class PowerPagesSiteManager {
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
      const languageCode = 1033 //Only English is supported for now

      const ppJsonBlob = (await import(
        `@ppux-extras/powerpages-assets/site-templates/${this.templateName}/${languageCode}/${this.templateName}.json`
      )) as unknown;

      this.siteData = reGuidPowerPagesSite(ppJsonBlob as PowerPagesParsedJson);
    }
    
    // Method to expose site data and actions
    public getSiteDataAndActions(): {
      ppSiteData: PowerPagesParsedJson;
      actions: IPowerPagesSiteFromJsonActions;
    } {
      return {
        ppSiteData: this.siteData,
        actions: {
          // Implement and return actions
        },
      };
    }
  }

  // Usage
  const manager = new PowerPagesSiteManager('templateName', 'English');
  manager.loadTemplate().then(() => {
    const { ppSiteData, actions } = manager.getSiteDataAndActions();
    console.log(ppSiteData);
    // Perform actions
  });
