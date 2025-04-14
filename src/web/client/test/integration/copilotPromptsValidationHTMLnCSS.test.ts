/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


import { CreateAndExecuteAPIRequest, closeHtmlFile, ReturnFormattedAPIResponse, verifyAPIResponse, uploadPortal, LaunchRunTime, reportingForTests, reportAfterTestCompletes, getAccessToken, writeHeadingandTableHeaders } from '../../utilities/copilotAutomationUtil';
import { AIB_ENDPOINT, CssQueries, FormConstants, HtmlQueries, PageConstants, Paths, TextConstants } from '../../common/constants';
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
describe('Copilot Html and Css integration tests', async function () { 
  it(HtmlQueries.Query1, async () => {
    const testName = HtmlQueries.Query1;
    const testStartTime = new Date();
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "","adx_webpage","adx_copy","html",""
    ];  
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);      

    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.HtmlWebpageCopy, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('Html', true);

    await page.waitForSelector(FormConstants.BasicForm, {timeout: 60000});
    await expect(page.locator(FormConstants.BasicForm)).toBeVisible();
    await page.close();
    
    // Record end time after test execution
    reportAfterTestCompletes(testName,testStartTime,response,logStream);
  }).timeout(120000);
    
  it(HtmlQueries.Query2,async () => {
    const testName = HtmlQueries.Query2;
    const testStartTime = new Date();
    
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "","adx_webpage","adx_copy","html",""
    ];  
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);

    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.HtmlWebpageCopy, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();

    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('Html', true);

    const url = await page.locator(PageConstants.TestButton).getAttribute('onclick');
    expect(url).toContain('microsft.com');

    await page.click(PageConstants.TestButton);
    expect(page.url()).toBe(TextConstants.MicrosoftURL);
    await page.close();
    
    // Record end time after test execution
    reportAfterTestCompletes(testName, testStartTime, response, logStream);  
  }).timeout(120000);


  it(HtmlQueries.Query3, async () => {
    const testStartTime = new Date();
    const testName = HtmlQueries.Query3;
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
      "","adx_webpage","adx_copy","html",""
    ];
  
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
  
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.HtmlWebpageCopy, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();
  
    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('Html', true);

    await page.waitForSelector(PageConstants.MicrosoftLogo, {timeout: 60000});
    await expect(page.locator(PageConstants.MicrosoftLogo)).toBeVisible();
    await page.close();
      
    // Record end time after test execution
    reportAfterTestCompletes(testName, testStartTime, response, logStream);    
  
  }).timeout(120000);

  it(CssQueries.Query1, async () => {
    const testStartTime = new Date();
    const testName = CssQueries.Query1;

    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
      
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.HomePageCss, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();
  
    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('Home', true);
     
    const row = await page.locator(PageConstants.Section).first();
    const backgroundColor = await row.evaluate((element) => {
      return window.getComputedStyle(element).backgroundColor;
    });
    expect(backgroundColor.toString()).toContain(PageConstants.YellowColor);
    await page.close();

    // Record end time after test execution
    reportAfterTestCompletes(testName, testStartTime, response, logStream);
  }).timeout(120000);
  
  it(CssQueries.Query2, async () => {
    const testStartTime = new Date();
    const testName = CssQueries.Query2;

    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
      
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.HomePageCss, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();
  
    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('Home',true);
     
    const button = page.locator(PageConstants.Button1).first();
    const backgroundColor = await button.evaluate((element) => {
      return window.getComputedStyle(element).backgroundColor;
    });
    expect(backgroundColor.toString()).toContain(PageConstants.RedColor);
    await page.close();

    // Record end time after test execution
    reportAfterTestCompletes(testName, testStartTime, response, logStream);
  }).timeout(120000);

  it(CssQueries.Query3, async () => {
    const testStartTime = new Date();
    const testName = CssQueries.Query3;
      
    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
      
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.HomePageCss, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();
  
    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('Home',true);
     
    const buttons = await page.$$(PageConstants.Button);
    for (const selector of buttons) {
      const fontStyle = await selector?.evaluate((element) => {
        return window.getComputedStyle(element).fontStyle;
      });
      expect(fontStyle.toString()).toBe(TextConstants.Italic);
    }
    await page.close();

    // Record end time after test execution
    reportAfterTestCompletes(testName, testStartTime, response, logStream);
  }).timeout(120000);
    
  it(CssQueries.Query4, async () => {
    const testStartTime = new Date();
    const testName = CssQueries.Query4;

    // Actual values to replace placeholders from API request JSON.
    const actualValues = [
      testName, // question
    ];
    const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
      
    // Assert API response
    await verifyAPIResponse(response);
    fs.writeFileSync(Paths.HomePageCss, ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));
    await uploadPortal();
  
    console.log('Launch browser and navigate to run time');
    const page = await LaunchRunTime('Home',true);
     
    const button = page.locator(PageConstants.Button1).first();
    await button.hover();
    await page.waitForTimeout(5000);
    const backgroundColor = await button.evaluate((element) => {
      return window.getComputedStyle(element).backgroundColor;
    });
    expect(backgroundColor.toString()).toContain(PageConstants.GreenColor);
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
