/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export enum ContextProperty {
    WEBPAGE_YAML = '.webpage.yml',
    WEBPAGE_COPY = '.webpage.copy.html',
    WEBPAGE_CSS = '.webpage.custom_css.css',
    WEBPAGE_JS = '.webpage.custom_javascript.js',
    WEBPAGE_SUMMARY = '.webpage.summary.html',
    CONTENT_SNIPPET_YAML = '.contentsnippet.yml',
    CONTENT_SNIPPET_VALUE = '.contentsnippet.value.html',
    WEB_TEMPLATE_YAML = '.webtemplate.yml',
    WEB_TEMPLATE_SOURCE = '.webtemplate.source.html',
    SITE_MARKER = 'sitemarker.yml',
    SITE_SETTING = 'sitesetting.yml',
    ENTITY_LIST = '.list.yml',
    ENTITY_FORM = '.basicform.yml',
    WEB_FORM = '.advancedform.yml',
    WEB_LINK = '.weblink.yml',
    WEB_LINK_SET = '.weblinkset.yml',
    WEBSITE = 'website.yml',
    PAGE_TEMPLATE = '.pagetemplate.yml',
    UNKNOWN_PROPERTY = ''
}
export enum ContextPropertyKey {
    WEBPAGE = 'adx_webpageid',
    CONTENT_SNIPPET = 'adx_contentsnippetid',
    WEB_TEMPLATE = 'adx_webtemplateid',
    SITE_MARKER = 'adx_sitemarkerid',
    SITE_SETTING = 'adx_sitesettingid',
    ENTITY_LIST = 'adx_entitylistid',
    ENTITY_FORM = 'adx_entityformid',
    WEB_FORM = 'adx_webformid',
    WEB_LINK = 'adx_weblinkid',
    WEB_LINK_SET = 'adx_weblinksetid',
    WEBSITE = 'adx_websiteid',
    PAGE_TEMPLATE = 'adx_pagetemplateid',
}