/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import { IItem } from "../TreeView/Types/Entity/IItem";
import {IPortalComponentService} from "./IPortalComponentService";

export class DefaultPortalComponentService implements IPortalComponentService {
    create(metadataContext: any, getPath?:any) : IItem[] {
       // have the logic for creating IItem for remaining components like Webtemplate, contentsnippet, entity list, entity form. They all look similar
       return [];
    }
}