/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */
export const contentSnippetConfig = {
  type: "content-snippets",
  idField: "adx_contentsnippetid",
  nameField: "adx_name",
  url: ".en-US.contentsnippet.value.html",
  fileType: "html",
  comp: "/7",
  getItems: (metadataContext: any) => metadataContext.contentSnippets
};

export const webTemplateConfig = {
  type: "web-templates",
  idField: "adx_webtemplateid",
  nameField: "adx_name",
  url: ".webtemplate.source.html",
  fileType: "html",
  comp: "/8",
  getItems: (metadataContext: any) => metadataContext.webTemplates,
};

export const listConfig = {
  type: "lists",
  idField: "adx_entitylistid",
  nameField: "adx_name",
  url: ".list.custom_javascript.js",
  fileType: "js",
  comp: "/17",
  getItems: (metadataContext: any) => metadataContext.entityLists,
};

export const entityFormConfig = {
  type: "basic-forms",
  idField: "adx_entityformid",
  nameField: "adx_name",
  url: ".basicform.custom_javascript.js",
  fileType: "js",
  comp: "/15",
  getItems: (metadataContext: any) => metadataContext.entityForms,
};

export const webFormConfig = {
  type: "advanced-forms",
  idField: "adx_webformid",
  nameField: "adx_name",
  url: ".advancedform.yml",
  fileType: "yml",
  comp: "/9",
  getItems: (metadataContext: any) => metadataContext.webForms,
};