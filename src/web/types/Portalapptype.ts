/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import Abstractapptypes from "./Abstractapptypes";

export interface searchParams {
    orgUrl : string;
    dataSource: string;
    schema : string;
    additionalParams: string | undefined;
}

export default interface portalapptypes extends Abstractapptypes {
  queryParams: searchParams;
  }
