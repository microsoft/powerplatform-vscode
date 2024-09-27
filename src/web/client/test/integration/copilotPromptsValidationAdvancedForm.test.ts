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
  const testName = "Write JavaScript code for Phone field validation to check phone field value is in the valid format.";
  it.only(testName, async () => {
    const testStartTime = new Date();
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "telephone1","adx_entityform","","","account"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
    
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\advanced-forms\\multistep-form-1\\advanced-form-steps\\step1\\Step1.advancedformstep.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('Multistepform');
    await page.locator('#telephone1').fill('abc123');
    await page.locator('#name').fill('Test name');
    await page.locator('#NextButton').click();

    await expect(page.locator('#ValidationSummaryEntityFormView li')).toHaveText('Phone number is not in a valid format.')
    await page.locator('#telephone1').fill('+911234567890');
    await page.locator('#NextButton').click();
    
    await expect(page.locator('#ValidationSummaryEntityFormView li')).not.toBeVisible();
    await page.locator('#PreviousButton').click();
    await expect(page.locator('#ValidationSummaryEntityFormView li')).not.toBeVisible();
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

// Run tests for Copilot SUGGESTED prompts
describe('Copilot SUGGESTED prompts integration tests', async function () { 
  const testName = "Write javascript code to rename Next button to Forward";
  it.only(testName, async () => {
    const testStartTime = new Date();
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "NextButton","adx_entityform","","","account"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);

    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\advanced-forms\\multistep-form-1\\advanced-form-steps\\step1\\Step1.advancedformstep.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('Multistepform');

    expect(await page.getAttribute('#NextButton','value')).toBe('Forward');
    expect(await page.getAttribute('#NextButton','value')).not.toBe('Next');
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

// Run tests for Copilot SUGGESTED prompts
describe('Copilot SUGGESTED prompts integration tests', async function () { 
  const testName = "Write javascript code to make Phone field a required field";
  it.only(testName, async () => {
    const testStartTime = new Date();
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "telephone1","adx_entityform","","","account"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
    
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\advanced-forms\\multistep-form-1\\advanced-form-steps\\step1\\Step1.advancedformstep.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('Multistepform');

    await page.locator('#name').fill('Test name');
    await page.locator('#NextButton').click();
    await expect(page.locator('#ValidationSummaryEntityFormView li')).toHaveText('Phone is a required field.')

    await page.locator('#name').fill('Test name');
    await page.locator('#telephone1').fill('911234567890');
    await page.locator('#NextButton').click();
    
    await expect(page.locator('#ValidationSummaryEntityFormView li')).not.toBeVisible();
    await page.locator('#PreviousButton').click();
    await expect(page.locator('#ValidationSummaryEntityFormView li')).not.toBeVisible();
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

// Run tests for Copilot SUGGESTED prompts
describe('Copilot SUGGESTED prompts integration tests', async function () { 
  const testName = "Write javascript code for Account Number field to accept only numbers";
  it.only(testName, async () => {
    const testStartTime = new Date();
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "accountnumber","adx_entityform","","","account"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
    
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\advanced-forms\\multistep-form-1\\advanced-form-steps\\step2\\Step2.advancedformstep.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('Multistepform');

    await page.locator('#name').fill('Test name');
    await page.locator('#NextButton').click();

    await page.locator('#accountnumber').fill('123Abc');
    await page.locator('#NextButton').click();

    await expect(page.locator('#ValidationSummaryEntityFormView li')).toBeVisible();
    await expect(page.locator('#ValidationSummaryEntityFormView li')).toContainText('Account Number');
    await expect(page.locator('#ValidationSummaryEntityFormView li')).toHaveText('Account Number must be a numeric value.')
    await page.locator('#accountnumber').fill('1234567890');
    await page.locator('#NextButton').click();   
    
    await expect(page.locator('#ValidationSummaryEntityFormView li')).not.toBeVisible();
    await expect(page.locator('#MessageLabel')).toHaveText('Submission completed successfully.');
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
  }).timeout(240000);
});

// Run tests for Copilot SUGGESTED prompts
describe('Copilot SUGGESTED prompts integration tests', async function () { 
  const testName = "Write javascript code to make email field readonly in the form";
  it.only(testName, async () => {
    const testStartTime = new Date();
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "emailaddress1","adx_entityform","","","account"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
    
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\advanced-forms\\multistep-form-1\\advanced-form-steps\\step2\\Step2.advancedformstep.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('Multistepform');

    await page.locator('#name').fill('Test name');
    await page.locator('#NextButton').click();
    await expect(page.locator('#emailaddress1')).toHaveAttribute('readonly');
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
  }).timeout(240000);
});

// Close the HTML file with closing tags after all asynchronous code has completed
// Assuming your tests are using Promises, you can return a Promise from your test
// and use the `after` hook to close the logStream after all tests have completed.
after(async function () {
  closeHtmlFile(logStream);
});
