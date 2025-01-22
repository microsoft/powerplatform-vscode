import { AbstractEntity } from './AbstractEntity';

export interface SiteMarker extends AbstractEntity {
  adx_websiteid: string;
  adx_name: string;
  adx_pageidname?: string;
  adx_websiteidname?: string;
  adx_pageid: string;
  adx_sitemarkerid: string;
}
