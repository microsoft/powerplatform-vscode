import { AbstractEntity } from './AbstractEntity';

export interface Website extends AbstractEntity {
  adx_defaultlanguagename?: string;
  adx_name?: string;
  adx_defaultbotconsumerid?: string;
  adx_defaultlanguage: string;
  adx_partialurl?: string;
  adx_headerwebtemplateid?: string;
  adx_parentwebsiteidname?: string;
  adx_headerwebtemplateidname?: string;
  adx_websiteid: string;
  adx_defaultbotconsumeridname?: string;
  adx_website_language: number;
  adx_primarydomainname?: string;
  adx_footerwebtemplateid?: string;
  adx_footerwebtemplateidname?: string;
  adx_parentwebsiteid?: string;
}
