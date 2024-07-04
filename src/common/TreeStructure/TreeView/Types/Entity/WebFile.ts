import { AbstractEntity } from './AbstractEntity';

export interface WebFile extends AbstractEntity {
    adx_contentdisposition: number;
    adx_enabletracking: boolean;
    adx_excludefromsearch: boolean;
    adx_hiddenfromsitemap: boolean;
    adx_name: string;
    adx_parentpageid: string;
    adx_partialurl: string;
    adx_publishingstateid: string;
    adx_webfileid: string;
    annotationid: string;
    filename: string;
    isdocument: boolean;
    mimetype: string;
    objectid: string;
    objecttypecode: string;
}
