import * as vscode from 'vscode';

import * as path from "path";
import { IItem } from './TreeView/Types/Entity/IItem';

class MyTreeItem extends vscode.TreeItem {
  constructor(public readonly item: IItem, public readonly collapsibleState: vscode.TreeItemCollapsibleState) {
    super(item.label, collapsibleState);
    this.tooltip = `${this.item.title}`;
    this.description = this.item.content;
    this.iconPath = this.getIconPath(item);
    this.contextValue = this.item.isFile ? 'file' : 'folder';
    this.command = this.getCommand(item);
  }

  private getCommand(item: IItem): vscode.Command | undefined {
    if (item.isFile && item.title === 'Source-Dependencies') {
      return {
        title: 'Item Clicked',
        command: 'extension.itemClicked',
        arguments: [item]
      };
    } else if (item.isFile) {
      return {
        title: 'Open File',
        command: 'extension.openFile',
        arguments: [item]
      };
    }
    return undefined;
  }

  private getIconPath(item: IItem): { light: string, dark: string } | vscode.ThemeIcon {
    const basePath = path.join(__dirname, '..', 'src', 'client', 'portal_fileicons', 'icons');

    if (item.isFile) {
      switch (item.component) {
        case "01": // HTML
          return {
            light: path.join(basePath, 'dark', 'html.svg'),
            dark: path.join(basePath, 'dark', 'html.svg')
          };
        case "02": // CSS
          return {
            light: path.join(basePath, 'dark', 'css.svg'),
            dark: path.join(basePath, 'dark', 'css.svg')
          };
        case "03": // JSON
          return {
            light: path.join(basePath, 'dark', 'js.svg'),
            dark: path.join(basePath, 'dark', 'js.svg')
          };
        case "04": // YML
          return {
            light: path.join(basePath, 'dark', 'yml.svg'),
            dark: path.join(basePath, 'dark', 'yml.svg')
          };
        case "05": // PNG
          return {
            light: path.join(basePath, 'dark', 'png.svg'),
            dark: path.join(basePath, 'dark', 'png.svg')
          };
        case "06": // Json
          return {
            light: path.join(basePath, 'light', 'json.svg'),
            dark: path.join(basePath, 'dark', 'json.svg')
          };
        case "09": // MP4
          return {
            light: path.join(basePath, 'dark', 'mp4.svg'),
            dark: path.join(basePath, 'dark', 'mp4.svg')
          };
        case "10": // Text File
          return new vscode.ThemeIcon('file');
        case "07":
        case "08":
        case "015":
        case "017":
        case "019":
          return {
            light: path.join(basePath, 'light', 'file-symlink-file.svg'),
            dark: path.join(basePath, 'dark', 'file-symlink-file.svg')
          };
        default:
          return new vscode.ThemeIcon('file');
      }
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
        case "22": // Content Page
          return {
            light: path.join(basePath, 'light', 'book.svg'),
            dark: path.join(basePath, 'dark', 'book.svg')
          };
        case "23": // Page Copy
          return {
            light: path.join(basePath, 'light', 'list-flat.svg'),
            dark: path.join(basePath, 'dark', 'list-flat.svg')
          };
        case "24": // Page Summary
          return {
            light: path.join(basePath, 'light', 'note.svg'),
            dark: path.join(basePath, 'dark', 'note.svg')
          };
        case "25": // Subpage
          return {
            light: path.join(basePath, 'light', 'file-submodule.svg'),
            dark: path.join(basePath, 'dark', 'file-submodule.svg')
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

  getParent(element: MyTreeItem): MyTreeItem | undefined {
    const parentItem = this.findParentItem(this.data[0], element.item);
    if (parentItem) {
      return new MyTreeItem(parentItem, vscode.TreeItemCollapsibleState.Collapsed);
    }
    return undefined;
  }

  private findParentItem(currentItem: IItem, targetItem: IItem): IItem | undefined {
    if (!currentItem || !currentItem.children) {
      return undefined;
    }
    const foundChild = currentItem.children.find(child => child.id === targetItem.id && child.title === targetItem.title);
    if (foundChild) {
      return currentItem;
    }
    for (const child of currentItem.children) {
      const parentItem = this.findParentItem(child, targetItem);
      if (parentItem) {
        return parentItem;
      }
    }

    return undefined;
  }

  findItemById(item: IItem, websiteIItem: IItem): IItem | undefined {
    const comp = item.component.slice(1);
    if (comp == '7') {
      const contentSnipppetIItem = websiteIItem.children.find((child: IItem) => child.label === 'Content Snippets');
      return helper(item, contentSnipppetIItem);
    } else if (comp == '8') {
      const webTemplateIItem = websiteIItem.children.find((child: IItem) => child.label === 'Web Templates');
      return helper(item, webTemplateIItem);
    } else if (comp == '15') {
      const entityFormIItem = websiteIItem.children.find((child: IItem) => child.label === 'Basic Forms');
      return helper(item, entityFormIItem);
    } else if (comp == '17') {
      const listsIItem = websiteIItem.children.find((child: IItem) => child.label === 'Lists');
      return helper(item, listsIItem);
    } else if (comp == '19') {
      const webformIItem = websiteIItem.children.find((child: IItem) => child.label === 'Advanced Forms');
      return helper(item, webformIItem);
    } else {
      return undefined;
    }
  }
}
function helper(item: IItem, entityIItem: any) {
  for (const child of entityIItem.children) {
    if (child.id == item.id) {
      return child;
    }
  }
  return undefined;
}
export function createTree(websiteIItem: IItem) {
  const treeDataProvider = new MyTreeDataProvider([websiteIItem]);
  const treeView = vscode.window.createTreeView('exampleView', { treeDataProvider });

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
          const document = await vscode.workspace.openTextDocument(item.path);
          await vscode.window.showTextDocument(document);
        }
      } else {
        const document = await vscode.workspace.openTextDocument({ content: item.content, language: 'plaintext' });
        await vscode.window.showTextDocument(document);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`${item.title} ${item.id} does not exist`);
    }
  });
  vscode.commands.registerCommand('extension.itemClicked', (item: IItem) => {
    const foundItem = treeDataProvider.findItemById(item, websiteIItem);
    if (foundItem && !foundItem.isFile) {
      const treeItem = new MyTreeItem(foundItem, foundItem.children.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
      treeView.reveal(treeItem, { focus: true, expand: true });
    }
  });
}