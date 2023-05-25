/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */



// import * as vscode from "vscode";

// export class WorkspaceTreeViewProvider
//     implements vscode.TreeDataProvider<TreeNode>, vscode.Disposable
// {
//     private _onDidChangeTreeData: vscode.EventEmitter<
//         TreeNode | undefined | null | void
//     > = new vscode.EventEmitter<TreeNode | undefined | null | void>();
//     readonly onDidChangeTreeData: vscode.Event<
//         TreeNode | undefined | null | void
//     > = this._onDidChangeTreeData.event;

//     private readonly _disposables: vscode.Disposable[] = [];

//     constructor() {
//         this._disposables.push(...this.registerPanel());
//     }

//     public dispose(): void {
//         this._disposables.forEach((d) => d.dispose());
//     }

//     // We refresh the Auth Panel by both the FileWatcher events and by direct invocation
//     // after a executing a create/delete/select/etc command via the UI buttons.
//     // This can cause doubled refresh (and thus double `pac auth list` and `pac org list` calls).
//     // We want both routes, but don't want the double refresh, so use a singleton timeout limit
//     // to a single refresh call.

//     public getTreeItem(
//         element: TreeNode
//     ): vscode.TreeItem | Thenable<vscode.TreeItem> {
//         if (element.contextValue === "customFileNode") {
//             // Customize the TreeItem for file nodes with custom SVG icons
//             const treeItem = new TreeNode(
//                 element.label,
//                 element.collapsibleState
//             );
//             treeItem.tooltip = element.label;

//             treeItem.description = "hello"; // Use a built-in icon as the second custom icon
//             return treeItem;
//         }
//         return element;
//     }

//     // getChildren(element?: TreeNode): ProviderResult<TreeNode[]> {
//     //   if (element) {
//     //     // Return children for the given element
//     //     return [];
//     //   } else {
//     //     // Return root elements
//     //     return [new TreeNode("Item 1"), new TreeNode("Item 2")];
//     //   }
//     // }
//     getChildren(element?: TreeNode): vscode.ProviderResult<TreeNode[]> {
//         if (!element) {
//             // Get the workspace folders
//             const workspaceFolders = vscode.workspace.workspaceFolders;
//             console.log("workspace folder", vscode.workspace);
//             if (workspaceFolders) {
//                 // Return the root level workspace folders
//                 return workspaceFolders.map(
//                     (folder) =>
//                         new TreeNode(
//                             folder.name,
//                             folder.uri,
//                             vscode.TreeItemCollapsibleState.Expanded
//                         )
//                 );
//             }
//         } else {
//             // Get the child folders and files of the current element
//             console.log("element", element);
//             const folderUri = element.folderUri;
//             if (folderUri) {
//                 return new Promise((resolve) => {
//                     vscode.workspace.fs.readDirectory(folderUri).then(
//                         (res) => {
//                             const items: TreeNode[] = res.map(
//                                 ([name, type]) => {
//                                     const itemUri = vscode.Uri.joinPath(
//                                         folderUri,
//                                         name
//                                     );
//                                     const collapsibleState =
//                                         type === vscode.FileType.Directory
//                                             ? vscode.TreeItemCollapsibleState
//                                                   .Collapsed
//                                             : vscode.TreeItemCollapsibleState
//                                                   .None;
//                                     return new TreeNode(
//                                         name,
//                                         itemUri,
//                                         collapsibleState
//                                     );
//                                 }
//                             );
//                             resolve(items);
//                         },
//                         (error) => {
//                             console.error("Error reading directory:", error);
//                             resolve([]); // Return an empty array in case of error
//                         }
//                     );
//                 });
//             }
//         }

//         return [];
//     }

//     // async getfolderItems(folderUri: vscode.Uri) {
//     //   const folderItems = await vscode.workspace.fs.readDirectory(folderUri);
//     //   console.log("folder items", folderItems);
//     //   return folderItems;
//     // }
//     refresh(): void {
//         this._onDidChangeTreeData.fire();
//     }

//     private registerPanel(): vscode.Disposable[] {
//         return [
//             vscode.window.registerTreeDataProvider("exampleView", this),
//             // vscode.commands.registerCommand("pacCLI.authPanel.refresh", () =>
//             //     this.refresh()
//             // ),
//         ];
//     }
// }

// class TreeNode extends vscode.TreeItem {
//     constructor(
//         label: string,
//         public readonly folderUri?: vscode.Uri,
//         collapsibleState?: vscode.TreeItemCollapsibleState
//     ) {
//         super(label, collapsibleState);
//         this.tooltip = label;
//         this.iconPath = vscode.ThemeIcon.Folder;
//         if (collapsibleState === 0) {
//             this.contextValue = "customFileNode";
//         }
//     }

//     // renderDescription(): string {
//     //   // Customize the rendering of the description
//     //   const customIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
//     //     <g id="canvas">
//     //       <path d="M16,16H0V0H16Z" fill="none" opacity="0" />
//     //     </g>
//     //     <g id="level-1">
//     //       <path d="M14.5.5v14H1.5V.5Z" fill="#212121" opacity="0.1" />
//     //       <path d="M14.5,0H1.5L1,.5v14l.5.5h13l.5-.5V.5ZM14,14H2V1H14Z" fill="#212121" />
//     //       <g opacity="0.75">
//     //         <path d="M11.25,9H10L8,6.333,6,9H4.75L7,6H9Z" fill="#212121" />
//     //       </g>
//     //       <path d="M9.5,5.5h-3v-2h3Zm-3,6h-3v-2h3Zm6,0h-3v-2h3Z" fill="#212121" opacity="0.1" />
//     //       <path d="M9.5,6h-3L6,5.5v-2L6.5,3h3l.5.5v2ZM7,5H9V4H7Zm-.5,7h-3L3,11.5v-2L3.5,9h3l.5.5v2ZM4,11H6V10H4Zm8.5,1h-3L9,11.5v-2L9.5,9h3l.5.5v2ZM10,11h2V10H10Z" fill="#212121" />
//     //     </g>
//     //   </svg>`;
//     //   return `${customIcon} ${this.description || ""}`;
//     // }
// }
