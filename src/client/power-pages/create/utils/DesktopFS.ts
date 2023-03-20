/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { IAbstractFS } from "@microsoft/generator-powerpages/context";
import * as fs from "fs";
import recursive from "recursive-readdir";

export default class DesktopFS implements IAbstractFS {
    readFileSync(filePath: string): string {
        const content = fs.readFileSync(filePath, "utf-8");
        return content;
    }

    async readdirSync(dir: string, options?: string[]): Promise<string[]> {
        const files = await recursive(dir, options);
        return files;
    }

    writeFileSync(filePath: string, content: string): void {
        fs.writeFileSync(filePath, content);
    }
}
