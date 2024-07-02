import { AbstractEntity } from './AbstractEntity';

export interface ContentSnippet extends AbstractEntity {
  adx_display_name?: string;
  adx_value: string;
  adx_createdbyipaddress?: string;
  adx_createdbyusername?: string;
  adx_name: string;
  adx_modifiedbyipaddress?: string;
  adx_modifiedbyusername?: string;
  adx_websiteid: string;
  adx_websiteidname?: string;
  adx_contentsnippetlanguageidname?: string;
  adx_type?: number;
  adx_contentsnippetlanguageid?: string;
  adx_typename?: string;
  adx_contentsnippetid: string;
}
