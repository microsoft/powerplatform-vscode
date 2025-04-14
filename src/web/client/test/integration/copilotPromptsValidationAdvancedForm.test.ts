/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { CreateAndExecuteAPIRequest, closeHtmlFile, ReturnFormattedAPIResponse, verifyAPIResponse, uploadPortal, LaunchRunTime, reportingForTests, reportAfterTestCompletes, getAccessToken, writeHeadingandTableHeaders } from '../../utilities/copilotAutomationUtil';
import { AIB_ENDPOINT, AdvanceFormConstants, AdvancedFormQueries, Paths } from '../../common/constants';
const aibEndPoint = AIB_ENDPOINT;
let accessToken: string;
import fs from 'fs';
import { expect } from 'playwright/test';

const logStream = reportingForTests();
before(async function () {
  if (aibEndPoint === undefined)
    throw new Error("Endpoint is not defined. Test will fail intentionally.");
  this.timeout(120000);
  accessToken = await getAccessToken();

  // Write heading and table headers to the HTML file
  await writeHeadingandTableHeaders(logStream);
});

// Run tests for Copilot SUGGESTED prompts
describe('Copilot SUGGESTED prompts integration tests', async function () {  
  it(AdvancedFormQueries.Query1, async () => {
    const testStartTime = new Date();
    const testName = AdvancedFormQueries.Query1;
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "telephone1","adx_entityform","","","account"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
    
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.AdvFormStep1JsFile, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('Multistepform');
    await page.locator(AdvanceFormConstants.PhoneField).fill('abc123');
    await page.locator(AdvanceFormConstants.NameField).fill('Test name');
    await page.locator(AdvanceFormConstants.NextButton).click();

    await expect(page.locator(AdvanceFormConstants.ValidationSummary)).toHaveText('Phone number is not in a valid format.')
    await page.locator(AdvanceFormConstants.PhoneField).fill('+911234567890');
    await page.locator(AdvanceFormConstants.NextButton).click();
    
    await expect(page.locator(AdvanceFormConstants.ValidationSummary)).not.toBeVisible();
    await page.locator(AdvanceFormConstants.PreviousButton).click();
    await expect(page.locator(AdvanceFormConstants.ValidationSummary)).not.toBeVisible();
    await page.close();

    // Record end time after test execution
    reportAfterTestCompletes(testName, testStartTime, response, logStream);
  }).timeout(120000);

  it( AdvancedFormQueries.Query2, async () => {
    const testStartTime = new Date();
    const testName = AdvancedFormQueries.Query2;
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "NextButton","adx_entityform","","","account"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);

    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.AdvFormStep1JsFile, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('Multistepform');

    expect(await page.getAttribute(AdvanceFormConstants.NextButton,'value')).toBe('Forward');
    expect(await page.getAttribute(AdvanceFormConstants.NextButton,'value')).not.toBe('Next');
    await page.close();

    // Record end time after test execution
    reportAfterTestCompletes(testName, testStartTime, response, logStream);
  }).timeout(120000);

  it(AdvancedFormQueries.Query3, async () => {
    const testStartTime = new Date();
    const testName = AdvancedFormQueries.Query3;
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "telephone1","adx_entityform","","","account"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
    
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.AdvFormStep1JsFile, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('Multistepform');

    await page.locator(AdvanceFormConstants.NameField).fill('Test name');
    await page.locator(AdvanceFormConstants.NextButton).click();
    await expect(page.locator(AdvanceFormConstants.ValidationSummary)).toHaveText('Phone is a required field.')

    await page.locator(AdvanceFormConstants.NameField).fill('Test name');
    await page.locator(AdvanceFormConstants.PhoneField).fill('911234567890');
    await page.locator(AdvanceFormConstants.NextButton).click();
    
    await expect(page.locator(AdvanceFormConstants.ValidationSummary)).not.toBeVisible();
    await page.locator(AdvanceFormConstants.PreviousButton).click();
    await expect(page.locator(AdvanceFormConstants.ValidationSummary)).not.toBeVisible();
    await page.close();

    // Record end time after test execution
    reportAfterTestCompletes(testName, testStartTime, response, logStream);
  }).timeout(120000);
 
  it(AdvancedFormQueries.Query4, async () => {
    const testStartTime = new Date();
    const testName = AdvancedFormQueries.Query4;
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "accountnumber","adx_entityform","","","account"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
    
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.AdvFormStep2JsFile, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('Multistepform');

    await page.locator(AdvanceFormConstants.NameField).fill('Test name');
    await page.locator(AdvanceFormConstants.NextButton).click();

    await page.locator(AdvanceFormConstants.AccountNumber).fill('123Abc');
    await page.locator(AdvanceFormConstants.NextButton).click();

    await expect(page.locator(AdvanceFormConstants.ValidationSummary)).toBeVisible();
    await expect(page.locator(AdvanceFormConstants.ValidationSummary)).toContainText('Account Number');
    await expect(page.locator(AdvanceFormConstants.ValidationSummary)).toHaveText('Account Number must be a numeric value.')
    await page.locator(AdvanceFormConstants.AccountNumber).fill('1234567890');
    await page.locator(AdvanceFormConstants.NextButton).click();   
    
    await expect(page.locator(AdvanceFormConstants.ValidationSummary)).not.toBeVisible();
    await expect(page.locator(AdvanceFormConstants.MessageLabel)).toHaveText('Submission completed successfully.');
    await page.close();

    // Record end time after test execution
    reportAfterTestCompletes(testName, testStartTime, response, logStream);
  }).timeout(240000);

  it(AdvancedFormQueries.Query5, async () => {
    const testStartTime = new Date();
    const testName = AdvancedFormQueries.Query5;
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "emailaddress1","adx_entityform","","","account"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
    
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.AdvFormStep2JsFile, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('Multistepform');

    await page.locator(AdvanceFormConstants.NameField).fill('Test name');
    await page.locator(AdvanceFormConstants.NextButton).click();
    await expect(page.locator(AdvanceFormConstants.EmailField)).toHaveAttribute('readonly');
    await page.close();

    // Record end time after test execution
    reportAfterTestCompletes(testName, testStartTime, response, logStream);
  }).timeout(240000);
});

// Close the HTML file with closing tags after all asynchronous code has completed
// Assuming your tests are using Promises, you can return a Promise from your test
// and use the `after` hook to close the logStream after all tests have completed.
after(async function () {
  closeHtmlFile(logStream);
});