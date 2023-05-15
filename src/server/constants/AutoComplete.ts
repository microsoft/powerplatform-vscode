/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const PORTAL_OBJECTS = ['ads', 'blogs', 'entities', 'entitylist', 'entityview', 'events', 'forloop', 'forums', 'knowledge', 'language', 'page', 'polls', 'request', 'searchindex', 'settings', 'sitemap', 'sitemarkers', 'snippets', 'tablerowloop', 'user', 'weblinks', 'website'];
export const ENTITY_FORM_ATTRIBUTES = ['id', 'name', 'key', 'language_code'];
export const ENTITY_LIST_ATTRIBUTES = ['id', 'name', 'key', 'language_code'];
export const WEB_FORM_ATTRIBUTES = ['id', 'name', 'key', 'language_code'];
export const PAGE_ATTRIBUTES = ['adx_copy', 'adx_summary', 'adx_title', 'adx_partialurl'];
export const EDITABLE_ATTRIBUTES = ['class', 'default', 'escape', 'liquid', 'tag', 'title', 'type'];
export const PORTAL_FILTERS = ['concat', 'except', 'first', 'join', 'last', 'order_by', 'random'];

export const AUTO_COMPLETE_PLACEHOLDER = '_AUTO_COMPLETE_PLACEHOLDER_'

export const OBJECT_ATTRIBUTES_MAP = new Map([
    ['ads', ['placements']],
    ['blogs', ['posts']],
    ['entitylist', ['create_enabled', 'create_url', 'detail_enabled', 'detail_id_parameter', 'detail_label', 'detail_url', 'empty_list_text', 'enable_entity_permissions', 'entity_logical_name', 'filter_account_attribute_name', 'filter_apply_label', 'filter_definition', 'filter_enabled', 'filter_portal_user_attribute_name', 'filter_website_attribute_name', 'language_code', 'page_size', 'primary_key_name', 'search_enabled', 'search_placeholder', 'search_tooltip', 'views']],
    ['entityview', ['columns', 'entity_permission_denied', 'entity_logical_name', 'first_page', 'Id', 'language_code', 'last_page', 'name', 'next_page', 'Page', 'pages', 'page_size', 'previous_page', 'primary_key_logical_name', 'records', 'sort_expression', 'total_pages', 'total_records']],
    ['events', ['occurences']],
    ['forloop', ['first', 'index', 'index0', 'Last', 'length', 'rindex', 'rindex0']],
    ['forums', ['threads', 'All', 'thread_count', 'post_count']],
    ['knowledge', ['articles', 'categories']],
    ['language', ['url', 'url_substitution', 'name', 'code']],
    ['page', ['breadcrumbs', 'children', 'parent', 'title', 'url']],
    ['polls', ['placements']],
    ['request', ['params', 'Path', 'path_and_query', 'query', 'url']],
    ['searchindex', ['approximate_total_hits', 'Page', 'page_size', 'results']],
    ['tablerowloop', ['Col', 'col0', 'col_first', 'col_last', 'First', 'Index', 'index0', 'Last', 'length', 'rindex', 'rindex0']],
    ['user', ['roles', 'basic_badges_url']],
    ['website', ['sign_in_url', 'sign_out_url']]
]);