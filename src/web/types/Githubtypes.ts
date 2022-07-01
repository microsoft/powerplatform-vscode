import Abstractapptypes from "./Abstractapptypes";

export interface searchParams {
    repoName : string;
    dataSource: string;
    schema : string;
    additonalParams: string | undefined;
}

export default interface Githubtypes extends Abstractapptypes {
  entityName: string | undefined;
  entityId: string | undefined;
  queryParams: searchParams;
  }
