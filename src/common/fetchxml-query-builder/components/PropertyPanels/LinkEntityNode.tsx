/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import React, { useState, useEffect } from 'react';
import { ILinkEntityNode } from '../../interfaces/Node';
import { EntityNode, LinkEntityNode } from '../../models/Node';
import { getVSCodeApi } from '../../utility/utility';
import { containerStyle, inputStyle, labelStyle, optionStyle, selectStyle } from './Styles';

interface Relationship {
    schemaName: string;
    linkEntityName: string;
    formattedName: string;
    from: string;
    to: string;
}

interface LinkEntityNodePropertyPanelProps {
    node: ILinkEntityNode;
    onPropertyUpdate: (updatedNode: ILinkEntityNode) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetchRelationships = (response: any): Relationship[] => {


    const manyToOneRelationships = response.ManyToOneRelationships.map((rel: any) => ({
        schemaName: rel.SchemaName,
        linkEntityName: rel.ReferencedEntity,
        formattedName: `${rel.ReferencingEntity}.${rel.ReferencingAttribute} - ${rel.ReferencedEntity}.${rel.ReferencedAttribute}`,
        from: rel.ReferencedAttribute,
        to: rel.ReferencingAttribute,
    }));

    const oneToManyRelationships = response.OneToManyRelationships.map((rel: any) => ({
        schemaName: rel.SchemaName,
        linkEntityName: rel.ReferencingEntity,
        formattedName: `${rel.ReferencedEntity}.${rel.ReferencedAttribute} - ${rel.ReferencingEntity}.${rel.ReferencingAttribute}`,
        from: rel.ReferencingAttribute,
        to: rel.ReferencedAttribute,
    }));

    return [{schemaName:'-M:1-', formattedName: '-M:1-'}, ...manyToOneRelationships,{schemaName:'-1:M-',formattedName: '-1:M-'}, ...oneToManyRelationships];
};

const LinkEntityNodePropertyPanel: React.FC<LinkEntityNodePropertyPanelProps> = ({
    node,
    onPropertyUpdate,
}) => {
    const [relationships, setRelationships] = useState<Relationship[]>([]);
    const [selectedRelationship, setSelectedRelationship] = useState<string>(node.relationship || '');
    const [selectedJoinType, setSelectedJoinType] = useState<string>(node.joinType || 'inner');
    const [alias, setAlias] = useState<string>(node.alias || '');
    const vscode = getVSCodeApi();

    const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'getRelationships') {
            const fetchedRelationships = fetchRelationships(event.data.relationships);
            setRelationships(fetchedRelationships);
        }
    };


    useEffect(() => {

        window.addEventListener('message', messageHandler);

        const entityName = getEntityName(node);
        vscode.postMessage({ type: 'entitySelected', entity: entityName});

        return () => {
            window.removeEventListener('message', messageHandler);
        };
    }, [node]);

    const handleRelationshipChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        setSelectedRelationship(value);
        const selectedRel = relationships.find(rel => rel.schemaName=== value);
        const updatedNode = new LinkEntityNode(node.id, selectedRel?.linkEntityName, value, selectedJoinType, alias, selectedRel?.from, selectedRel?.to, node.linkEntities, node.attributes);
        onPropertyUpdate(updatedNode);
    };

    const handleJoinTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value as 'inner' | 'outer';
        setSelectedJoinType(value);
        const selectedRel = relationships.find(rel => rel.schemaName === selectedRelationship);
        const updatedNode = new LinkEntityNode(node.id, selectedRel?.linkEntityName, selectedRelationship, value, alias, selectedRel?.from, selectedRel?.to, node.linkEntities, node.attributes);
        onPropertyUpdate(updatedNode);
    };

    const handleAliasChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setAlias(value);
        const selectedRel = relationships.find(rel => rel.schemaName === selectedRelationship);
        const updatedNode = new LinkEntityNode(node.id, selectedRel?.linkEntityName, selectedRelationship, selectedJoinType, value, selectedRel?.from, selectedRel?.to, node.linkEntities, node.attributes);
        onPropertyUpdate(updatedNode);
    };

    return (
        <div>
            <div style={{...containerStyle, marginTop: '10px'}}>
                <label htmlFor="relationship" style={labelStyle}>Relationship:</label>
                <select
                    id="relationship"
                    value={selectedRelationship}
                    onChange={handleRelationshipChange}
                    style={selectStyle}
                >
                    <option value="" disabled>Select a relationship</option>
                    {relationships.map((relationship, index) => (
                        <option key={index} value={relationship.schemaName} style={optionStyle}>
                            {relationship.formattedName}
                        </option>
                    ))}
                </select>
            </div>
            <div style={containerStyle}>
                <label htmlFor="joinType" style={labelStyle}>Join Type:</label>
                <select
                    id="joinType"
                    value={selectedJoinType}
                    onChange={handleJoinTypeChange}
                    style={selectStyle}
                >
                    <option value="inner">Inner</option>
                    <option value="outer">Outer</option>
                </select>
            </div>
            <div style={containerStyle}>
                <label htmlFor="alias" style={labelStyle}>Alias:</label>
                <input
                    id="alias"
                    type="text"
                    value={alias}
                    onChange={handleAliasChange}
                    style={inputStyle}
                />
            </div>
        </div>
    );
};

const getEntityName = (node: ILinkEntityNode): string | undefined => {
    if (node.parent instanceof EntityNode) {
        return (node.parent as EntityNode).name;
    }
    else if(node.parent instanceof LinkEntityNode) {
        return (node.parent as LinkEntityNode).name;
    }
    throw new Error('Invalid parent node type');
}

export default LinkEntityNodePropertyPanel;
