/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import Abstractapptypes from "./Abstractapptypes";

export interface searchParams {
    orgUrl : string;
    dataSource: string;
    columns : string;
    splitColumns : string;
    additionalParams: string | undefined;
}

export default interface Defaultapptypes extends Abstractapptypes {
  entityName: string | undefined;
  entityid: string | undefined;
  queryParams: searchParams;
  }
