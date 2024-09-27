/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { AIB_ENDPOINT, CreateAndExecuteAPIRequest, getIntelligenceAPIAccessToken, log, ITestLogParams, getFormattedDateTime, writeHeading, writeTableHeaders, closeHtmlFile, ReturnFormattedAPIResponse, SuggestedPromptsConstants, formatString, verifyAPIResponse, uploadPortal, LaunchRunTime } from '../../utilities/copilotAutomationUtil';
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
    const testName = "Write JavaScript code for name field validation in form.";
    it(testName, async () => {
      // const testStartTime = new Date();
      
      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        testName, // question
        // ["adx_createdbycontact"],
        "Name,adx_createdbycontact,,Email,adx_contactemail,,Subject,title,,Message,comments,,Maximum Rating,maxrating,,Minimum Rating,minrating,,Status Reason,statuscode","adx_entityform","","","feedback"
      ];

      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);      

      // Assert API response
      await verifyAPIResponse(response);
      fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\basic-forms\\simple-contact-us-form\\simple-contact-us-form.basicform.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
      await uploadPortal();

      console.log('Launch browser and navigate to run time');
      const page = await LaunchRunTime('contact-us')

      await page.locator('[aria-label="Email"]').fill('abcd@abc.com');
      await page.locator('[id="title"]').fill('Test title');
      await page.locator('[aria-label="Message"]').fill('Message');

      await page.locator('[id="InsertButton"]').click();
      await expect(page.locator("//li[text()='Name is a required field.']")).toBeVisible();
      await page.close();

      // Record end time after test execution
      // const testEndTime = new Date();

      /* const testLogParams: ITestLogParams = {
        testName: testName,
        testStartTime: testStartTime,
        testEndTime: testEndTime,
        actualResponse: ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response),
        status: 'PASSED',
        logStream: logStream
      }
      log(testLogParams); */

    }).timeout(120000);
});

describe('Copilot SUGGESTED prompts integration tests', async function () {  
    const testName = "Write JavaScript code to hide email field in form.";
    it(testName, async () => {
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
      await verifyAPIResponse(response);
      fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\basic-forms\\simple-contact-us-form\\simple-contact-us-form.basicform.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
      await uploadPortal();

      console.log('Launch browser and navigate to run time');
      const page = await LaunchRunTime('contact-us')
      await page.locator('input[id="adx_createdbycontact"]').fill('Text name');
      await page.locator('[id="title"]').fill('Test title');
      await page.locator('[aria-label="Message"]').fill('Message');
      await expect(page.locator('[aria-label="Email"]')).toBeHidden();
      await page.close();

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
    it(testName, async () => {
      const testStartTime = new Date();
      
      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        testName, // question
        // ["adx_contactemail"],
        "Name,adx_createdbycontact,,Email,adx_contactemail,,Subject,title,,Message,comments,,Maximum Rating,maxrating,,Minimum Rating,minrating,,Status Reason,statuscode","adx_entityform","","","feedback"
      ];

      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
      // Record end time after test execution
      const testEndTime = new Date();

      // Assert API response
      await verifyAPIResponse(response);
      fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\basic-forms\\simple-contact-us-form\\simple-contact-us-form.basicform.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
      await uploadPortal();

      console.log('Launch browser and navigate to run time');
      const page = await LaunchRunTime('contact-us')

      await page.locator('input[id="adx_createdbycontact"]').fill('Text name');
      await page.locator('[id="title"]').fill('Test title');
      await page.locator('[aria-label="Message"]').fill('Message');

      await expect(page.locator('[aria-label="Email"]')).toBeDisabled();
      await page.close();

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
    it(testName, async () => {
      const testStartTime = new Date();
      
      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        testName, // question
        //["adx_contactemail"],"adx_entityform","","","feedback"
        "Name,adx_createdbycontact,,Email,adx_contactemail,,Subject,title,,Message,comments,,Maximum Rating,maxrating,,Minimum Rating,minrating,,Status Reason,statuscode","adx_entityform","","","feedback"
      ];

      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
      // Record end time after test execution
      const testEndTime = new Date();

      // Assert API response
      await verifyAPIResponse(response);
      fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\basic-forms\\simple-contact-us-form\\simple-contact-us-form.basicform.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
      await uploadPortal();

      console.log('Launch browser and navigate to run time');
      const page = await LaunchRunTime('contact-us')

      await page.locator('input[id="adx_createdbycontact"]').fill('Text name');
      await page.locator('[id="title"]').fill('Test title');
      await page.locator('[aria-label="Message"]').fill('Message');
      await page.locator('[aria-label="Email"]').fill('abcd');

      await page.locator('[id="InsertButton"]').click();
      await expect(page.locator("//li[text()='Please enter a valid email address.']")).toBeVisible();
      await page.close();

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
  Object.keys(SuggestedPromptsConstants).forEach(function (promptKey) {
    const testName = `${SuggestedPromptsConstants[promptKey]}`;
  it(testName, async () => {
    const testStartTime = new Date();
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "Name,adx_createdbycontact,,Email,adx_contactemail,,Subject,title,,Message,comments,,Maximum Rating,maxrating,,Minimum Rating,minrating,,Status Reason,statuscode","adx_entityform","","","feedback"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
    // Record end time after test execution
    const testEndTime = new Date();
    
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\basic-forms\\simple-contact-us-form\\simple-contact-us-form.basicform.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('contact-us')

    await page.locator('input[id="adx_createdbycontact"]').fill('Test name!@#$%^&*()');
    await page.locator('[id="title"]').fill('Test title@%&%&');
    await page.locator('[aria-label="Message"]').fill('Message');
    await page.locator('[aria-label="Email"]').fill('abcd@abc.com');
    await page.locator('[id="InsertButton"]').click();
   
    await expect(page.locator(formatString("//li[text()='{0} cannot contain special characters.']",promptKey))).toBeVisible();
    await page.locator('[id="title"]').fill('Test title');
    await page.locator('input[id="adx_createdbycontact"]').fill('Test name');
      await page.locator('[id="InsertButton"]').click();
      await expect(page.locator(formatString("//li[text()='{0} cannot contain special characters.']",promptKey))).not.toBeVisible();
    await expect(page.locator("//span[text()='Submission completed successfully.']")).toBeVisible();
    await page.close();

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
});

describe('Copilot SUGGESTED prompts integration tests', async function () { 
  const testName = "Write JavaScript code to add field validation to check for the length of the name field to be less than 5";
  it(testName, async () => {
    const testStartTime = new Date();
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "Name,adx_createdbycontact","adx_entityform","","","feedback"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
    // Record end time after test execution
    const testEndTime = new Date();
    
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\basic-forms\\simple-contact-us-form\\simple-contact-us-form.basicform.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('contact-us');

    await page.locator('input[id="adx_createdbycontact"]').fill('Text name');
    await page.locator('[id="title"]').fill('Test title');
    await page.locator('[aria-label="Message"]').fill('Message');
    await page.locator('[aria-label="Email"]').fill('abcd');
    await page.locator('[id="InsertButton"]').click();
    await expect(page.locator("//li[text()='Name must be less than 5 characters.']")).toBeVisible();
    await page.close();
    
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
  const testName = "Write Javascript code to add field validation to check for the value of the minimum rating field to not to be less than 10.";
  it(testName, async () => {
    const testStartTime = new Date();
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "Minimum Rating,minrating","adx_entityform","","","feedback"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
    // Record end time after test execution
    const testEndTime = new Date();
    
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\basic-forms\\simple-contact-us-form\\simple-contact-us-form.basicform.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('contact-us')

    await page.locator('input[id="adx_createdbycontact"]').fill('Text name');
    await page.locator('[id="title"]').fill('Test title');
    await page.locator('[aria-label="Message"]').fill('Message');
    await page.locator('[aria-label="Email"]').fill('abcd@abc.com');
    await page.locator('input[id="minrating"]').fill('9');
    await page.locator('[id="InsertButton"]').click();

    expect((await page.locator('[class*="validation-summary"]').innerText()).toLowerCase()).toContain('minimum rating must be at least 10.');
    await page.locator('input[id="minrating"]').fill('10');
    await page.locator('[id="InsertButton"]').click();
    await expect(page.locator("//li[text()='Minimum rating must be at least 10.']")).not.toBeVisible();
    await expect(page.locator("//span[text()='Submission completed successfully.']")).toBeVisible();
    
    await page.close();
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
  const testName = "Write Javascript code to add field validation to check for the value of the maximum rating field to not to be greater than 95.";
  it(testName, async () => {
    const testStartTime = new Date();
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "Maximum Rating,maxrating","adx_entityform","","","feedback"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
    // Record end time after test execution
    const testEndTime = new Date();
    // Assert API response
      await verifyAPIResponse(response);
      fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\basic-forms\\simple-contact-us-form\\simple-contact-us-form.basicform.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
      await uploadPortal();

      console.log('Launch browser and navigate to run time');
      const page = await LaunchRunTime('contact-us')

    await page.locator('input[id="adx_createdbycontact"]').fill('Text name');
    await page.locator('[id="title"]').fill('Test title');
    await page.locator('[aria-label="Message"]').fill('Message');
    await page.locator('[aria-label="Email"]').fill('abcd@abc.com');
    await page.locator('input[id="maxrating"]').fill('96');
    await page.locator('[id="InsertButton"]').click();
    await expect(page.locator("//li[text()='Maximum Rating must not be greater than 95.']")).toBeVisible();
    await page.locator('input[id="maxrating"]').fill('95');
    await page.locator('[id="InsertButton"]').click();
    await expect(page.locator("//li[text()='Maximum Rating must not be greater than 95.']")).not.toBeVisible();
    await expect(page.locator("//span[text()='Submission completed successfully.']")).toBeVisible();
    await page.close();

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
  const testName = "Write Javascript code to add field validation to check for the value of the minimum rating field to not to be less than 5 and maximum rating not to be greater than 95.";
  it(testName, async () => {
    const testStartTime = new Date();
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "Maximum Rating,maxrating,Minimum Rating,minrating","adx_entityform","","","feedback"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
    // Record end time after test execution
    const testEndTime = new Date();
    
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\basic-forms\\simple-contact-us-form\\simple-contact-us-form.basicform.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('contact-us')

    await page.locator('input[id="adx_createdbycontact"]').fill('Text name');
    await page.locator('[id="title"]').fill('Test title');
    await page.locator('[aria-label="Message"]').fill('Message');
    await page.locator('[aria-label="Email"]').fill('abcd@abc.com');
    await page.locator('input[id="minrating"]').fill('4');
    await page.locator('input[id="maxrating"]').fill('96');
    await page.locator('[id="InsertButton"]').click();

    await expect(page.locator("//li[text()='Minimum Rating must be at least 5.']")).toBeVisible();
    await expect(page.locator("//li[text()='Maximum Rating must be at most 95.']")).toBeVisible();
    await page.locator('input[id="minrating"]').fill('10');
    await page.locator('input[id="maxrating"]').fill('90');
    await page.locator('[id="InsertButton"]').click();

    await expect(page.locator("//li[text()='Minimum Rating must be at least 5.']")).not.toBeVisible();
    await expect(page.locator("//li[text()='Maximum Rating must be at most 95.']")).not.toBeVisible();
    await expect(page.locator("//span[text()='Submission completed successfully.']")).toBeVisible();    
    await page.close();

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

