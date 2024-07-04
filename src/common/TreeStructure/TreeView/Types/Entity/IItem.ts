import * as vscode from 'vscode';

export interface IItem {
  label: string;
  title: string;
  id: string;
  isFile: boolean;
  content: string;
  path?: vscode.Uri;
  component: string;
  children: IItem[];
  error: string;
}