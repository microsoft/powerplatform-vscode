/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { CreateAndExecuteAPIRequest, closeHtmlFile, ReturnFormattedAPIResponse, verifyAPIResponse, uploadPortal, LaunchRunTime, reportingForTests, reportAfterTestCompletes, getAccessToken, writeHeadingandTableHeaders } from '../../utilities/copilotAutomationUtil';
import { AIB_ENDPOINT, ListConstants, ListQueries, PageConstants, Paths } from '../../common/constants';
const aibEndPoint = AIB_ENDPOINT;
let accessToken : string;
import fs from 'fs';
import { expect } from 'playwright/test';

const logStream = reportingForTests();
// Overriding the default 10 sec. timeout and setting it to 60 sec.
before(async function () {
  if (aibEndPoint === undefined)
    throw new Error("Endpoint is not defined. Test will fail intentionally.");
  this.timeout(120000);
  accessToken = await getAccessToken();

  // Write heading and table headers to the HTML file
  await writeHeadingandTableHeaders(logStream);
});

// Run tests for Copilot SUGGESTED prompts
describe('Copilot List integration tests', async function () {  
  it(ListQueries.Query1, async () => {
    const testStartTime = new Date();
    const testName = ListQueries.Query1;

    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "title","adx_entitylist","","","feedback"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
    
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.ListJsFile, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('List');

    const row = page.locator(ListConstants.DataRecord);
    const backgroundColor = await row.evaluate((element) => {
      return window.getComputedStyle(element).backgroundColor;
    });
    expect(backgroundColor.toString()).toContain(PageConstants.YellowColor);
    await page.close();

    // Record end time after test execution
    reportAfterTestCompletes(testName,testStartTime,response,logStream);
  }).timeout(120000);
    
  it(ListQueries.Query2, async () => {
    const testStartTime = new Date();
    const testName = ListQueries.Query2 ;
      
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "cr1ae_amount","adx_entitylist","","","feedback"
    ];  
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
  
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.ListJsFile, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('List');
  
    const elements=await page.$$(ListConstants.AmountColumn);
      for (const element of elements) {
        const textContent = await element.innerText();
        const amountValue=parseFloat(textContent.split('$')[1]);
        if(amountValue>500){
          const backgroundColor = await element.evaluate((element1) => {
            return window.getComputedStyle(element1).backgroundColor;
          });
          expect(backgroundColor.toString()).toContain(PageConstants.YellowColor); 
        }
      }
    await page.close();

    // Record end time after test execution
    reportAfterTestCompletes(testName,testStartTime,response,logStream);
  }).timeout(120000);
    
  it(ListQueries.Query3, async () => {
    const testStartTime = new Date();
    const testName = ListQueries.Query3;
      
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "cr1ae_amount","adx_entitylist","","","feedback"
    ];  
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
  
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.ListJsFile, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
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
    reportAfterTestCompletes(testName,testStartTime,response,logStream);
  }).timeout(120000);
     
  it(ListQueries.Query4, async () => {
    const testStartTime = new Date();
    const testName = ListQueries.Query4;
      
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "cr1ae_amount","adx_entitylist","","","feedback"
    ];  
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
  
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.ListJsFile, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
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
    reportAfterTestCompletes(testName,testStartTime,response,logStream);  
  }).timeout(120000);
});

// Close the HTML file with closing tags after all asynchronous code has completed
// Assuming your tests are using Promises, you can return a Promise from your test
// and use the `after` hook to close the logStream after all tests have completed.
after(async function () {
  closeHtmlFile(logStream);
});
