/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


/* eslint-disable @typescript-eslint/no-explicit-any */

import * as vscode from 'vscode';
import axios from 'axios';
import { INTELLIGENCE_SCOPE_DEFAULT, PROVIDER_ID } from "../../../common/services/Constants";
import { ERROR_CONSTANTS } from "../../../common/ErrorConstants";
import * as https from 'https'
import fs from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';
import { chromium } from 'playwright';
import * as chai from 'chai';
import path from 'path';
import { AIB_ENDPOINT, ApiRequestJson, ExpectedResponses } from '../common/constants';
import { IApiRequestParams, ITestLogParams } from '../common/interfaces';
const chaiExpect = chai.expect;
const violationOrUnclearResponseCodes : string[] = ["violation", "unclear", "unsupported"];

// <summary>
// Function to get the access token for the API
// </summary>
// <returns>Access token</returns>
export async function getIntelligenceAPIAccessToken() : Promise<{ accessToken: string }> {
    let accessToken = '';
    try {
        let session = await vscode.authentication.getSession(PROVIDER_ID, [`${INTELLIGENCE_SCOPE_DEFAULT}`], { silent: true });
        if (!session) {
            session = await vscode.authentication.getSession(PROVIDER_ID, [`${INTELLIGENCE_SCOPE_DEFAULT}`], { createIfNone: true });
        }
        accessToken = session?.accessToken ?? '';
        if (!accessToken) {
            console.log(ERROR_CONSTANTS.NO_ACCESS_TOKEN);
            throw new Error(ERROR_CONSTANTS.NO_ACCESS_TOKEN);
        }
    }
    catch (error) {
        const authError = (error as Error)
        console.log("Something went wrong: " + authError)
    }
    return { accessToken };
}

// <summary>
// Function to replace the placeholders in the JSON request with actual values
// Replace placeholders with actual values. We can pass more comma separated values matching the placeholders from request json.
// {0} - question
// {1} - activeFileContent
// {2} - dataverseEntity
// {3} - entityField
// {4} - fieldType
// </summary>
// <param name="values">Values to replace the placeholders</param>
// <returns>JSON request with actual values</returns>
export function ReplaceAPIRequestPlaceHoldersAndFormat(values: (string | string[])[]): any {
    return JSON.parse(JSON.stringify(ApiRequestJson, (_key, value) => {
        if (typeof value === 'string') {
            // Replace placeholders in the string
            const replacedValue = value.replace(/{(\d+)}/g, (match, index) => {
                const replacement = values[index];
                if (Array.isArray(replacement)) {
                    // Convert array values into a comma-separated string
                    return replacement.join(', ');
                }
                return replacement || match;
            });

            // Handle specific case where the string needs to be formatted as an array
            if (_key === 'targetColumns') {
                // Convert the formatted string to an array
                return replacedValue.replace(/,/g, '","').split('","').map(e => e.replace(/^"|"$/g, ''));
            }

            return replacedValue;
        }
        return value;
    }));
    
}  

// <summary>
// Function to create the API request parameters
// </summary>
// <param name="actualValues">Actual values to replace the placeholders</param>
// <param name="accessToken">Access token for the API</param>
// <returns>API request parameters</returns>
export function CreateAPIRequestParams(actualValues: (string | string[])[], accessToken: string) : IApiRequestParams
{
    const data = ReplaceAPIRequestPlaceHoldersAndFormat(actualValues);
    console.log('Data returned'+ JSON.stringify(data,null,2));
    return {
        aibEndPoint: AIB_ENDPOINT,
        apiToken: accessToken,
        data: data
    };
}

// <summary>
// Function to get the formatted date and time
// </summary>
// <returns>Formatted date and time</returns>
export function getFormattedDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hour}-${minute}-${second}`;
}

// <summary>
// Function to log data to HTML table.
// </summary>
// <param name="testLogParams">ITestLogParams</param>
export function log(testLogParams: ITestLogParams) {
    const statusColor = testLogParams.status === 'PASSED' ? 'green' : 'red';
    testLogParams.logStream.write(`
      <tr>
        <td style="width: 30%; text-align: left; vertical-align: top;">${testLogParams.testName}</td>
        <td style="width: 10%; text-align: left; vertical-align: top;">${testLogParams.testStartTime}</td>
        <td style="width: 10%; text-align: left; vertical-align: top;">${testLogParams.testEndTime}</td>
        <td style="width: 45%; text-align: left; vertical-align: top;">${testLogParams.actualResponse}</td>
        <td style="width: 5%; text-align: left; font-weight: bold; vertical-align: top; color: ${statusColor};">${testLogParams.status}</td>
      </tr>\n`);
  }

// <summary>
// Function to write the heading in the HTML file.
// </summary>
// <param name="logStream">Write stream</param>
// <param name="aibEndpoint">AIB endpoint</param>
export function writeHeading(logStream: fs.WriteStream, aibEndpoint: string) {
    logStream.write(`<fieldset>
      <legend>API Details</legend>
      <p><b>AIB Endpoint</b>: <a href="${aibEndpoint}">${aibEndpoint}</a></p>
    </fieldset>`);
}
  
// <summary>
// Function to write the table headers in the HTML file.
// </summary>
// <param name="logStream">Write stream</param>
export function writeTableHeaders(logStream: fs.WriteStream) {
    logStream.write(`
    <table>
        <thead>
            <tr>
                <th style="width: 30%;">Test Name</th>
                <th style="width: 10%;">Start Time</th>
                <th style="width: 10%;">End Time</th>
                <th style="width: 45%;">Copilot Response</th>
                <th style="width: 5%;">Status</th>
            </tr>
        </thead>
    <tbody>\n`);
}
  
// <summary>
// Function to close the HTML file.
// </summary>
// <param name="logStream">Write stream</param>
export function closeHtmlFile(logStream: fs.WriteStream) {
    logStream.write(`
        </tbody>
      </table>
    </body>
  </html>`);
    logStream.end();
}

// <summary>
// Function to create and execute the API request.
// </summary>
// <param name="testName">Test name</param>
// <param name="actualValues">Actual values to replace the placeholders</param>
// <param name="accessToken">Access token for the API</param>
// <param name="logStream">Write stream</param>
// <returns>API response</returns>
export async function CreateAndExecuteAPIRequest(testName: string, actualValues: (string | string[])[], accessToken: string, logStream: fs.WriteStream)
{
    let testLogParams: ITestLogParams;
    let testStartTime: Date = new Date();
    let testEndTime: Date;

    try {
        const params = CreateAPIRequestParams(actualValues, accessToken);

        // Required to get rid of the localhost exception: unable to verify the first certificate.
        const agent = new https.Agent();

        const headers = {
            'Content-Type': 'application/json',
            ...(params.aibEndPoint.includes('localhost')
            ? {
                'x-ms-client-principal-id': '9ba620dc-4b37-430e-b779-2f9a7e7a52a4',
                'x-ms-client-tenant-id': '9ba620dc-4b37-430e-b779-2f9a7e7a52a3',
            }
            : {}),
            Authorization: `Bearer ${params.apiToken}`,
        };

        testStartTime = new Date();

        const response = await axios.post(params.aibEndPoint, params.data, {
            httpsAgent: agent,
            headers: headers,
        });

        return response;
    } catch (error) {
        testEndTime = new Date();
        const knownError = error as Error;
        console.error(`API Error: ${knownError.message}`);
        testLogParams = {
            testName: testName,
            testStartTime: testStartTime,
            testEndTime: testEndTime,
            actualResponse: knownError.message,
            status: `FAILED`,
            logStream: logStream
        }
        log(testLogParams);
        throw knownError;
    }
}

export function ReturnFormattedAPIResponse(responseData : []) {
    if (!Array.isArray(responseData))
      return responseData;
  
    type ApiResponse = { displayText: string; code: string };
    type ApiResponseProperties = keyof ApiResponse;
    const properties: ApiResponseProperties[] = ['displayText', 'code'];
  
    let appendedString = '';
  
    // Check if responseData is an array
    if (Array.isArray(responseData)) {
      for (const item of responseData) {
        for (const property of properties) {
          const propertyValue : string = item[property];
          if (propertyValue !== undefined && propertyValue !== null && propertyValue !== 'explain') {
            // Used to replace <, >, and & characters with their corresponding HTML entities.
            // This ensures that the text is displayed as-is in the HTML report, and it won't be treated as HTML tags.
            const escapedText = propertyValue.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); //`<pre>${propertyValue}</pre>`;
            appendedString += escapedText + "<br><br>";
          }
        }
      }
    }
    return appendedString;
  }

export const formatString = (str: string, ...args: string[] | number[]) =>
    str.replace(/{(\d+)}/g, (match, index) => args[index].toString() || '');


export async function verifyAPIResponse(response:any) {
    chaiExpect(response).to.have.property('status');
    chaiExpect(response.status).to.equal(200);
    chaiExpect(response).to.have.property('data');
    chaiExpect(response.data).to.not.null;
    chaiExpect(response.data.operationStatus).to.be.equal('Success');
    const apiResponse = response.data.additionalData[0].properties.response;
    chaiExpect(JSON.stringify(apiResponse.useCase)).to.not.equal('unsupported');

    // Expect that apiResponse.Code is either undefined or does not include any value from the array
    chaiExpect(JSON.stringify(apiResponse.Code)).to.satisfy((code: string | unknown[] | undefined) => {
        return code === undefined || violationOrUnclearResponseCodes.every((value: string) => !code.includes(value));
    }, 'API response code should be either undefined or not include any of the violation codes');
    chaiExpect(JSON.stringify(apiResponse.displayText)).not.to.equal(ExpectedResponses.COPILOT_IT_UNSUPPORTED_EXPECTED_RESPONSE.displayText);

    console.log('apiResponse code '+ ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code))
}

export async function uploadPortal(){
    const options = {
        cwd: 'C:\\Users\\v-ankopuri\\AppData\\Local\\Microsoft\\PowerAppsCli',
      };
    const execAsync = promisify(exec);
    const { stdout, stderr } = await execAsync('pac paportal upload -p C:/Users/v-ankopuri/Downloads/CopilotSiteLatest/latest-site-for-copilot---site-uo67k -mv 2',options);
      chaiExpect(stdout.trim()).to.contain('Power Pages website upload succeeded');
      chaiExpect(stderr).to.be.empty;
}

export async function LaunchRunTime(pageName:string, timeout = false){
    const browser = await chromium.launch({ headless: false }); // Set headless: false to see the browser UI
      const page = await browser.newPage();
      if(timeout){
        await page.waitForTimeout(20000);
      }
      if(pageName == 'Home'){
        await page.goto('https://site-uo67k.powerappsportals.com/',{timeout:60000});
      }
      else{
        await page.goto(formatString('https://site-uo67k.powerappsportals.com/{0}/',pageName),{timeout:60000});
      }
      
      await page.waitForLoadState();
      await page.waitForLoadState('domcontentloaded');
      return page;
}

export function reportingForTests(){
    const testReportPath = path.resolve(__dirname, `../test-reports`); // testReportPath => ..\powerplatform-vscode\out\web\client\test\test-reports
// Ensure the log directory exists
if (!fs.existsSync(testReportPath)) {
  fs.mkdirSync(testReportPath);
}
const formattedDateTime = getFormattedDateTime();
// Create a write stream to the HTML file
const logFilePath = path.join(testReportPath, `test-report-${formattedDateTime}.html`);
const logStream = fs.createWriteStream(logFilePath, { flags: 'w' });
// Open the HTML file with initial structure
logStream.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Copilot Integration Test Report</title>
  <style>
  body {
    font-family: 'Arial', sans-serif;
    margin: 20px;
    background-color: #f8f9fa;
    font-size: 11px;
    color: #333;
  }
  h1 {
    color: #007bff;
  }
  h2 {
    color: #007bff;
  }
  h4 {
    margin-top: 20px;
    color: #007bff;
  }
  // fieldset {
  //   margin-top: 20px;
  //   border: 1px solid #ddd;
  //   padding: 10px;
  //   border-radius: 5px;
  // }
  fieldset {
    border: 1px dotted rgba(0, 0, 0, 0.2);
    border-radius: 5px;
    padding: 10px;
    margin-top: 20px;
  }
  legend {
    padding: 0 10px;
  }
  .summary {
    margin-top: 20px;
    padding: 10px;
    background-color: #007bff;
    color: #fff;
    border-radius: 5px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    background-color: #fff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    border-radius: 5px;
  }
  th, td {
    padding: 15px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }
  th {
    background-color: #007bff;
    color: #fff;
  }
  .failed {
    color: red;
    font-weight: bold;
  }
</style>
</head>
<body>
  <h2>Copilot Integration Test Report</h2>
`);
return logStream;
}

export async function reportAfterTestCompletes(testName:string,testStartTime: Date,response : any,logStream: fs.WriteStream) {
    // Record end time after test execution
    const testEndTime = new Date();
    const testLogParams: ITestLogParams = {
      testName: testName,
      testStartTime: testStartTime,
      testEndTime: testEndTime,
      actualResponse: ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response),
      status: 'PASSED',
      logStream: logStream
    }
    log(testLogParams);
}

export async function getAccessToken() {
    const apiToken = await getIntelligenceAPIAccessToken();
  return apiToken.accessToken;
}

export async function writeHeadingandTableHeaders(logStream:fs.WriteStream) {
    writeHeading(logStream, `${AIB_ENDPOINT}`);
    writeTableHeaders(logStream);
}

export { AIB_ENDPOINT, ITestLogParams };
