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
            let c='05';
            if(file.adx_name.endsWith(".css")){
                c='02';
            }else if(file.adx_name.endsWith(".json")){
                c='06';
            }else if(file.adx_name.endsWith(".mp4")){
                c='09';
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
                error: ""
            };
            items.push(item);
        }
        return items;
    }
}