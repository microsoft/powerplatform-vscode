/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import {IPortalComponentService} from "./IPortalComponentService";
import { IItem } from "../TreeView/Types/Entity/IItem";

export class WebsiteService implements IPortalComponentService {
    create(metadataContext: any, getPath?:any) : IItem[] {
        // have the logic for creating IItem for remaining components
        return [];
     }
}