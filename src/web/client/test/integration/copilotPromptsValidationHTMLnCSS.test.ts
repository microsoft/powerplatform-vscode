/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


import { AIB_ENDPOINT, CreateAndExecuteAPIRequest, getIntelligenceAPIAccessToken, log, ITestLogParams, getFormattedDateTime, writeHeading, writeTableHeaders, closeHtmlFile, ReturnFormattedAPIResponse, verifyAPIResponse, uploadPortal, LaunchRunTime } from '../../utilities/copilotAutomationUtil';
const aibEndPoint = AIB_ENDPOINT;
let accessToken : string;
import fs from 'fs';
import path from 'path';
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
    const testName = "Write code to add 'Account' entity form to my webpage 'html' with some section code.";
    it(testName, async () => {
      const testStartTime = new Date();
      
      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        testName, // question
        "","adx_webpage","adx_copy","html",""
      ];  
      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);      
  
      // Assert API response
      await verifyAPIResponse(response);
      fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\web-pages\\html\\content-pages\\Html.en-US.webpage.copy.html', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
      await uploadPortal();
  
      console.log('Launch browser and navigate to run time');
      const page = await LaunchRunTime('Html');
  
      await page.waitForSelector('[aria-label="Basic Form"]', {timeout: 60000});
      await expect(page.locator('[aria-label="Basic Form"]')).toBeVisible();
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
    const testName = "Write code to add a button with name Test which should redirect to microsoft.com url";
    it(testName, async () => {
      const testStartTime = new Date();
      
      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        testName, // question
        "","adx_webpage","adx_copy","html",""
      ];  
      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
  
      // Assert API response
      await verifyAPIResponse(response);
      fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\web-pages\\html\\content-pages\\Html.en-US.webpage.copy.html', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
      await uploadPortal();
  
      console.log('Launch browser and navigate to run time');
      const browser = await chromium.launch({ headless: false }); // Set headless: false to see the browser UI
      const page = await browser.newPage();
      await page.waitForTimeout(20000);

      await page.goto('https://site-ej93f.powerappsportals.com/Html/',{timeout:60000});
      await page.waitForLoadState();
      await page.waitForLoadState('domcontentloaded');
  
      const url=await page.locator("//button[text()='Test']").getAttribute('onclick');
      await expect(url).toContain('microsft.com');

      await page.click("//button[text()='Test']");
      await expect(page.url()).toBe('https://www.microsoft.com/en-in/');
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
    const testName = "Write html code to add an image for microsoft and choose image from online";
    it(testName, async () => {
      const testStartTime = new Date();
      
      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        testName, // question
        "","adx_webpage","adx_copy","html",""
      ];
  
      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
      // Record end time after test execution
      const testEndTime = new Date();
  
      // Assert API response
      await verifyAPIResponse(response);
      fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\web-pages\\html\\content-pages\\Html.en-US.webpage.copy.html', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
      await uploadPortal();
  
      console.log('Launch browser and navigate to run time');
      const browser = await chromium.launch({ headless: false }); // Set headless: false to see the browser UI
      const page = await browser.newPage();
      await page.waitForTimeout(20000);

      await page.goto('https://site-ej93f.powerappsportals.com/Html/',{timeout:60000});
      await page.waitForLoadState();
      await page.waitForLoadState('domcontentloaded');
  
      await page.waitForSelector('img[alt="Microsoft Logo"]', {timeout: 60000});
      await expect(page.locator('img[alt="Microsoft Logo"]')).toBeVisible();
      
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
    const testName = "Write css code to change the first section color of home page to yellow";
    it.skip(testName, async () => {
      const testStartTime = new Date();
      
      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        testName, // question
      ];
      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
      
      // Assert API response
      await verifyAPIResponse(response);
      fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\web-pages\\home\\content-pages\\Home.en-US.webpage.custom_css.css', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
      await uploadPortal();
  
      console.log('Launch browser and navigate to run time');
      const browser = await chromium.launch({ headless: false }); // Set headless: false to see the browser UI
      const context = await browser.newContext({
        // Disable cache
        bypassCSP: true,
    });
      const page = await context.newPage();
      await page.waitForTimeout(20000);
      await page.goto('https://site-ej93f.powerappsportals.com/',{timeout:60000});
      await page.waitForLoadState();
      await page.waitForLoadState('domcontentloaded');
     
      const row = await page.locator('.sectionBlockLayout:first-of-type').first();
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
    const testName = "Write css code to change first existing button background color to red";
    it(testName, async () => {
      const testStartTime = new Date();
      
      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        testName, // question
      ];
      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
      
      // Assert API response
      await verifyAPIResponse(response);
      fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\web-pages\\home\\content-pages\\Home.en-US.webpage.custom_css.css', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
      await uploadPortal();
  
      console.log('Launch browser and navigate to run time');
      const browser = await chromium.launch({ headless: false }); // Set headless: false to see the browser UI
      const page = await browser.newPage();
      await page.waitForTimeout(20000);
      await page.goto('https://site-ej93f.powerappsportals.com/',{timeout:60000});
      await page.waitForLoadState();
      await page.waitForLoadState('domcontentloaded');
     
      const button = await page.locator('[class="button1"]').first();
      const backgroundColor = await button.evaluate((element) => {
        return window.getComputedStyle(element).backgroundColor;
      });
      expect(backgroundColor.toString()).toContain('rgb(255, 0, 0)');
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
    const testName = "Write css code to change button text to italic for all buttons";
    it(testName, async () => {
      const testStartTime = new Date();
      
      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        testName, // question
      ];
      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
      
      // Assert API response
      await verifyAPIResponse(response);
      fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\web-pages\\home\\content-pages\\Home.en-US.webpage.custom_css.css', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
      await uploadPortal();
  
      console.log('Launch browser and navigate to run time');
      const browser = await chromium.launch({ headless: false }); // Set headless: false to see the browser UI
      const page = await browser.newPage();
      await page.waitForTimeout(20000);
      await page.goto('https://site-ej93f.powerappsportals.com/',{timeout:60000});
      await page.waitForLoadState();
      await page.waitForLoadState('domcontentloaded');
     
      const buttons = await page.$$('[type="button"][class*="button"]');
      for (const selector of buttons) {
        const fontStyle = await selector?.evaluate((element) => {
          return window.getComputedStyle(element).fontStyle;
        });
        expect(fontStyle.toString()).toBe('italic');
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
    const testName = "Write css code to update first existing button background color to green important on hover";
    it(testName, async () => {
      const testStartTime = new Date();
      
      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        testName, // question
      ];
      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
      
      // Assert API response
      await verifyAPIResponse(response);
      fs.writeFileSync('C:\\Users\\v-ankopuri\\Downloads\\CopilotSiteLatest\\latest-site-for-copilot---site-ej93f\\web-pages\\home\\content-pages\\Home.en-US.webpage.custom_css.css', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
      await uploadPortal();
  
      console.log('Launch browser and navigate to run time');
      const browser = await chromium.launch({ headless: false }); // Set headless: false to see the browser UI
      const page = await browser.newPage();
      await page.waitForTimeout(20000);
      await page.goto('https://site-ej93f.powerappsportals.com/',{timeout:60000});
      await page.waitForLoadState();
      await page.waitForLoadState('domcontentloaded');
     
      const button = await page.locator('[class="button1"]').first();
      await button.hover();
      await page.waitForTimeout(5000);
      const backgroundColor = await button.evaluate((element) => {
        return window.getComputedStyle(element).backgroundColor;
      });
      expect(backgroundColor.toString()).toContain('rgb(0, 128, 0)');
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
