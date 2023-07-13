/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */




export function convertGuidToUrls(guid: string) {
    const domain = guid.replace(/-/g, "").slice(0, -1);
    const fSegment = domain.slice(-1);
    const prodSegment = domain.slice(-2, -1);
    const tstUrl = `https://${domain}${fSegment}.organization.api.test.powerplatform.com/gateway/cluster?api-version=1`;
    const preprodUrl = `https://${domain}${fSegment}.organization.api.preprod.powerplatform.com/gateway/cluster?api-version=1`;
    const prodUrl = `https://${domain}${prodSegment}${fSegment}.organization.api.powerplatform.com/gateway/cluster?api-version=1`;
  
    return {
      tstUrl,
      preprodUrl,
      prodUrl
    };
  }
  