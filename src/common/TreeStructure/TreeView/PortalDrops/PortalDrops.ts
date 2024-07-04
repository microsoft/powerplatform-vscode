import { Drop } from 'liquidjs';
import { IDataResolver } from '../Utils/IDataResolver';

export class PortalDrop extends Drop {
  protected dataResolver: IDataResolver;

  constructor(dataResolver: IDataResolver) {
    super();
    this.dataResolver = dataResolver;
  }
}
