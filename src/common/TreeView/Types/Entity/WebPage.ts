import { AbstractEntity } from './AbstractEntity';

export interface Webpage extends AbstractEntity {
  adx_customcss?: string;
  adx_authoridname?: string;
  adx_entityform?: string;
  adx_alloworigin?: string;
  adx_modifiedbyipaddress?: string;
  adx_entityformname?: string;
  adx_meta_description?: string;
  adx_botconsumeridname?: string;
  adx_hiddenfromsitemapname?: string;
  adx_modifiedbyusername?: string;
  adx_webpagelanguageid?: string;
  adx_title?: string;
  adx_createdbyipaddress?: string;
  adx_websiteidname?: string;
  adx_editorialcomments?: string;
  adx_categoryname?: string;
  adx_authoridyominame?: string;
  adx_parentpageidname?: string;
  adx_navigationname?: string;
  adx_authorid?: string;
  adx_isrootname?: string;
  adx_hiddenfromsitemap?: boolean;
  adx_excludefromsearchname?: string;
  adx_image?: string;
  adx_imageurl?: string;
  adx_publishingstateidname?: string;
  adx_webform?: string;
  adx_partialurl: string;
  adx_displaydate?: Date;
  adx_websiteid: string;
  adx_customjavascript?: string;
  adx_isofflinecachedname?: string;
  adx_imagename?: string;
  adx_enabletracking?: boolean;
  adx_subjectid?: string;
  adx_rootwebpageidname?: string;
  adx_webformname?: string;
  adx_displayorder?: number;
  adx_isroot: boolean;
  adx_category?: number;
  adx_webpagelanguageidname?: string;
  adx_summary?: string;
  adx_subjectidname?: string;
  adx_parentpageid?: string;
  adx_expirationdate?: Date;
  adx_entitylist?: string;
  adx_releasedate?: Date;
  adx_enabletrackingname?: string;
  adx_createdbyusername?: string;
  adx_sharedpageconfigurationname?: string;
  adx_pagetemplateidname?: string;
  adx_name: string;
  adx_excludefromsearch?: boolean;
  adx_navigation?: string;
  adx_pagetemplateid: string;
  adx_feedbackpolicy?: number;
  adx_botconsumerid?: string;
  adx_enableratingname?: string;
  adx_masterwebpageid?: string;
  adx_entitylistname?: string;
  adx_feedbackpolicyname?: string;
  adx_copy?: string;
  adx_masterwebpageidname?: string;
  adx_enablerating?: boolean;
  adx_rootwebpageid?: string;
  adx_webpageid: string;
  adx_sharedpageconfiguration?: boolean;
  adx_publishingstateid?: string;
  adx_isofflinecached?: boolean;
  _adx_webform_value?: string;
  _adx_entitylist_value?: string;
  _adx_entityform_value?: string;
}
