import * as vscode from 'vscode';

import * as path from "path";
import { IItem } from './TreeView/Types/Entity/IItem';

class MyTreeItem extends vscode.TreeItem {
  constructor(public readonly item: IItem, public readonly collapsibleState: vscode.TreeItemCollapsibleState) {
    super(item.label, collapsibleState);
    this.tooltip = `${this.item.title}`;
    this.description = this.item.content;
    this.iconPath = this.getIconPath(item);
  }

  contextValue = this.item.isFile ? 'file' : 'folder';

  command = this.item.isFile ? {
    title: 'Open File',
    command: 'extension.openFile',
    arguments: [this.item]
  } : undefined;

  private getIconPath(item: IItem): { light: string, dark: string } | vscode.ThemeIcon {
    const basePath = path.join(__dirname, '..', 'src', 'client', 'portal_fileicons', 'icons');

    if (item.isFile) {
      // switch (item.component) {
      // case "01": // HTML
      //     return {
      //         light: path.join(basePath, 'light', 'tag.svg'),
      //         dark: path.join(basePath, 'dark', 'tag.svg')
      //     };
      // case "02": // CSS
      //     return {
      //       light: path.join(basePath, 'light', 'file-css'),
      //       dark: path.join(basePath, 'dark', 'file-css')
      //     };
      // case "03": // JSON
      //     return {
      //       light: path.join(basePath, 'light', 'file-js'),
      //       dark: path.join(basePath, 'dark', 'file-js')
      //     };
      // default:
      return new vscode.ThemeIcon('file');
      // }
    } else {
      switch (item.component) {
        case "1": // Website
          return {
            light: path.join(basePath, 'light', 'website.svg'),
            dark: path.join(basePath, 'dark', 'website.svg')
          };
        case "2": // Webpage
          return {
            light: path.join(basePath, 'light', 'web_pages.svg'),
            dark: path.join(basePath, 'dark', 'web_pages.svg')
          };
        case "3": // Webfile
          return {
            light: path.join(basePath, 'light', 'web_files.svg'),
            dark: path.join(basePath, 'dark', 'web_files.svg')
          };
        case "4": // Weblink set
          return {
            light: path.join(basePath, 'light', 'weblink_sets.svg'),
            dark: path.join(basePath, 'dark', 'weblink_sets.svg')
          };
        case "5": // Weblink
          return {
            light: path.join(basePath, 'light', 'weblinks.svg'),
            dark: path.join(basePath, 'dark', 'weblinks.svg')
          };
        case "6": // Page template
          return {
            light: path.join(basePath, 'light', 'page_templates.svg'),
            dark: path.join(basePath, 'dark', 'page_templates.svg')
          };
        case "7": // Content snippet
          return {
            light: path.join(basePath, 'light', 'content_snippets.svg'),
            dark: path.join(basePath, 'dark', 'content_snippets.svg')
          };
        case "8": // Webtemplate
          return {
            light: path.join(basePath, 'light', 'web_templates.svg'),
            dark: path.join(basePath, 'dark', 'web_templates.svg')
          };
        case "9": // Site setting
          return {
            light: path.join(basePath, 'light', 'site_settings.svg'),
            dark: path.join(basePath, 'dark', 'site_settings.svg')
          };
        case "13": // Site marker
          return {
            light: path.join(basePath, 'light', 'site_markers.svg'),
            dark: path.join(basePath, 'dark', 'site_markers.svg')
          };
        case "15": // Basic Forms
          return {
            light: path.join(basePath, 'light', 'basic_forms.svg'),
            dark: path.join(basePath, 'dark', 'basic_forms.svg')
          };
        case "17": // Lists
          return {
            light: path.join(basePath, 'light', 'lists.svg'),
            dark: path.join(basePath, 'dark', 'lists.svg')
          };
        case "19": // Advanced Forms
          return {
            light: path.join(basePath, 'light', 'advanced_forms.svg'),
            dark: path.join(basePath, 'dark', 'advanced_forms.svg')
          };
        default: // Default folder icon
          return {
            light: path.join(basePath, 'light', 'folder.svg'),
            dark: path.join(basePath, 'dark', 'folder.svg')
          };
      }
    }
  }
}

class MyTreeDataProvider implements vscode.TreeDataProvider<MyTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<MyTreeItem | undefined | void> = new vscode.EventEmitter<MyTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<MyTreeItem | undefined | void> = this._onDidChangeTreeData.event;

  constructor(private readonly data: IItem[]) { }

  getTreeItem(element: MyTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: MyTreeItem): Thenable<MyTreeItem[]> {
    if (element) {
      return Promise.resolve(this.getItemChildren(element.item));
    } else {
      return Promise.resolve(this.data.map(item => new MyTreeItem(item, vscode.TreeItemCollapsibleState.Collapsed)));
    }
  }

  private getItemChildren(item: IItem): MyTreeItem[] {
    return item.children.map(child => new MyTreeItem(child, child.children.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None));
  }
}

export function createTree(websiteIItem: IItem) {
  const treeDataProvider = new MyTreeDataProvider([websiteIItem]);
  vscode.window.registerTreeDataProvider('exampleView', treeDataProvider);

  vscode.commands.registerCommand('extension.openWebpage', (webpageName: string) => {
    vscode.window.showInformationMessage(`Opening Webpage: ${webpageName}`);
  });

  vscode.commands.registerCommand('extension.openFile', async (item: IItem) => {
    try {
      if (item.path) {
        const pathString = item.path.fsPath.toLowerCase();

        if (pathString.endsWith('.html') || pathString.endsWith('.css') || pathString.endsWith('.js') || pathString.endsWith('.json') || pathString.endsWith('.yml')) {
          const document = await vscode.workspace.openTextDocument(item.path);
          await vscode.window.showTextDocument(document);
        } else if (pathString.endsWith('.png') || pathString.endsWith('.jpg') || pathString.endsWith('.jpeg') || pathString.endsWith('.gif') || pathString.endsWith('.mp4')) {
          await vscode.commands.executeCommand('vscode.open', item.path);
        } else {
          // const document = await vscode.workspace.openTextDocument({ content: item.content, language: 'plaintext' });
          // await vscode.window.showTextDocument(document);
          await vscode.commands.executeCommand('revealInExplorer', item.path);
        }
      } else {
        const document = await vscode.workspace.openTextDocument({ content: item.content, language: 'plaintext' });
        await vscode.window.showTextDocument(document);
      }
    } catch (error) {
      console.error('Error opening file:', error);
      vscode.window.showErrorMessage('Error opening file');
    }
  });
}