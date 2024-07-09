/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */
import { IPortalComponentService } from "./IPortalComponentService";
import { IItem } from "../TreeView/Types/Entity/IItem";
import { Webpage } from '../TreeView/Types/Entity/WebPage';
import * as vscode from 'vscode';

export const contentPage: Webpage[] = [];
export class WebPageService implements IPortalComponentService {
    create(metadataContext: any, getPath?: any): IItem[] {
        const items: IItem[] = [];
        const webpages: Webpage[] | undefined = metadataContext.webpages;

        if (!webpages) {
            return items;
        }

        for (const webpage of webpages) {
            if (!webpage.adx_webpagelanguageid) {
                const str = webpage.adx_name;
                let x = str.replace(/\s+/g, '-');
                let y = x.toLowerCase();
                const [pageCopy, cssItem, jsItem, pageSummary] = createCopyItems(webpage, getPath, y, x);
                const webpageItem = createItem(webpage.adx_name, webpage.adx_name, webpage.adx_webpageid, false, vscode.Uri.parse(`/${webpage.adx_name}`), "/2", [pageCopy, cssItem, jsItem, pageSummary]);
                items.push(webpageItem);
            } else {
                contentPage.push(webpage);
            }
        }

        items.forEach(item => {
            webpages.forEach(webpage => {
                if (item.id === webpage.adx_parentpageid) {
                    const subItem = items.find(it => webpage.adx_webpageid === it.id);
                    if (subItem) {
                        let subpageItem = item.children.find(child => child.label === "Subpage");
                        if (!subpageItem) {
                            subpageItem = createItem('Subpage', 'Subpage', '', false, vscode.Uri.parse(`/Subpage`), "25", [subItem]);
                            item.children.push(subpageItem);
                        } else {
                            subpageItem.children.push(subItem);
                        }
                    }
                }
            });
        });

        for (const contentpg of contentPage) {
            const str = contentpg.adx_name;
            let x = str.replace(/\s+/g, '-');
            let y = x.toLowerCase();
            const [pageCopy, cssItem, jsItem, pageSummary] = createCopyItems(contentpg, getPath, y, x, '.en-US', '/content-pages');
            const contentPageItem = createItem(`Content Page`, `Content Page`, `${contentpg.adx_webpageid}_content`, false, vscode.Uri.file(`${contentpg.adx_name}/Content`), "22", [pageCopy, cssItem, jsItem, pageSummary]);

            items.forEach(item => {
                if (item.title === contentpg.adx_name) {
                    const x = item.children.find(child => child.label === "Content Page");
                    if (!x) {
                        item.children.push(contentPageItem);
                    }
                }
            });
        }
        return items;
    }

}

function createItem(label: string, title: string, id: string, isFile: boolean, path: vscode.Uri, component: string, children: IItem[] = [], content: string = '', error: string = '', parentList: IItem[] = []): IItem {
    return {
        label,
        title,
        id,
        isFile,
        content,
        path,
        component,
        children,
        error,
        parentList,
    };
}

function createCopyItems(webpage: Webpage, getPath: any, y: string, x: string, langSuffix: string = '', content: string = ''): IItem[] {
    const basePath = `${getPath.path}/web-pages/${y}${content}/${x}${langSuffix}`;
    const copyItem = createItem(`${x}${langSuffix}.webpage.copy.html`, `${x}${langSuffix}.webpage.copy.html`, `${x}${langSuffix}.webpage.copy.html`, true, vscode.Uri.file(`${basePath}.webpage.copy.html`), "01");
    const cssItem = createItem(`${x}${langSuffix}.webpage.custom_css.css`, `${x}${langSuffix}.webpage.custom_css.css`, `${webpage.adx_webpageid}_css`, true, vscode.Uri.file(`${basePath}.webpage.custom_css.css`), "02");
    const jsItem = createItem(`${x}${langSuffix}.webpage.custom_javascript.js`, `${x}${langSuffix}.webpage.custom_javascript.js`, `${webpage.adx_webpageid}_js`, true, vscode.Uri.file(`${basePath}.webpage.custom_javascript.js`), "03");
    const summaryItem = createItem(`${x}${langSuffix}.webpage.summary.html`, `${x}${langSuffix}.webpage.summary.html`, `${x}${langSuffix}.webpage.summary.html`, true, vscode.Uri.file(`${basePath}.webpage.summary.html`), "01");
    const pageCopy = createItem(`Page Copy`, `Page Copy`, `Page_copy`, false, vscode.Uri.file(`/pagecopy`), "23", [copyItem]);
    const pageSummary = createItem(`Page Summary`, `Page Summary`, `Page_Summary`, false, vscode.Uri.file(`/pageSummary`), "24", [summaryItem]);

    return [pageCopy, cssItem, jsItem, pageSummary];
}