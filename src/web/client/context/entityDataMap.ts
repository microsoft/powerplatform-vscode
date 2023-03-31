/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { IAttributePath } from "../utilities/schemaHelperUtil";
import { EntityData } from "./entityData";

export class EntityDataMap {
    private entityMap: Map<string, EntityData> = new Map<string, EntityData>();

    private updateEntityContent(
        entityId: string,
        columnName: string,
        columnContent: string
    ) {
        const existingEntity = this.entityMap.get(entityId);

        if (existingEntity) {
            existingEntity.entityColumn.set(columnName, columnContent);
            this.entityMap.set(entityId, existingEntity);
            return;
        }
        throw Error("Entity does not exist in the map"); // TODO - Revisit errors and dialog experience here
    }

    public get getEntityMap(): Map<string, EntityData> {
        return this.entityMap;
    }

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

        const entityData = new EntityData(
            entityId,
            entityName,
            odataEtag,
            entityColumnMap
        );
        this.entityMap.set(entityId, entityData);
    }

    public getColumnContent(entityId: string, columnName: string) {
        const existingEntity = this.entityMap.get(entityId);
        if (existingEntity) {
            return existingEntity.entityColumn.get(columnName);
        }
        throw Error("Entity does not exist in the map"); // TODO - Revisit errors and dialog experience here
    }

    public getEntityColumnContent(
        entityId: string,
        columnName: IAttributePath
    ) {
        console.log("Getting entity column content");
        const existingColumnContent = this.getColumnContent(
            entityId,
            columnName.source
        );
        console.log("Existing column content", existingColumnContent);

        if (existingColumnContent && columnName.relativePath.length) {
            const jsonFromOriginalContent = JSON.parse(existingColumnContent);

            console.log("Json from original content", jsonFromOriginalContent);

            return jsonFromOriginalContent[columnName.relativePath];
        } else if (existingColumnContent && columnName.source.length) {
            console.log("Returning existing column content");
            return existingColumnContent;
        }
        throw Error("Entity does not exist in the map"); // TODO - Revisit errors and dialog experience here
    }

    public updateEntityColumnContent(
        entityId: string,
        columnName: IAttributePath,
        columnAttributeContent: string
    ) {
        const existingEntity = this.entityMap.get(entityId);

        if (existingEntity) {
            const existingColumnContent = existingEntity.entityColumn.get(
                columnName.source
            );

            if (existingColumnContent && columnName.relativePath.length) {
                const jsonFromOriginalContent = JSON.parse(
                    existingColumnContent
                );

                jsonFromOriginalContent[columnName.relativePath] =
                    columnAttributeContent;
                existingEntity.entityColumn.set(
                    columnName.source,
                    JSON.stringify(jsonFromOriginalContent)
                );
                this.entityMap.set(entityId, existingEntity);
                return;
            } else if (existingColumnContent && columnName.source.length) {
                this.updateEntityContent(
                    entityId,
                    columnName.source,
                    columnAttributeContent
                );
                return;
            }
        }
        throw Error("Entity does not exist in the map"); // TODO - Revisit errors and dialog experience here
    }

    public updateEtagValue(entityId: string, etag: string) {
        const existingEntity = this.entityMap.get(entityId);

        if (existingEntity) {
            existingEntity.setEntityEtag = etag;
            return;
        }
        throw Error("Entity does not exist in the map"); // TODO - Revisit errors and dialog experience here
    }
}
