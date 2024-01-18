/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export class EntityForeignKeyDataMap {
    private entityForeignKeyMap: Map<string, Set<string>> = new Map<string, Set<string>>();

    public get getEntityForeignKeyMap(): Map<string, Set<string>> {
        return this.entityForeignKeyMap;
    }

    public setEntityForeignKey(
        rootWebPageId: string,
        entityId: string
    ) {
        const existingEntity = this.entityForeignKeyMap.get(rootWebPageId) ?? new Set<string>();
        existingEntity.add(entityId);
        this.entityForeignKeyMap.set(rootWebPageId, existingEntity);
    }
}
