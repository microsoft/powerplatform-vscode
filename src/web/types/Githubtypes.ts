/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import Abstractapptypes from "./Abstractapptypes";

export interface searchParams {
    repoName : string;
    dataSource: string;
    schema : string;
    additonalParams: string | undefined;
}

export default interface Githubtypes extends Abstractapptypes {
  queryParams: searchParams;
  }
