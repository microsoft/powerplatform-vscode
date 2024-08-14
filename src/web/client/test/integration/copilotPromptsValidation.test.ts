/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as chai from 'chai';
import { AIB_ENDPOINT, ExpectedResponses, CreateAndExecuteAPIRequest, getIntelligenceAPIAccessToken, log, ITestLogParams, getFormattedDateTime, writeHeading, writeTableHeaders, closeHtmlFile, ReturnFormattedAPIResponse } from '../../utilities/copilotAutomationUtil';
const chaiExpect = chai.expect;
const aibEndPoint = AIB_ENDPOINT;
let accessToken : string;
const violationOrUnclearResponseCodes : string[] = ["violation", "unclear", "unsupported"];
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { chromium } from 'playwright';
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
    const testName = "Write JavaScript code for name field validation in form.";
    it.skip(testName, async () => {
      const testStartTime = new Date();
      
      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        testName, // question
        ["adx_contactemail"],
      ];

      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
      // Record end time after test execution
      const testEndTime = new Date();

      // Assert API response
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
      fs.writeFileSync('C:\\Downloads\\CopilotSite\\site-for-copilot---site-boc8w\\basic-forms\\simple-contact-us-form\\simple-contact-us-form.basicform.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
      const options = {
      cwd: 'C:\\Users\\v-ankopuri.FAREAST\\AppData\\Local\\Microsoft\\PowerAppsCli',
      };

      // Execute a shell command with custom options
      const execAsync = promisify(exec);      
      const { stdout, stderr } = await execAsync('pac paportal upload -p C:/Downloads/CopilotSite/site-for-copilot---site-boc8w -mv 2',options);
      chaiExpect(stdout.trim()).to.contain('Power Pages website upload succeeded');
      chaiExpect(stderr).to.be.empty;

      console.log('Launch browser and navigate to run time');
      const browser = await chromium.launch({ headless: false }); // Set headless: false to see the browser UI
      const page = await browser.newPage();

      await page.goto('https://site-boc8w.powerappsportals.com/contact-us/',{timeout:60000});
      await page.waitForLoadState();
      await page.waitForLoadState('domcontentloaded');

      await page.locator('[aria-label="Email"]').fill('abcd@abc.com');
      await page.locator('[id="title"]').fill('Test title');
      await page.locator('[aria-label="Message"]').fill('Message');

      await page.locator('[id="InsertButton"]').click();
      await expect(page.locator("//li[text()='Name is a required field.']")).toBeVisible();

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
    const testName = "Write JavaScript code to hide email field in form.";
    it.skip(testName, async () => {
      const testStartTime = new Date();
      
      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        testName, // question
        ["adx_contactemail"],
      ];

      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
      // Record end time after test execution
      const testEndTime = new Date();

      // Assert API response
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

      fs.writeFileSync('C:\\Downloads\\CopilotSite\\site-for-copilot---site-boc8w\\basic-forms\\simple-contact-us-form\\simple-contact-us-form.basicform.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
      const options = {
        cwd: 'C:\\Users\\v-ankopuri.FAREAST\\AppData\\Local\\Microsoft\\PowerAppsCli',
      };
      const execAsync = promisify(exec);
      // Execute a shell command with custom options
      const { stdout, stderr } = await execAsync('pac paportal upload -p C:/Downloads/CopilotSite/site-for-copilot---site-boc8w -mv 2',options);
      chaiExpect(stdout.trim()).to.contain('Power Pages website upload succeeded');
      chaiExpect(stderr).to.be.empty;

      console.log('Launch browser and navigate to run time');
      const browser = await chromium.launch({ headless: false });
      const page = await browser.newPage();

      await page.goto('https://site-boc8w.powerappsportals.com/contact-us/',{timeout:60000});
      await page.waitForLoadState();
      await page.waitForLoadState('domcontentloaded');

      await page.locator('input[id="adx_createdbycontact"]').fill('Text name');
      await page.locator('[id="title"]').fill('Test title');
      await page.locator('[aria-label="Message"]').fill('Message');
      await expect(page.locator('[aria-label="Email"]')).toBeHidden()

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
    const testName = "Write JavaScript code to disable email field in form.";
    it.skip(testName, async () => {
      const testStartTime = new Date();
      
      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        testName, // question
        ["adx_contactemail"],
      ];

      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
      // Record end time after test execution
      const testEndTime = new Date();

      // Assert API response
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

      fs.writeFileSync('C:\\Downloads\\CopilotSite\\site-for-copilot---site-boc8w\\basic-forms\\simple-contact-us-form\\simple-contact-us-form.basicform.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
      const options = {
          cwd: 'C:\\Users\\v-ankopuri.FAREAST\\AppData\\Local\\Microsoft\\PowerAppsCli',
      };
      const execAsync = promisify(exec);

      // Execute a shell command with custom options
      const { stdout, stderr } = await execAsync('pac paportal upload -p C:/Downloads/CopilotSite/site-for-copilot---site-boc8w -mv 2',options);
      chaiExpect(stdout.trim()).to.contain('Power Pages website upload succeeded');
      chaiExpect(stderr).to.be.empty;

      console.log('Launch browser and navigate to run time');
      const browser = await chromium.launch({ headless: false });
      const page = await browser.newPage();

      await page.goto('https://site-boc8w.powerappsportals.com/contact-us/',{timeout:60000});
      await page.waitForLoadState();
      await page.waitForLoadState('domcontentloaded');

      await page.locator('input[id="adx_createdbycontact"]').fill('Text name');
      await page.locator('[id="title"]').fill('Test title');
      await page.locator('[aria-label="Message"]').fill('Message');

      await expect(page.locator('[aria-label="Email"]')).toBeDisabled()

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
    const testName = "Write JavaScript code for form field validation to check email field value is in the valid format.";
    it.only(testName, async () => {
      const testStartTime = new Date();
      
      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        testName, // question
        ["adx_contactemail"],"adx_entityform","","","feedback"
      ];

      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
      // Record end time after test execution
      const testEndTime = new Date();

      // Assert API response
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
      fs.writeFileSync('C:\\Downloads\\CopilotSite\\site-for-copilot---site-boc8w\\basic-forms\\simple-contact-us-form\\simple-contact-us-form.basicform.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));

      const options = {
        cwd: 'C:\\Users\\v-ankopuri.FAREAST\\AppData\\Local\\Microsoft\\PowerAppsCli',
      };
      const execAsync = promisify(exec);

      // Execute a shell command with custom options
      const { stdout, stderr } = await execAsync('pac paportal upload -p C:/Downloads/CopilotSite/site-for-copilot---site-boc8w -mv 2',options);
      chaiExpect(stdout.trim()).to.contain('Power Pages website upload succeeded');
      chaiExpect(stderr).to.be.empty;

      console.log('Launch browser and navigate to run time');
      const browser = await chromium.launch({ headless: false }); // Set headless: false to see the browser UI
      const page = await browser.newPage();

      await page.goto('https://site-boc8w.powerappsportals.com/contact-us/',{timeout:60000});
      await page.waitForLoadState();
      await page.waitForLoadState('domcontentloaded');

      await page.locator('input[id="adx_createdbycontact"]').fill('Text name');
      await page.locator('[id="title"]').fill('Test title');
      await page.locator('[aria-label="Message"]').fill('Message');
      await page.locator('[aria-label="Email"]').fill('abcd');

      await page.locator('[id="InsertButton"]').click();
      await expect(page.locator("//li[text()='Please enter a valid email address.']")).toBeVisible();


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

