/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import React, { useState } from "react";
import { IEntityNode } from "../../interfaces/Node";
import { EntityNode } from "../../models/Node";

export interface EntityNodePropertyPanelProps {
    node: IEntityNode;
    onPropertyUpdate: (updatedNode: IEntityNode) => void;
}

export const EntityNodePropertyPanel: React.FC<EntityNodePropertyPanelProps> = (props) => {
    const [selectedEntity, setSelectedEntity] = useState(props.node.name);
    const [entities, setEntities] = useState<string[]>([]);

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedEntity(event.target.value);
        const updateNode = new EntityNode(event.target.value);
        props.onPropertyUpdate(updateNode);
    };

    const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'getEntities') {
            setEntities(event.data.entities);
        }
    };

    React.useEffect(() => {
        window.addEventListener('message', messageHandler);
        
        const vscode = acquireVsCodeApi();
        vscode.postMessage({ type: 'getEntities' });
    
        return () => {
        window.removeEventListener('message', messageHandler);
        };  
    }, []);

    return (
        <div>
            <label htmlFor="dropdown">Entity Name:</label>
            <select id="dropdown" value={selectedEntity} onChange={handleChange}>
                {!selectedEntity && <option value=""></option>}
                {entities.map(entity => (
                    <option key={entity} value={entity}>
                        {entity}
                    </option>
                ))}
            </select>
            {!selectedEntity && <p style={{ color: 'red' }}>Please select an entity name.</p>}
        </div>
    )
}