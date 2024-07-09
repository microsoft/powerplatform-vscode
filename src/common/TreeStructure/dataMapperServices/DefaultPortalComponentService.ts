/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */
import { IItem } from "../TreeView/Types/Entity/IItem";
import { IPortalComponentService } from "./IPortalComponentService";
import * as vscode from 'vscode';

interface PortalComponentConfig {
    type: string;
    idField: string;
    nameField: string;
    url: string;
    fileType: string,
    comp: string,
    getItems: (metadataContext: any) => any[];
}

export class DefaultPortalComponentService implements IPortalComponentService {
    private config: PortalComponentConfig;

    constructor(config: PortalComponentConfig) {
        this.config = config;
    }

    create(metadataContext: any, getPath?: any): IItem[] {
        const items: IItem[] = [];
        const components = this.config.getItems(metadataContext);

        if (!components) {
            return items;
        }

        for (const component of components) {
            const name = component[this.config.nameField];
            const id = component[this.config.idField];
            const type = this.config.type;
            const url = this.config.url;
            const filetype = this.config.fileType;
            const comp = this.config.comp;
            let x = name.replace(/[/\s]+/g, '-');
            let y = x.toLowerCase();
            let c = '01';
            if (type == 'lists') {
                y = '';
            }
            if (type == 'basic-forms') {
                x = y;
            }
            if (filetype == 'js') {
                c = '03';
            }
            if (filetype == 'yml') {
                c = '04'
            }
            const children: IItem[] = [
                {
                    label: `${x}${url}`,
                    title: `${name}.${filetype}`,
                    id: `${id}`,
                    isFile: true,
                    content: '',
                    path: vscode.Uri.file(`${getPath.path}/${type}/${y}/${x}${url}`),
                    component: c,
                    children: [],
                    error: "",
                    parentList:[]
                }
            ];

            const item: IItem = {
                label: name,
                title: type,
                id: id,
                isFile: false,
                content: '',
                path: vscode.Uri.parse(`${getPath.path}/${type}/${y}`),
                component: comp,
                children: children,
                error: "",
                parentList:[]
            };

            items.push(item);
        }
        return items;
    }
}