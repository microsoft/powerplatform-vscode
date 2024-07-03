/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { WebTemplate } from '../Entity/WebTemplate';

export interface WebpageView {
  baseURL: string;
  runtimeCdnRootPath: string;
  cssWebFiles: string[];
  runtimeJsAssets: string[];
  runtimeCssAssets: string[];
  fontStyles: string[];
}

export interface WebPageContent {
  webTemplateContent: string;
  header: WebTemplate;
  footer: WebTemplate;
  customJs?: string;
  customCss?: string;
}
