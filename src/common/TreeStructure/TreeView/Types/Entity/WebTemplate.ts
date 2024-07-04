/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */
import { AbstractEntity } from './AbstractEntity';

export interface WebTemplate extends AbstractEntity {
  adx_mimetype?: string;
  adx_websiteid: string;
  adx_source: string;
  adx_websiteidname?: string;
  adx_webtemplateid: string;
  adx_name: string;
}
