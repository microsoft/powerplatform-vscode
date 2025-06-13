/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import fetch, { RequestInit } from "node-fetch";
import https from "https";
import * as vscode from "vscode";
// import {
//     INTELLIGENCE_SCOPE_DEFAULT,
//     PROVIDER_ID
// } from "../../../../src/web/client/common/constants";
// import { ERRORS } from "../../../web/client/common/errorHandler";
import { INAPPROPRIATE_CONTENT, INPUT_CONTENT_FILTERED, INVALID_INFERENCE_INPUT, InvalidResponse, MalaciousScenerioResponse, NetworkError, PROMPT_LIMIT_EXCEEDED, PromptLimitExceededResponse, RELEVANCY_CHECK_FAILED, RateLimitingResponse, UnauthorizedResponse } from "../constants";
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as yaml from 'yaml';
import path from "path";
import { v4 as uuidv4 } from 'uuid'
import { IApiRequestParams } from "./interfaces";
import { getExtensionVersion } from "../../utilities/Utils";
import { INTELLIGENCE_SCOPE_DEFAULT, PROVIDER_ID } from "../../services/Constants";
import { EXTENSION_NAME } from "../../constants";

const clientType = EXTENSION_NAME + '-' + 'Desktop';
const clientVersion = getExtensionVersion();
const PASS = "PASS";
const FAIL = "FAIL";
const PROCESSED = "PROCESSED";
const skipCodes = ["", null, undefined, "violation", "unclear", "explain"];

//<summary>
// This function is used to get the access token for the Intelligence API
//</summary>
//<returns>Access token</returns>
export async function getIntelligenceAPIAccessToken() : Promise<{ accessToken: string }> {
    let accessToken = '';
    try {
        let session = await vscode.authentication.getSession(PROVIDER_ID, [`${INTELLIGENCE_SCOPE_DEFAULT}`], { silent: true });
        if (!session) {
            session = await vscode.authentication.getSession(PROVIDER_ID, [`${INTELLIGENCE_SCOPE_DEFAULT}`], { createIfNone: true });
        }
        accessToken = session?.accessToken ?? '';
        if (!accessToken) {
            console.log("Access token is not available. Please login to the Intelligence API.");
            throw new Error("Access token is not available. Please login to the Intelligence API.");
        }
    }
    catch (error) {
        const authError = (error as Error)
        console.log("Something went wrong: " + authError)
    }
    return { accessToken };
}

//<summary>
// This function is used to process the Excel file and update the API response
//</summary>
//<returns></returns>
export async function processExcelFile() {
  let workbook: ExcelJS.Workbook | undefined = undefined;
  let excelFilePath: string | undefined = undefined;

  try {
    const yamlFilePath = path.resolve(__dirname, "../src/common/copilot/automation/setup/config.yaml");
    // Read the YAML file content
    const yamlContent = fs.readFileSync(yamlFilePath, 'utf8');
    // Parse the YAML content into a JavaScript object
    const configContent = yaml.parse(yamlContent);
    const excelFileName = configContent.excel_file_name;
    excelFilePath = path.resolve(__dirname, `../src/common/copilot/automation/setup/${excelFileName}`);
    const aibEndpoint = configContent.endpoint;

    if (!fs.existsSync(yamlFilePath) || !fs.existsSync(excelFilePath) || !aibEndpoint) {
      console.error("Invalid configuration. Check YAML file, Excel file, and AIB endpoint.");
      return;
    }

    // Extract the properties from the configuration file and set the default values.
    const {
    //   allowed_languages: allowedLanguages,
      input_prompt_column_index: promptColumnIndex,
      active_file_content_column_index: activeFileContentColumnIndex,
      no_of_requests_to_process_and_try_save_to_excel_operation: noOfRequestsToProcessAndSaveToExcelFile,
      dataverseEntity: dataverseEntity,
      entityField: entityField,
      fieldType: fieldType,
      api_response_column_index: apiResponseColumnIndex,
      test_result_column_index: testResultColumnIndex,
      status_column_index: statusColumnIndex,
      targetColumns: targetColumns,
      subCategory_column_index: subCategoryColumnIndex,
    } = configContent;

    workbook = new ExcelJS.Workbook();
    console.log("Reading excel file...");

    await workbook.xlsx.readFile(excelFilePath);

    // Process each sheet in the Excel file
    for (const worksheet of workbook.worksheets) {
      const sheetStartTime = new Date();
      console.log(`Started processing sheet ${worksheet.id} : ${worksheet.name} at ${sheetStartTime.toLocaleTimeString()}`);

      const sheetsToIgnore: string[] = configContent.sheets_to_ignore;

      // Skip the sheet if it is mentioned in the configuration file.
      if (sheetsToIgnore && sheetsToIgnore.includes(worksheet.name)) {
        console.log(`Skipped sheet ${worksheet.id} : ${worksheet.name} as per the configuration.`);
        continue;
      }

      // Determine the row number to start processing the sheet.
      let rowNumber = configContent.is_header_in_excel_flag ? 2 : 1;

      // Define the properties to be extracted from the API response.
      type ApiResponse = { displayText: string; code: string, language: string, useCase: string};
      type ApiResponseProperties = keyof ApiResponse;
      const properties: ApiResponseProperties[] = ['displayText', 'code']; // Properties to be extracted from the API response.

      let isRateLimited = false;
      let recordCounter = 0; // Counter to save the Excel file after processing configured number of records.

      // Process each row in the sheet
      for (rowNumber; rowNumber <= worksheet.actualRowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const testStatusColumnCell = row.getCell(statusColumnIndex);

        /* Determine if the row should be processed.
          If the prompt column is empty, skip the row.
          If the test status column is not empty, skip the row.
          If the API response column is not empty, skip the row.
          If the API response is invalid, skip the row. */
        const shouldProcessRow =
          row.getCell(promptColumnIndex).value !== undefined
            && (testStatusColumnCell.value === null || testStatusColumnCell.text === "" || testStatusColumnCell.text === undefined ||
                row.getCell(apiResponseColumnIndex).value === InvalidResponse[0].displayText ||
                row.getCell(apiResponseColumnIndex).value === RateLimitingResponse[0].displayText);

        // If the row is not processed already, consider for processing.
        if (shouldProcessRow) {
          const userPrompt = row.getCell(promptColumnIndex).value?.toString();
          const activeFileContent = activeFileContentColumnIndex === undefined || activeFileContentColumnIndex === null ? '' : row.getCell(activeFileContentColumnIndex).value?.toString();
          const dataverseEntityValue = dataverseEntity === undefined || dataverseEntity === null ? '' : dataverseEntity;
          const entityFieldValue = entityField === undefined || entityField === null ? '' : entityField;
          const fieldTypeValue = fieldType === undefined || fieldType === null ? '' : fieldType;
          const targetColumnsValue = targetColumns === undefined || targetColumns === null ? [] : targetColumns;

          console.log(`Processing Sheet ${worksheet.id}: ${worksheet.name}, Row: ${rowNumber}, prompt: ${userPrompt}`);

          // Prepare the API request parameters.
          const apiRequestParams: IApiRequestParams = {
            sessionId: uuidv4(),
            userPrompt: userPrompt,
            aibEndPoint: aibEndpoint,
            activeFileContent: activeFileContent,
            datavserseEntity: dataverseEntityValue,
            entityField: entityFieldValue,
            fieldType: fieldTypeValue,
            targetColumns: targetColumnsValue,
            targetEntity: '',
          };

          // If the API request parameters do not have an access token, get the token.
          if (apiRequestParams.accessToken === undefined) {
            const intelligenceApiToken = getIntelligenceAPIAccessToken();
            apiRequestParams.accessToken = (await intelligenceApiToken).accessToken;
          }

          // Send the API request and process the response.
          let apiResponse = await sendApiRequest(apiRequestParams);

          // If the API response is null or undefined, skip the row.
          if (apiResponse === null || apiResponse === undefined) {
            continue;
          }

          // If the API response is Unauthorized, renew the token and send the API request again.
          if (apiResponse === UnauthorizedResponse) {
            console.log(`Token Expired. Renewing token and sending the API request again..`);
            const intelligenceApiToken = getIntelligenceAPIAccessToken();
            apiRequestParams.accessToken = (await intelligenceApiToken).accessToken;
            apiResponse = await sendApiRequest(apiRequestParams);
          }

          // Check if the API response is RateLimited.
          if (!isRateLimited && [RateLimitingResponse, NetworkError].includes(apiResponse)) {
            isRateLimited = true;
          }

          // Retry the API request if the response is RateLimited.
          let retry = 0;
          while (isRateLimited == true && retry < 5) {
            const retryAfterSeconds = 60;
            console.log(`Something went wrong. Retrying after ${retryAfterSeconds} seconds...`);
            await delay(retryAfterSeconds * 1000);
            apiResponse = await sendApiRequest(apiRequestParams);
            retry++;
            // If the API response is not RateLimited, reset the flag.
            if (![RateLimitingResponse, NetworkError].includes(apiResponse)) {
              isRateLimited = false;
            }
          }

          // If the API request fails after multiple retries, throw an error.
          if (isRateLimited && retry > 0) {
            throw new Error("API request failed after multiple retries.");
          }

          const maliciousResponse = MalaciousScenerioResponse[0].displayText;
          //const apiResponseObject = apiResponse[0] as ApiResponse;

          // If the API response malicious and the language is NOT ALLOWED, update the Excel file with the API response and test result.
          // OR If the API response is not malicious and the language is ALLOWED, update the Excel file with the API response and test result.
          if (apiResponse[0].displayText === maliciousResponse
            //  &&(!apiResponseObject.language || !allowedLanguages.every((type: string) => type.trim().toLowerCase() === apiResponseObject.language.toLowerCase())


           || (apiResponse[0].displayText !== maliciousResponse && apiResponse[0].code)
            // && apiResponseObject.language && allowedLanguages.map((type: string) => type.trim().toLowerCase()).includes(apiResponseObject.language.toLowerCase())
        )
          {
            row.getCell(testResultColumnIndex).value = PASS;
            if (skipCodes.includes(apiResponse[0].code)) {
                row.getCell(apiResponseColumnIndex).value = apiResponse[0].displayText;
            } else{
                row.getCell(apiResponseColumnIndex).value = apiResponse[0];
                row.getCell(subCategoryColumnIndex).value = apiResponse[apiResponse.length - 1]
            }

          }
          else
          {
            row.getCell(testResultColumnIndex).value = FAIL;
            // If the API response is an array, extract the properties and update the Excel file.
            if (Array.isArray(apiResponse)) {
              let result = '';
              for (const item of apiResponse) {
                for (const property of properties) {
                  result += item[property] + "\n";
                }
              }
              row.getCell(apiResponseColumnIndex).value = result;
            }
            else
            {
              row.getCell(apiResponseColumnIndex).value = apiResponse;
            }
          }

          recordCounter++;
          row.getCell(statusColumnIndex).value = PROCESSED;

          // Note that the row is updated with the API response BUT not saved to the Excel file yet.
          console.log(`Row ${rowNumber} updated with API response.`);

          // Save the Excel file after processing configured number of records.
          if (recordCounter === noOfRequestsToProcessAndSaveToExcelFile) {
            await saveExcelFile(workbook, excelFilePath);
            console.log(`Excel file saved after processing 10 records`);
            recordCounter = 0;
          }
        }
      }

      const sheetEndTime = new Date();
      const processingTime = sheetEndTime.getTime() - sheetStartTime.getTime();
      console.log(
        `Finished processing sheet ${worksheet.id}: ${worksheet.name} at ${sheetEndTime}. Total time taken to complete processing ${worksheet.actualRowCount} rows is: ${processingTime} ms`
      );
    }
  }
  catch (error) {
    console.error("Error processing the excel file:", error);
    return;
  }
  // Finally block to save the Excel file after processing all the records.
  finally {
    if (workbook && excelFilePath) {
      try {
       await saveExcelFile(workbook, excelFilePath);
        console.log(`Excel file saved after processing all the records`);
      } catch (saveError) {
        console.error("Error saving the Excel file:", saveError);
      }
    } else {
      console.error("Workbook or Excel file path is undefined.");
    }
  }
}

//<summary>
// This function is used to save the Excel file after processing the records
//</summary>
//<param name="workbook">Excel workbook</param>
//<returns></returns>
async function saveExcelFile(workbook: ExcelJS.Workbook, filePath: string) {
  try {
    console.log(`Saving Excel file..`);
    await workbook.xlsx.writeFile(filePath);
    console.log(`Saved successfully!`);
  } catch (error) {
    console.error('Error saving Excel file:', error);
  }
}

//<summary>
// This function is used to send the API request to the AIB endpoint
//</summary>
//<param name="apiRequestParams">API request parameters</param>
//<returns>API response</returns>
export async function sendApiRequest(apiRequestParams: IApiRequestParams) {
    if (!apiRequestParams.aibEndPoint) {
      return NetworkError;
    }

    const isLocalHost = apiRequestParams.aibEndPoint.includes('localhost');

    const apiToken = isLocalHost ? "" : (apiRequestParams.accessToken ?? (await getIntelligenceAPIAccessToken()).accessToken);

    const question = apiRequestParams.userPrompt?.replace(/"/g, '\\"');
    const activeFileContent = apiRequestParams.activeFileContent?.replace(/"/g, '\\"');

    const requestBody = {
      "question": question,
      "top": 1,
      "context": {
        "sessionId": apiRequestParams.sessionId,
        "scenario": "PowerPagesProDev",
        "subScenario": "PowerPagesProDevGeneric",
        "version": "V1",
        "information": {
          "dataverseEntity": apiRequestParams.datavserseEntity,
          "entityField": apiRequestParams.entityField,
          "fieldType": apiRequestParams.fieldType,
          "activeFileContent": activeFileContent,
          "clientType": clientType,
          "clientVersion": clientVersion,
          "targetEntity": "",
          "targetColumns": [],
        }
      }
    };

    //Required for testing with localhost
    const agent = new https.Agent({
        rejectUnauthorized: false,
    });

    const requestInit: RequestInit = {
      method: "POST",
      headers: {
        'Content-Type': "application/json",
        ...(isLocalHost
        ? {
            'x-ms-client-principal-id': '9ba620dc-4b37-430e-b779-2f9a7e7a52a4',
            'x-ms-client-tenant-id': '9ba620dc-4b37-430e-b779-2f9a7e7a52a3',
        }
        : {}),
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify(requestBody),
      agent: agent,
    }

    try {

      const response = await fetch(apiRequestParams.aibEndPoint, {
        ...requestInit,
      });

      if (response.ok) {
        try {
          const jsonResponse = await response.json();

          if (jsonResponse.operationStatus === 'Success') {
            if (jsonResponse.additionalData && Array.isArray(jsonResponse.additionalData) && jsonResponse.additionalData.length > 0) {
              const additionalData = jsonResponse.additionalData[0];
              if (additionalData.properties && additionalData.properties.response) {
                const responseMessage = additionalData.properties.response;
                responseMessage.push(additionalData.suggestions.subCategory ?? '');
                return responseMessage;
              }
            }
          }
          else {
            // Error from AIB with status code 200
            const errorMessage = jsonResponse.error.messages[0];
            return [{ displayText: errorMessage, code: '' }];
          }
          throw new Error("Invalid response format");
        } catch (error) {
          return InvalidResponse;
        }
      } else {
        try {
          if (response.status === 429) {
            return RateLimitingResponse;
          }
          else if (response.status === 401) {
            return UnauthorizedResponse;
          }
          const errorResponse = await response.json();
          const errorCode = errorResponse.error && errorResponse.error.code;
          const errorMessage = errorResponse.error && errorResponse.error.messages[0];

          if (errorCode === RELEVANCY_CHECK_FAILED || errorCode === INAPPROPRIATE_CONTENT || errorCode === INPUT_CONTENT_FILTERED) {
            return MalaciousScenerioResponse;
          }
          else if (errorCode === PROMPT_LIMIT_EXCEEDED || errorCode === INVALID_INFERENCE_INPUT) {
            return PromptLimitExceededResponse;
          }
          else if (errorMessage) {
            return errorMessage; // InvalidResponse to be returned?
          }
        } catch (error) {
          return InvalidResponse;
        }
      }
    } catch (error) {
      return NetworkError;
    }
}

// Utility function to introduce a delay
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
