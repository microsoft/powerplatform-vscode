import { AbstractEntity } from './AbstractEntity';

export interface IEntityAttributeMetadata extends AbstractEntity {
  attributeType: string;
  localizedDisplayName: string;
  logicalName: string;
}
