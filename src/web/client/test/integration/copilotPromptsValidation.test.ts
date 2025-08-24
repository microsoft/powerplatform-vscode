/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { CreateAndExecuteAPIRequest, closeHtmlFile, ReturnFormattedAPIResponse, verifyAPIResponse, uploadPortal, LaunchRunTime, reportingForTests, reportAfterTestCompletes, getAccessToken, writeHeadingandTableHeaders, formatString } from '../../utilities/copilotAutomationUtil';
import { AIB_ENDPOINT, FormConstants, FormQueries, Paths, SuggestedPromptsConstants } from '../../common/constants';
const aibEndPoint = AIB_ENDPOINT;
let accessToken: string;
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
describe('Copilot SUGGESTED prompts integration tests', async function () {
  it(FormQueries.Query1, async () => {
    const testStartTime = new Date();
    const testName = FormQueries.Query1;
      
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "Name,adx_createdbycontact,,Email,adx_contactemail,,Subject,title,,Message,comments,,Maximum Rating,maxrating,,Minimum Rating,minrating,,Status Reason,statuscode","adx_entityform","","","feedback"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);      

    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.FormJsFile, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('contact-us')

    await page.locator(FormConstants.EmailField).fill('abcd@abc.com');
    await page.locator(FormConstants.SubjectField).fill('Test title');
    await page.locator(FormConstants.MessageField).fill('Message');

    await page.locator(FormConstants.SubmitButton).click();
    await expect(page.locator(FormConstants.NameIsRequired)).toBeVisible();
    await page.close();

    // Record end time after test execution
    reportAfterTestCompletes(testName, testStartTime, response, logStream);
  }).timeout(120000);

  it(FormQueries.Query2, async () => {
    const testStartTime = new Date();
    const testName = FormQueries.Query2;
      
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      ["adx_contactemail"],
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
    
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.FormJsFile, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('contact-us')
    await page.locator(FormConstants.NameField).fill('Text name');
    await page.locator(FormConstants.SubjectField).fill('Test title');
    await page.locator(FormConstants.MessageField).fill('Message');
    await expect(page.locator(FormConstants.EmailField)).toBeHidden();
    await page.close();

    // Record end time after test execution
    reportAfterTestCompletes(testName, testStartTime, response, logStream);
  }).timeout(120000);

  it(FormQueries.Query3, async () => {
    const testStartTime = new Date();
    const testName = FormQueries.Query3;
      
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "Name,adx_createdbycontact,,Email,adx_contactemail,,Subject,title,,Message,comments,,Maximum Rating,maxrating,,Minimum Rating,minrating,,Status Reason,statuscode","adx_entityform","","","feedback"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);

    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.FormJsFile, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('contact-us')

    await page.locator(FormConstants.NameField).fill('Text name');
    await page.locator(FormConstants.SubjectField).fill('Test title');
    await page.locator(FormConstants.MessageField).fill('Message');

    await expect(page.locator(FormConstants.EmailField)).toBeDisabled();
    await page.close();

    // Record end time after test execution
    await reportAfterTestCompletes(testName, testStartTime, response, logStream);
  }).timeout(120000);

  it(FormQueries.Query4, async () => {
    const testStartTime = new Date();
    const testName = FormQueries.Query4
      
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "Name,adx_createdbycontact,,Email,adx_contactemail,,Subject,title,,Message,comments,,Maximum Rating,maxrating,,Minimum Rating,minrating,,Status Reason,statuscode","adx_entityform","","","feedback"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);

    // Assert API response
      await verifyAPIResponse(response);
      fs.writeFileSync(Paths.FormJsFile, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
      await uploadPortal();

      console.log('Launch browser and navigate to run time');
      const page = await LaunchRunTime('contact-us')

      await page.locator(FormConstants.NameField).fill('Text name');
      await page.locator(FormConstants.SubjectField).fill('Test title');
      await page.locator(FormConstants.MessageField).fill('Message');
      await page.locator(FormConstants.EmailField).fill('abcd');

      await page.locator(FormConstants.SubmitButton).click();
      await expect(page.locator(FormConstants.ValidEmail)).toBeVisible();
      await page.close();

      // Record end time after test execution
    reportAfterTestCompletes(testName, testStartTime, response, logStream);
  }).timeout(120000);


  Object.keys(SuggestedPromptsConstants).forEach(function (promptKey) {    
  it(`${SuggestedPromptsConstants[promptKey]}`, async () => {
    const testStartTime = new Date();
    const testName = `${SuggestedPromptsConstants[promptKey]}`;
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "Name,adx_createdbycontact,,Email,adx_contactemail,,Subject,title,,Message,comments,,Maximum Rating,maxrating,,Minimum Rating,minrating,,Status Reason,statuscode","adx_entityform","","","feedback"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
    
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.FormJsFile, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('contact-us')

    await page.locator(FormConstants.NameField).fill('Test name!@#$%^&*()');
    await page.locator(FormConstants.SubjectField).fill('Test title@%&%&');
    await page.locator(FormConstants.MessageField).fill('Message');
    await page.locator(FormConstants.EmailField).fill('abcd@abc.com');
    await page.locator(FormConstants.SubmitButton).click();
   
    await expect(page.locator(formatString(FormConstants.SpecialCharacters,promptKey))).toBeVisible();
    await page.locator(FormConstants.SubjectField).fill('Test title');
    await page.locator(FormConstants.NameField).fill('Test name');
      await page.locator(FormConstants.SubmitButton).click();
      await expect(page.locator(formatString(FormConstants.SpecialCharacters,promptKey))).not.toBeVisible();
    await expect(page.locator(FormConstants.SubmissionSuccessful)).toBeVisible();
    await page.close();

    // Record end time after test execution
    reportAfterTestCompletes(testName, testStartTime, response, logStream);
  }).timeout(120000);
});

  it(FormQueries.Query5, async () => {
    const testStartTime = new Date();
    const testName = FormQueries.Query5;
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "Name,adx_createdbycontact","adx_entityform","","","feedback"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
    
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.FormJsFile, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('contact-us');

    await page.locator(FormConstants.NameField).fill('Text name');
    await page.locator(FormConstants.SubjectField).fill('Test title');
    await page.locator(FormConstants.MessageField).fill('Message');
    await page.locator(FormConstants.EmailField).fill('abcd');
    await page.locator(FormConstants.SubmitButton).click();
    await expect(page.locator(FormConstants.Lessthan5Characters)).toBeVisible();
    await page.close();
    
    // Record end time after test execution
    reportAfterTestCompletes(testName, testStartTime, response, logStream);
  }).timeout(120000);

  
  it(FormQueries.Query6, async () => {
    const testStartTime = new Date();
    const testName = FormQueries.Query6;
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "Minimum Rating,minrating","adx_entityform","","","feedback"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
    
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.FormJsFile, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('contact-us')

    await page.locator(FormConstants.NameField).fill('Text name');
    await page.locator(FormConstants.SubjectField).fill('Test title');
    await page.locator(FormConstants.MessageField).fill('Message');
    await page.locator(FormConstants.EmailField).fill('abcd@abc.com');
    await page.locator(FormConstants.MinimumRating).fill('9');
    await page.locator(FormConstants.SubmitButton).click();

    expect((await page.locator(FormConstants.ValidationSummary).innerText()).toLowerCase()).toContain('minimum rating must be at least 10.');
    await page.locator(FormConstants.MinimumRating).fill('10');
    await page.locator(FormConstants.SubmitButton).click();
    await expect(page.locator(FormConstants.RatingBeAtleast10)).not.toBeVisible();
    await expect(page.locator(FormConstants.SubmissionSuccessful)).toBeVisible();
    
    await page.close();
    // Record end time after test execution
    reportAfterTestCompletes(testName, testStartTime, response, logStream);
  }).timeout(120000);
  
  it(FormQueries.Query7, async () => {
    const testStartTime = new Date();
    const testName = FormQueries.Query7;
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "Maximum Rating,maxrating","adx_entityform","","","feedback"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);

    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.FormJsFile, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('contact-us')

    await page.locator(FormConstants.NameField).fill('Text name');
    await page.locator(FormConstants.SubjectField).fill('Test title');
    await page.locator(FormConstants.MessageField).fill('Message');
    await page.locator(FormConstants.EmailField).fill('abcd@abc.com');

    await page.locator(FormConstants.MaximumRating).fill('96');
    await page.locator(FormConstants.SubmitButton).click();
    await expect(page.locator(FormConstants.RatingBeAtmost95)).toBeVisible();
    await page.locator(FormConstants.MaximumRating).fill('95');
    await page.locator(FormConstants.SubmitButton).click();

    await expect(page.locator(FormConstants.RatingBeAtmost95)).not.toBeVisible();
    await expect(page.locator(FormConstants.SubmissionSuccessful)).toBeVisible();
    await page.close();

    // Record end time after test execution
    reportAfterTestCompletes(testName, testStartTime, response, logStream);
  }).timeout(120000);

  it(FormQueries.Query8, async () => {
    const testStartTime = new Date();
    const testName = FormQueries.Query8;
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "Maximum Rating,maxrating,Minimum Rating,minrating","adx_entityform","","","feedback"
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
    
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.FormJsFile, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('contact-us')

    await page.locator(FormConstants.NameField).fill('Text name');
    await page.locator(FormConstants.SubjectField).fill('Test title');
    await page.locator(FormConstants.MessageField).fill('Message');
    await page.locator(FormConstants.EmailField).fill('abcd@abc.com');
    await page.locator(FormConstants.MinimumRating).fill('4');
    await page.locator(FormConstants.MaximumRating).fill('96');
    await page.locator(FormConstants.SubmitButton).click();

    await expect(page.locator(FormConstants.RatingBeAtleast5)).toBeVisible();
    await expect(page.locator(FormConstants.RatingAtmost95)).toBeVisible();
    await page.locator(FormConstants.MinimumRating).fill('10');
    await page.locator(FormConstants.MaximumRating).fill('90');
    await page.locator(FormConstants.SubmitButton).click();

    await expect(page.locator(FormConstants.RatingBeAtleast5)).not.toBeVisible();
    await expect(page.locator(FormConstants.RatingAtmost95)).not.toBeVisible();
    await expect(page.locator(FormConstants.SubmissionSuccessful)).toBeVisible();    
    await page.close();

    // Record end time after test execution
    reportAfterTestCompletes(testName, testStartTime, response, logStream);
  }).timeout(120000);
});


// Close the HTML file with closing tags after all asynchronous code has completed
// Assuming your tests are using Promises, you can return a Promise from your test
// and use the `after` hook to close the logStream after all tests have completed.
after(async function () {
  closeHtmlFile(logStream);
});