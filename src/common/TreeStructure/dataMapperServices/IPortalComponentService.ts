/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */
import { IItem } from "../TreeView/Types/Entity/IItem";

export interface IPortalComponentService {
    /**
     * Save source value of the component and refresh component if save successful.
     * @param id: Id of component
     * @param value: source code value
     * @param element Outer HTML element for portal component
     * @param subComponent one of many dependent on its parent component service for saving
     */
    create(metadataContext: any, getPath?: any): IItem[];

}