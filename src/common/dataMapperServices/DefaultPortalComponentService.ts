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
            const url=this.config.url;
            const filetype=this.config.fileType;
            let x = name.replace(/[/\s]+/g, '-');
            let y = x.toLowerCase();
            let c='01';
            if(type=='lists'){
                y='';
            }
            if(type=='basic-forms'){
                x=y;
            }
            if(filetype=='js'){
                c='03';
            }
            const children: IItem[] = [
                // {
                //     label: "SourceDependencies",
                //     title: "SourceDependencies",
                //     id: `${id}_sourceDependencies`,
                //     isFile: false,
                //     content: "",
                //     path: vscode.Uri.parse(`/${name}/sourceDependencies`),
                //     component: "",
                //     children: [],
                //     error: ""
                // },
                {
                    label: `${name}.${filetype}`,
                    title: `${name}.${filetype}`,
                    id: `${id}_${filetype}`,
                    isFile: true,
                    content: '',
                    path: vscode.Uri.file(`${getPath.path}/${type}/${y}/${x}${url}`),
                    component: c,
                    children: [],
                    error: ""
                }
            ];

            const item: IItem = {
                label: name,
                title: name,
                id: id,
                isFile: false,
                content: '',
                path: vscode.Uri.parse(`/${name}`),
                component: "",
                children: children,
                error: ""
            };

            items.push(item);
        }
        return items;
    }
}








//     create(metadataContext: any, getPath?: any): IItem[] {
//         const items: IItem[] = [];
//         const webTemplates: WebTemplate[] | undefined = metadataContext.webTemplates;

//         if (!webTemplates) {
//             return items;
//         }

//         for (const template of webTemplates) {
//             const str = template.adx_name;
//             let x = str.replace(/\s+/g, '-');
//             let y = x.toLowerCase();
//             const children: IItem[] = [
//                 {
//                     label: "SourceDependencies",
//                     title: "SourceDependencies",
//                     id: `${template.adx_webtemplateid}_sourceDependencies`,
//                     isFile: false,
//                     content: "",
//                     path: vscode.Uri.parse(`/${template.adx_name}/sourceDependencies`),
//                     component: "",
//                     children: [],
//                     error: ""
//                 },
//                 {
//                     label: `${template.adx_name}.html`,
//                     title: `${template.adx_name}.html`,
//                     id: `${template.adx_webtemplateid}_html`,
//                     isFile: true,
//                     content: template.adx_source,
//                     path: vscode.Uri.file(`${getPath.path}/web-templates/${y}/${x}.webtemplate.source.html`),
//                     component: "01",
//                     children: [],
//                     error: ""
//                 }
//             ];

//             const item: IItem = {
//                 label: template.adx_name,
//                 title: template.adx_name,
//                 id: template.adx_webtemplateid,
//                 isFile: false,
//                 content: '',
//                 path: vscode.Uri.parse(`/${template.adx_name}`),
//                 component: "",
//                 children: children,
//                 error: ""
//             };

//             items.push(item);
//         }
//         return items;
//     }
// }