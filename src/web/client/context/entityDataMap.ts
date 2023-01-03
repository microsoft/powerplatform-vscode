/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { IAttributePath } from "../utilities/schemaHelperUtil";
import { EntityData } from "./entityData";

export class EntityDataMap {
    private entityMap: Map<string, EntityData> = new Map<string, EntityData>;

    public setEntity(
        entityId: string,
        entityName: string,
        odataEtag: string,
        attributePath: IAttributePath,
        attributeContent: string
    ) {
        let entityColumnMap = new Map<string, string>();
        const existingEntity = this.entityMap.get(entityId);

        if (existingEntity) {
            entityColumnMap = existingEntity.entityColumn;
        }
        entityColumnMap.set(attributePath.source, attributeContent);

        const entityData = new EntityData(entityId, entityName, odataEtag, entityColumnMap);
        this.entityMap.set(entityId, entityData);
    }

    public getColumnContent(entityId: string, columnName: string) {
        return this.entityMap.get(entityId)?.getColumn.get(columnName) ?? "";
    }

    public updateEntityContent(entityId: string, columnName: string, columnContent: string) {
        const existingEntity = this.entityMap.get(entityId);

        if (existingEntity) {
            existingEntity.entityColumn.set(columnName, columnContent)
            this.entityMap.set(entityId, existingEntity);
            return;
        }
        throw Error("Entity does not exist in the map"); // TODO - Revisit errors and dialog experience here
    }

    public updateEntityColumnContent(entityId: string, columnName: IAttributePath, columnAttributeContent: string) {
        const existingEntity = this.entityMap.get(entityId);

        if (existingEntity) {
            const existingColumnContent = existingEntity.entityColumn.get(columnName.source);

            if (existingColumnContent && columnName.relativePath) {
                const jsonFromOriginalContent = JSON.parse(existingColumnContent);

                jsonFromOriginalContent[columnName.relativePath] = columnAttributeContent;
                existingEntity.entityColumn.set(columnName.source, JSON.stringify(jsonFromOriginalContent));
                this.entityMap.set(entityId, existingEntity);
                return;
            } else if (columnName.source) {
                this.updateEntityContent(entityId, columnName.source, columnAttributeContent);
                return;
            }
        }
        throw Error("Entity does not exist in the map"); // TODO - Revisit errors and dialog experience here
    }
}
