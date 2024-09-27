/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { AIB_ENDPOINT, CreateAndExecuteAPIRequest, getIntelligenceAPIAccessToken, log, ITestLogParams, getFormattedDateTime, writeHeading, writeTableHeaders, closeHtmlFile, ReturnFormattedAPIResponse, LaunchRunTime, uploadPortal, verifyAPIResponse } from '../../utilities/copilotAutomationUtil';
const aibEndPoint = AIB_ENDPOINT;
let accessToken : string;
import fs from 'fs';
import path from 'path';
import { expect } from 'playwright/test';
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
// Overriding the default 10 sec. timeout and setting it to 60 sec.
before(async function () {
  if (aibEndPoint === undefined)
    throw new Error("Endpoint is not defined. Test will fail intentionally.");
  this.timeout(120000);
  const apiToken = await getIntelligenceAPIAccessToken();
  accessToken = apiToken.accessToken;
  // Write heading and table headers to the HTML file
  writeHeading(logStream, `${AIB_ENDPOINT}`);
  writeTableHeaders(logStream);
});
// Run tests for Copilot SUGGESTED prompts
describe('Copilot SUGGESTED prompts integration tests', async function () { 
  const testName = "Write JavaScript code to highlight the row where title column value is rf in table list.";
  it(testName, async () => {
    const testStartTime = new Date();
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "title","adx_entitylist","","","feedback"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
    
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\lists\\Active-Feedback.list.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('List');

    const row=await page.locator('tr[data-name="rf"]');
    const backgroundColor = await row.evaluate((element) => {
      return window.getComputedStyle(element).backgroundColor;
    });
    expect(backgroundColor.toString()).toContain('rgb(255, 255, 0)');

    await page.close();

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
  }).timeout(120000);
});
describe('Copilot SUGGESTED prompts integration tests', async function () { 
    const testName = "Write javascript code to Mark rows with amount > 500 with yellow and amount datatype is dollars";
    it(testName, async () => {
      const testStartTime = new Date();
      
      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        testName, // question
        "cr1ae_amount","adx_entitylist","","","feedback"
      ];  
      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
  
      // Assert API response
      await verifyAPIResponse(response);
      fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\lists\\Active-Feedback.list.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
      await uploadPortal();

      console.log('Launch browser and navigate to run time');
      const page = await LaunchRunTime('List');
  
      const elements=await page.$$('[data-attribute="cr1ae_amount"]');
      for (const element of elements) {
        const textContent = await element.innerText();
        const amountValue=parseFloat(textContent.split('$')[1]);
        if(amountValue>500){
            const backgroundColor = await element.evaluate((element1) => {
                return window.getComputedStyle(element1).backgroundColor;
              });
          
              expect(backgroundColor.toString()).toContain('rgb(255, 255, 0)'); 
        }
      }

      await page.close();
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
  
    }).timeout(120000);
  });
  describe('Copilot SUGGESTED prompts integration tests', async function () { 
    const testName = "write javascript code to arrange amount column values in descending order";
    it(testName, async () => {
      const testStartTime = new Date();
      
      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        testName, // question
        "cr1ae_amount","adx_entitylist","","","feedback"
      ];
  
      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
  
      // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\lists\\Active-Feedback.list.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('List');
  
    const amounts = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-attribute="cr1ae_amount"]');
      return Array.from(elements).map(el => el.textContent || '').map(text => parseFloat(text.replace('$', '').trim()));
    });

    // Check if amounts are in descending order
    const isDescending = amounts.every((value, index, array) => index === 0 || value <= array[index - 1]);
    expect(isDescending).toBeTruthy();
    await page.close();

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
  
    }).timeout(120000);
  });
  describe('Copilot SUGGESTED prompts integration tests', async function () { 
    const testName = "write javascript code to arrange amount column values in ascending order";
    it(testName, async () => {
      const testStartTime = new Date();
      
      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        testName, // question
        "cr1ae_amount","adx_entitylist","","","feedback"
      ];  
      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
  
      // Assert API response
      await verifyAPIResponse(response);
      fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\lists\\Active-Feedback.list.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
      await uploadPortal();

      console.log('Launch browser and navigate to run time');
      const page = await LaunchRunTime('List');
  
      const amounts = await page.evaluate(() => {
        const elements = document.querySelectorAll('[data-attribute="cr1ae_amount"]');
        return Array.from(elements).map(el => el.textContent || '').map(text => parseFloat(text.replace('$', '').trim()));
      });
      // Check if amounts are in ascending order
      const isAscending = amounts.every((value, index, array) => index === 0 || value >= array[index - 1]);
      expect(isAscending).toBeTruthy();

      await page.close();
      
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
  
    }).timeout(120000);
  });

// Close the HTML file with closing tags after all asynchronous code has completed
// Assuming your tests are using Promises, you can return a Promise from your test
// and use the `after` hook to close the logStream after all tests have completed.
after(async function () {
  closeHtmlFile(logStream);
});
