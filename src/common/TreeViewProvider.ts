import * as vscode from 'vscode';

import {IItem} from './TreeView/Types/Entity/IItem';

class MyTreeItem extends vscode.TreeItem {
  constructor(public readonly item: IItem, public readonly collapsibleState: vscode.TreeItemCollapsibleState) {
    super(item.label, collapsibleState);
    this.tooltip = `${this.item.title}`;
    this.description = this.item.content;
    this.iconPath = this.getIconPath(item.isFile);
  }

  contextValue = this.item.isFile ? 'file' : 'folder';

  command = this.item.isFile ? {
    title: 'Open HTML File',
    command: 'extension.openFile',
    arguments: [this.item]
  } : undefined;

  private getIconPath(isFile: boolean): vscode.ThemeIcon {
    if (this.item.isFile) {
      return new vscode.ThemeIcon('file');
    } else {
      return new vscode.ThemeIcon('folder');
    }
  }
}


class MyTreeDataProvider implements vscode.TreeDataProvider<MyTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<MyTreeItem | undefined | void> = new vscode.EventEmitter<MyTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<MyTreeItem | undefined | void> = this._onDidChangeTreeData.event;

  constructor(private readonly data: IItem[]) {}

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

export function createTree(websiteIItem: IItem){
    const treeDataProvider = new MyTreeDataProvider([websiteIItem]);
    vscode.window.registerTreeDataProvider('exampleView', treeDataProvider);
  
    vscode.commands.registerCommand('extension.openWebpage', (webpageName: string) => {
      vscode.window.showInformationMessage(`Opening Webpage: ${webpageName}`);
    });
        
    vscode.commands.registerCommand('extension.openFile', async (item: IItem) => {
      try {
        if (item.path) {
          const document = await vscode.workspace.openTextDocument(item.path);
          await vscode.window.showTextDocument(document);
        } else{
          const document = await vscode.workspace.openTextDocument({ content: item.content, language: 'plaintext' });
          await vscode.window.showTextDocument(document);
        }
      } catch (error) {
        console.error('Error opening HTML file:', error);
        vscode.window.showErrorMessage('Error opening HTML file');
      }
    });
  }
