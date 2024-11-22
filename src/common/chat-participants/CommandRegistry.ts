/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { CreateSiteCommand } from "./powerpages/commands/create-site/CreateSiteCommand";

export interface Command {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute(request: any, stream: vscode.ChatResponseStream): Promise<any>;
}

export class CommandRegistry {
    private commands: { [key: string]: Command } = {'create-site': new CreateSiteCommand()};

    register(commandName: string, command: Command) {
        this.commands[commandName] = command;
    }

    get(commandName: string): Command {
        return this.commands[commandName];
    }
}
