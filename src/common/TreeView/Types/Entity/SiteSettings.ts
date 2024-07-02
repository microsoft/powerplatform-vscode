import { AbstractEntity } from './AbstractEntity';

export interface SiteSetting extends AbstractEntity {
  adx_websiteid: string;
  adx_description?: string;
  adx_value?: string;
  adx_name: string;
  adx_websiteidname?: string;
  adx_sitesettingid: string;
}
