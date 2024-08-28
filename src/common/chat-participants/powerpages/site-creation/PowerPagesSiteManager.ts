/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { nl2SiteJson } from "./Nl2SiteTemplate";
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
      //const languageCode = 1033 //Only English is supported for now

      const ppJsonBlob = nl2SiteJson;

      this.siteData = reGuidPowerPagesSite(ppJsonBlob as PowerPagesParsedJson);
    }

    function getBatchAndFileUploads(
        siteData: PowerPagesParsedJson
      ): [
        Array<Changeset | DeleteOperation | GetOperation | PatchOperation | PostOperation>,
        Array<Changeset | DeleteOperation | GetOperation | PatchOperation | PostOperation>,
        PowerPagesComponent[]
      ] {
        // We need site and language to already be created before creating other components in a batch
        const siteAndLanguages: Array<Changeset | DeleteOperation | GetOperation | PatchOperation | PostOperation> = [];
        const operations: Array<Changeset | DeleteOperation | GetOperation | PatchOperation | PostOperation> = [];

        // Add site data
        siteAndLanguages.push({
          method: 'POST',
          url: getCDSEntityRequestURLPath({ entityName: entityNames.PowerPagesSites }),
          headers: {
            'Content-Type': 'application/json; type=entry',
          },
          body: JSON.stringify(siteData.powerpagesite[0]),
        });

        // Add languages
        siteData.powerpagesitelanguage.forEach((ppSiteLang) => {
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

        // Add components
        siteData.powerpagecomponent.forEach((component) => {
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
