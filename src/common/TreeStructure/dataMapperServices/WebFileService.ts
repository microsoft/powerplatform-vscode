/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */
import { IPortalComponentService } from "./IPortalComponentService";
import { IItem } from "../TreeView/Types/Entity/IItem";
import { WebFile } from "../TreeView/Types/Entity/WebFile";
import * as vscode from 'vscode';

export class WebFileService implements IPortalComponentService {
    create(metadataContext: any, getPath?: any): IItem[] {
        const items: IItem[] = [];
        const webFile: WebFile[] | undefined = metadataContext.webFiles;

        if (!webFile) {
            return items;
        }
        for (const file of webFile) {
            let c = '';
            if (file.adx_name.endsWith(".css")) {
                c = '02';
            } else if (file.adx_name.endsWith(".json")) {
                c = '06';
            } else if (file.adx_name.endsWith(".mp4")) {
                c = '09';
                file.adx_name=file.adx_name.replace(/\s+/g, '-');
            } else if (file.adx_name.endsWith(".html")) {
                c = '01';
            } else if (file.adx_name.endsWith(".png")) {
                c = '05';
            } else if (file.adx_name.endsWith(".js")) {
                c = '03';
            }else{
                c='10';
                file.adx_name=file.adx_name.replace(/\s+/g, '-');
            }
            const item: IItem = {
                label: file.adx_name,
                title: file.adx_name,
                id: file.adx_webfileid,
                isFile: true,
                content: '',
                path: vscode.Uri.file(`${getPath.path}/web-files/${file.adx_name}`),
                component: c,
                children: [],
                error: "",
                parentList:[]
            };
            if(file.adx_name.endsWith(".html") || file.adx_name.endsWith(".js")){
                const fileItem: IItem = {
                    label: file.filename,
                    title: 'webFile',
                    id: file.adx_webfileid,
                    isFile: false,
                    content: '',
                    path: vscode.Uri.file(`/web-files`),
                    component: c,
                    children: [item],
                    error: "",
                    parentList:[]
                };
                items.push(fileItem);
            }else{
                items.push(item);
            }
        }
        return items;
    }
}