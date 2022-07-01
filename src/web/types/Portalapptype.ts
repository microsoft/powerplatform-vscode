import Abstractapptypes from "./Abstractapptypes";

export interface searchParams {
    orgUrl : string;
    dataSource: string;
    schema : string;
    additionalParams: string | undefined;
}

export default interface portalapptypes extends Abstractapptypes {
  entityName: string | undefined;
  entityId: string | undefined;
  queryParams: searchParams;
  }
