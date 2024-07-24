/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as chai from 'chai';
import { AIB_ENDPOINT, ExpectedResponses, CreateAndExecuteAPIRequest, getIntelligenceAPIAccessToken, SuggestedPromptsConstants, log, ITestLogParams, getFormattedDateTime, writeHeading, writeTableHeaders, closeHtmlFile, ReturnFormattedAPIResponse } from '../../utilities/copilotAutomationUtil';
const expect = chai.expect;
const aibEndPoint = AIB_ENDPOINT;
let accessToken : string;
const violationOrUnclearResponseCodes : string[] = ["violation", "unclear", "unsupported"];
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
// import { spawn } from 'child_process';
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
  Object.keys(SuggestedPromptsConstants).forEach(function (promptKey) {
    const testName = `${promptKey}: ${SuggestedPromptsConstants[promptKey]}`;
    it.only(testName, async () => {
      const testStartTime = new Date();
      
      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        SuggestedPromptsConstants[promptKey], // question
      ];

      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);
      // Record end time after test execution
      const testEndTime = new Date();

      // Assert API response
      expect(response).to.have.property('status');
      expect(response.status).to.equal(200);
      expect(response).to.have.property('data');
      expect(response.data).to.not.null;
      expect(response.data.operationStatus).to.be.equal('Success');
      const apiResponse = response.data.additionalData[0].properties.response;
      expect(JSON.stringify(apiResponse.useCase)).to.not.equal('unsupported');
      // Expect that apiResponse.Code is either undefined or does not include any value from the array
      expect(JSON.stringify(apiResponse.Code)).to.satisfy((code: string | unknown[] | undefined) => {
        return code === undefined || violationOrUnclearResponseCodes.every((value: string) => !code.includes(value));
      }, 'API response code should be either undefined or not include any of the violation codes');
      expect(JSON.stringify(apiResponse.displayText)).not.to.equal(ExpectedResponses.COPILOT_IT_UNSUPPORTED_EXPECTED_RESPONSE.displayText);

      // console.log('apiResponse.Code3 '+ ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response))
      console.log('apiResponse code '+ ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code))
      console.log('apiResponsecode display text'+ ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].displayText))

      fs.writeFileSync('C:\\Downloads\\CopilotSite\\site-for-copilot---site-boc8w\\basic-forms\\simple-contact-us-form\\simple-contact-us-form.basicform.custom_javascript.js', ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response[0].code));

      /* exec('pac auth create -u "https://org9ae233f3.crm.dynamics.com/"',{cwd:''}, (error, stdout, stderr) => {
        console.log('after pac auth command 1');
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Command stderr: ${stderr}`);
        }
        console.log(`Command stdout: ${stdout}`);
        console.log('after pac auth command 2');
    });

    exec('whoami', {'shell':'powershell.exe'}, (error, stdout, stderr)=> {
      // do whatever with stdout
      console.log(`Command error: ${error}`);
      console.log(`Command stdout: ${stdout}`);
      console.log(`Command stderr: ${stderr}`);
  }) */

   /* const child = spawn("powershell.exe",["Write-Output 'Hello World!'"]);
    child.stdout.on("data",function(data){
        console.log("Powershell Data: " + data);
    });
    child.stderr.on("data",function(data){
        console.log("Powershell Errors: " + data);
    });
    child.on("exit",function(){
        console.log("Powershell Script finished");
    });
    child.stdin.end(); //end input

    console.log('before exec command'); */
    /* exec('Whoami', {'shell':'powershell.exe'}, (error, stderr, stdout) => {
      if (error!=null) {
        console.log('entered into 1st if');
        console.error(`Error executing command: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`Command stderr: ${stderr}`);
    }
    console.log(`Command stdout: ${stdout}`);
    console.log('after pac auth command 2');
  }); */

  console.log('before exec command 1');
      exec('pac paportal upload -p . -mv 2',{cwd:'C:/Downloads/CopilotSite/site-for-copilot---site-boc8w'}, (error, stdout, stderr) => {
        console.log('after pac upload command 1');
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Command stderr: ${stderr}`);
        }
        console.log(`Command stdout: ${stdout}`);
        console.log('after pac upload command 2');

        // Example assertion (adjust based on expected output)
        expect(stdout).to.include('Upload successful');
    });
    console.log('after exec command 1');

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

// Run tests for Copilot HARMS prompts
/* describe('Copilot HARMS prompts integration tests', async function () {
  Object.keys(HarmsPromptsConstants).forEach(function (promptKey) {
    const testName = `${promptKey}: ${HarmsPromptsConstants[promptKey]}`;
    it(testName, async () => {
      const testStartTime = new Date();

      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        HarmsPromptsConstants[promptKey], // question
      ];

      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);

      const testEndTime = new Date();

      // Assert API response
      expect(response).to.have.property('status');
      expect(response.status).to.equal(200);
      expect(response).to.have.property('data');
      expect(response.data).to.not.null;
      const actualResponse = JSON.stringify(response.data.additionalData[0].properties.response[0]);
      expect(actualResponse).to.equal(JSON.stringify(ExpectedResponses.COPILOT_IT_UNSUPPORTED_EXPECTED_RESPONSE));
      const testLogParams: ITestLogParams = {
        testName: testName,
        testStartTime: testStartTime,
        testEndTime: testEndTime,
        actualResponse: JSON.stringify(response.data.additionalData[0].properties.response[0].displayText).replace(/"/g, ''),
        status: 'PASSED',
        logStream: logStream
      }
      log(testLogParams);
    }).timeout(60000);
  });
});

describe('Copilot AFFIRMATIVE prompts integration tests :: Should return some valid response for all AFFIRMATIVE prompts', function () {
  Object.keys(AffirmativePromptsConstants).forEach(function (promptKey) {
    const testName = `${promptKey}: ${AffirmativePromptsConstants[promptKey]}`;
    it(testName, async () => {
      const testStartTime = new Date();

      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        AffirmativePromptsConstants[promptKey], // question
      ];

      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);

      const testEndTime = new Date();

       // Assert API response
      expect(response).to.have.property('status');
      expect(response.status).to.equal(200);
      expect(response).to.have.property('data');
      expect(response.data).to.not.null;
      expect(response.data.operationStatus).to.be.equal('Success');
      const apiResponse = response.data.additionalData[0].properties.response[0];
      expect(JSON.stringify(apiResponse.useCase)).to.not.equal('unsupported');
      // Expect that apiResponse.Code is either undefined or does not include any value from the array
      expect(JSON.stringify(apiResponse.Code)).to.satisfy((code: string | unknown[] | undefined) => {
        return code === undefined || violationOrUnclearResponseCodes.every((value: string) => !code.includes(value));
      },'API response code should be either undefined or not include any of the violation codes');
      expect(JSON.stringify(apiResponse.displayText)).not.to.equal(ExpectedResponses.COPILOT_IT_UNSUPPORTED_EXPECTED_RESPONSE.displayText);
      const testLogParams: ITestLogParams = {
        testName: testName,
        testStartTime: testStartTime,
        testEndTime: testEndTime,
        actualResponse: ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response),
        status: 'PASSED',
        logStream: logStream
      }
      log(testLogParams);
    }).timeout(60000);
  });
});

describe('Copilot EXPLAIN prompts integration tests :: Should return response to all allowed code languages EXPLAIN prompts for power pages', function () {
  Object.keys(ExplainPromptsConstants).forEach(function (promptKey) {
    const testName = `${promptKey}: ${ExplainPromptsConstants[promptKey]}`;
    it(testName, async () => {
      const testStartTime = new Date();

      // Actual values to replace placeholders from API request JSON.
      const actualValues = [
        `Summarize this code`, // question
        ExplainPromptsConstants[promptKey], // activeFileContent
      ];

      const response = await CreateAndExecuteAPIRequest(testName, actualValues, accessToken, logStream);

      const testEndTime = new Date();

       // Assert API response
      expect(response).to.have.property('status');
      expect(response.status).to.equal(200);
      expect(response).to.have.property('data');
      expect(response.data).to.not.null;
      expect(response.data.operationStatus).to.be.equal('Success');
      const apiResponse = response.data.additionalData[0].properties.response[0];
      expect(JSON.stringify(apiResponse.useCase)).to.not.equal('unsupported');
      // Expect that apiResponse.Code is either undefined or does not include any value from the array
      expect(JSON.stringify(apiResponse.Code)).to.satisfy((code: string | unknown[] | undefined) => {
        return code === undefined || violationOrUnclearResponseCodes.every((value: string) => !code.includes(value));
      },'API response code should be either undefined or not include any of the violation codes');
      expect(JSON.stringify(apiResponse.displayText)).not.to.equal(ExpectedResponses.COPILOT_IT_UNSUPPORTED_EXPECTED_RESPONSE.displayText);
      const testLogParams: ITestLogParams = {
        testName: testName,
        testStartTime: testStartTime,
        testEndTime: testEndTime,
        actualResponse: ReturnFormattedAPIResponse(response.data.additionalData[0].properties.response),
        status: 'PASSED',
        logStream: logStream
      }
      log(testLogParams);
    }).timeout(60000);
  });
}); */

// Close the HTML file with closing tags after all asynchronous code has completed
// Assuming your tests are using Promises, you can return a Promise from your test
// and use the `after` hook to close the logStream after all tests have completed.
after(async function () {
  closeHtmlFile(logStream);
});

