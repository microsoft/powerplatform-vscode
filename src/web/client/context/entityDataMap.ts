/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { IAttributePath } from "../common/interfaces";
import { EntityData } from "./entityData";

export class EntityDataMap {
    private entityMap: Map<string, EntityData> = new Map<string, EntityData>();

    private updateEntityContent(
        entityId: string,
        columnName: string,
        columnContent: string | Uint8Array
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
        attributeContent: string,
        mappingEntityId?: string,
        fileUri?: string,
        rootWebPageId?: string
    ) {
        let entityColumnMap = new Map<string, string | Uint8Array>();
        const existingEntity = this.entityMap.get(entityId);

        if (existingEntity) {
            entityColumnMap = existingEntity.entityColumn;
        }
        entityColumnMap.set(attributePath.source, attributeContent);

        const filePath = this.entityMap.get(entityId)?.filePath ?? new Set();
        if (fileUri) {
            filePath.add(fileUri);
        }

        const entityData = new EntityData(
            entityId,
            entityName,
            odataEtag,
            entityColumnMap,
            mappingEntityId,
            filePath,
            rootWebPageId
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
        const existingColumnContent = this.getColumnContent(
            entityId,
            columnName.source
        ) as string;

        if (columnName.relativePath.length) {
            const jsonFromOriginalContent = JSON.parse(existingColumnContent);

            return jsonFromOriginalContent[columnName.relativePath];
        } else if (columnName.source.length) {
            return existingColumnContent;
        }
        throw Error("Entity does not exist in the map"); // TODO - Revisit errors and dialog experience here
    }

    public updateEntityColumnContent(
        entityId: string,
        columnName: IAttributePath,
        columnAttributeContent: string | Uint8Array
    ) {
        const existingEntity = this.entityMap.get(entityId);

        if (existingEntity) {
            const existingColumnContent = existingEntity.entityColumn.get(
                columnName.source
            ) as string;

            if (columnName.relativePath.length) {
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
            } else if (columnName.source.length) {
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
