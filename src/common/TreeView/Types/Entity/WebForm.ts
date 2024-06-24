import { AbstractEntity } from './AbstractEntity';

export interface WebForm extends AbstractEntity {
  adx_progressindicatorpositionname?: string;
  adx_savechangeswarningmessage?: string;
  adx_progressindicatorposition?: number;
  adx_name: string;
  adx_editexpiredstatuscode?: number;
  adx_startstep?: string;
  adx_editexpiredstatecode?: number;
  adx_editnotpermittedmessage?: string;
  adx_websiteid: string;
  adx_editexistingrecordpermittedname?: string;
  adx_progressindicatortypename?: string;
  adx_progressindicatorprependstepnum?: boolean;
  adx_progressindicatorignorelaststep?: boolean;
  adx_progressindicatorenabled?: boolean;
  adx_multiplerecordsperuserpermitted?: boolean;
  adx_authenticationrequired?: boolean;
  adx_provisionedlanguages?: number;
  adx_authenticationrequiredname?: string;
  adx_startnewsessiononloadname?: string;
  adx_startstepname?: string;
  adx_startnewsessiononload?: boolean;
  adx_progressindicatorprependstepnumname?: string;
  adx_editexpiredmessage?: string;
  adx_savechangeswarningonclose?: boolean;
  adx_webformid: string;
  adx_progressindicatorignorelaststepname?: string;
  adx_editexistingrecordpermitted?: boolean;
  adx_savechangeswarningonclosename?: string;
  adx_progressindicatortype?: number;
  adx_progressindicatorenabledname?: string;
  adx_multiplerecordsperuserpermittedname?: string;
  adx_websiteidname?: string;
}
