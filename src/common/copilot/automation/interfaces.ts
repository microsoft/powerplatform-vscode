/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export interface IApiRequestParams {
  sessionId: string,
  userPrompt: string | undefined;
  aibEndPoint: string;
  activeFileContent: string | undefined;
  accessToken?: string;
  datavserseEntity?: string;
  entityField?: string;
  fieldType?: string;
  targetColumns?: string[];
  targetEntity?: string;
}
