import { AbstractEntity } from './AbstractEntity';

export interface Weblink extends AbstractEntity {
  adx_disablepagevalidation?: boolean;
  adx_imageurl?: string;
  adx_imagewidth?: number;
  adx_displaypagechildlinks?: boolean;
  adx_modifiedbyusername?: string;
  adx_weblinksetidname?: string;
  adx_displayorder: number;
  adx_openinnewwindowname?: string;
  adx_name: string;
  adx_displayimageonly?: boolean;
  adx_weblinksetid: string;
  adx_imagealttext?: string;
  adx_createdbyusername?: string;
  adx_parentweblinkid?: string;
  adx_modifiedbyipaddress?: string;
  adx_robotsfollowlink: boolean;
  adx_description?: string;
  adx_publishingstateid?: string;
  adx_disablepagevalidationname?: string;
  adx_createdbyipaddress?: string;
  adx_pageidname?: string;
  adx_weblinkid: string;
  adx_displaypagechildlinksname?: string;
  adx_parentweblinkidname?: string;
  adx_openinnewwindow: boolean;
  adx_externalurl?: string;
  adx_displayimageonlyname?: string;
  adx_robotsfollowlinkname?: string;
  adx_imageheight?: number;
  adx_pageid?: string;
  adx_publishingstateidname?: string;
}
