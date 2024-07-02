// /*!
//  * Copyright (C) Microsoft Corporation. All rights reserved.
//  */

// /**
//  * Enum to represent different view query types. Derived from /src/Core/ObjectModel/Services/UserQuery/UserQueryService.cs
//  */
// export enum QueryType {
//     MainApplicationView = 0, // aka 'public'
//     AdvancedSearch = 1,
//     SubGrid = 2,
//     QuickFindSearch = 4,
//     Reporting = 8,
//     OfflineFilters = 16,
//     MASearch = 32,
//     LookupView = 64,
//     SMAppointmentBookView = 128,
//     OutlookFilters = 256,
//     AddressBookFilters = 512,
//     SavedQueryTypeOther = 2048,
//     InteractiveWorkflowView = 4096,
//     OfflineTemplate = 8192,
//     OutlookTemplate = 131072,
//     CustomDefinedView = 16384,
//   }
  
//   export interface RelatedEntityInfo {
//     to: string;
//     from: string;
//     name: string;
//   }
  
//   export class EntityView {
//     public static readonly attributePathSeparator: string = '.';
  
//     public id: string;
  
//     public description: string | null = null;
  
//     public primaryEntityTypeName: string | null = null;
  
//     public fetchXml: Document | null = null;
  
//     public layoutXml: Document | null = null;
  
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     public columnTitles: any[] = []; // TODO: This is metadata.
  
//     public queryType: QueryType | null = null;
  
//     public isDefault: boolean | null = null;
  
//     public isReadonly: boolean | null = null;
  
//     public constructor(public name: string | null = null, fetchXml: string, layoutXml: string) {
//       const parser: DOMParser = new DOMParser();
  
//       if (fetchXml) {
//         this.fetchXml = parser.parseFromString(fetchXml, 'text/xml');
//       }
  
//       if (layoutXml) {
//         this.layoutXml = parser.parseFromString(layoutXml, 'text/xml');
//       }
//     }
  
//     public getNameOfPrimaryEntityTypeFromFetchXml(): string {
//       const fetchXml: Document = this.fetchXml;
  
//       if (fetchXml === null) {
//         throw new Error('fetchXml');
//       }
  
//       const entityElementCollection: NodeListOf<Element> = fetchXml.querySelectorAll('entity');
  
//       if (entityElementCollection.length === 0) {
//         throw new Error("Required element 'entity' not present");
//       }
  
//       if (entityElementCollection.length > 1) {
//         throw new Error("Multiple elements 'entity' present");
//       }
  
//       const entityElement: Element = entityElementCollection.item(0);
  
//       const nameAttribute: string | null = entityElement.getAttribute('name');
  
//       if (nameAttribute === null) {
//         throw new Error("Attribute 'name' of element 'entity' not present");
//       }
  
//       return nameAttribute;
//     }
  
//     public getRelatedEntities(): Map<string, RelatedEntityInfo> {
//       const fetchXml: Document = this.fetchXml;
  
//       if (fetchXml === null) {
//         throw new Error('fetchXml');
//       }
  
//       const linkEntityElementCollection: Element[] = Array.from(fetchXml.querySelectorAll('link-entity'));
  
//       const namesOfRelatedEntityTypes: Map<string, RelatedEntityInfo> = new Map<string, RelatedEntityInfo>();
  
//       if (linkEntityElementCollection.length === 0) {
//         return namesOfRelatedEntityTypes;
//       }
  
//       linkEntityElementCollection.forEach((linkEntityElement) => {
//         // do not include intersect entities in the group of entities to be fetched
//         if (linkEntityElement.getAttribute('intersect') === 'true') {
//           return;
//         }
  
//         const nameAttribute: string | null = linkEntityElement.getAttribute('name'); // Type of the related entity.
  
//         if (nameAttribute === null) {
//           throw new Error("Attribute 'name' of element 'link-entity' not present");
//         }
  
//         const to = linkEntityElement.getAttribute('to');
//         const from = linkEntityElement.getAttribute('from');
  
//         const attributePathComponents: string[] = [];
//         let entityElement = linkEntityElement;
  
//         while (entityElement && entityElement.tagName.toLowerCase() !== 'entity') {
//           attributePathComponents.push(entityElement.getAttribute('alias')!); // Name of the field with the serves as a navigation property.
//           entityElement = entityElement.parentElement!;
//         }
  
//         if (entityElement) {
//           namesOfRelatedEntityTypes.set(
//             attributePathComponents.reverse().join(EntityView.attributePathSeparator),
//             {
//               to,
//               from,
//               name: nameAttribute,
//             }
//           );
//         }
//       });
  
//       return namesOfRelatedEntityTypes;
//     }
  
//     public getAttributeElement(attributePath: string, createIfNotPresent?: boolean): Element | null {
//       const { fetchXml } = this;
  
//       let entityElement: Element | null = fetchXml.querySelector(`entity`);
  
//       if (entityElement === null) {
//         throw new Error('Entity element not found in fetchxml');
//       }
  
//       const attributePathComponents: string[] = attributePath.split(EntityView.attributePathSeparator);
  
//       // Process navigation properties.
//       for (let i: number = 0; i < attributePathComponents.length - 1; i++) {
//         const pathComponent: string = attributePathComponents[i];
  
//         let linkEntityElement: Element | null = entityElement.querySelector(
//           `link-entity[alias=${pathComponent}]`
//         );
  
//         if (linkEntityElement === null && createIfNotPresent === true) {
//           linkEntityElement = fetchXml.createElement('link-entity');
//           linkEntityElement.setAttribute('alias', pathComponent);
//           entityElement.appendChild(linkEntityElement);
//         }
  
//         if (linkEntityElement === null) {
//           throw new Error('attributePath');
//         }
  
//         entityElement = linkEntityElement;
//       }
  
//       // Process property.
//       const attributeNamePathComponent: string = attributePathComponents[attributePathComponents.length - 1];
  
//       let attributeElement: Element | null = entityElement.querySelector(
//         `attribute[name=${attributeNamePathComponent}]`
//       );
  
//       if (attributeElement === null && createIfNotPresent === true) {
//         attributeElement = fetchXml.createElement('attribute');
//         attributeElement.setAttribute('name', attributeNamePathComponent);
//         entityElement.appendChild(attributeElement);
//       }
  
//       if (attributeElement === null) {
//         return null;
//       }
  
//       return attributeElement;
//     }
  
//     public clone(): EntityView {
//       const xmlSerializer: XMLSerializer = new XMLSerializer();
  
//       const serializedFetchXml: string = this.fetchXml ? xmlSerializer.serializeToString(this.fetchXml) : null;
  
//       const serializedLayoutXml: string = this.layoutXml
//         ? xmlSerializer.serializeToString(this.layoutXml)
//         : null;
  
//       const clonedView: EntityView = new EntityView(this.name, serializedFetchXml, serializedLayoutXml);
  
//       clonedView.id = this.id;
//       clonedView.description = this.description;
//       clonedView.columnTitles = this.columnTitles.slice(0);
//       clonedView.primaryEntityTypeName = this.primaryEntityTypeName;
//       clonedView.queryType = this.queryType;
  
//       return clonedView;
//     }
//   }