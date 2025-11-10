/* eslint-disable */
/**
 * Sample Power Pages Server Logic File
 *
 * This is an example showing how to use the Server API in your server logic.
 * To debug this file:
 * 1. Open this file in VS Code
 * 2. Set breakpoints by clicking in the gutter
 * 3. Press F5 or click the debug icon
 * 4. Use the Debug Console to see logs
 *
 * Note: The Server global object is injected at runtime by the debugger.
 */

// Example 1: Logging
function exampleLogging() {
    Server.Logger.Log('Starting server logic execution');
    Server.Logger.Info('Processing user request');
    Server.Logger.Warning('This is a warning');
    Server.Logger.Error('This is an error');
}

// Example 2: Context Access
function exampleContextAccess() {
    // Access query parameters
    const id = Server.Context.QueryParameters.id;
    Server.Logger.Log(`Received ID: ${id}`);

    // Access headers
    const contentType = Server.Context.Headers['Content-Type'];
    Server.Logger.Log(`Content-Type: ${contentType}`);

    // Access request body
    const body = JSON.parse(Server.Context.Body);
    Server.Logger.Log(`Body: ${JSON.stringify(body)}`);

    // Access HTTP method and URL
    Server.Logger.Log(`Method: ${Server.Context.Method}`);
    Server.Logger.Log(`URL: ${Server.Context.Url}`);
}

// Example 3: User Information
function exampleUserInfo() {
    Server.Logger.Log(`User ID: ${Server.User.id}`);
    Server.Logger.Log(`User Name: ${Server.User.fullname}`);
    Server.Logger.Log(`Email: ${Server.User.email}`);
    Server.Logger.Log(`Is Authenticated: ${Server.User.IsAuthenticated}`);

    // Check user roles
    if (Server.User.HasRole('System Administrator')) {
        Server.Logger.Log('User is a System Administrator');
    }
}

// Example 4: HTTP Client
async function exampleHttpClient() {
    Server.Logger.Log('Making external HTTP request...');

    // GET request
    const getResponse = await Server.Connector.HttpClient.GetAsync(
        'https://api.nuget.org/v3/index.json',
        { 'User-Agent': 'PowerPages-ServerLogic' }
    );

    const getResult = JSON.parse(getResponse);
    Server.Logger.Log(`GET Response Status: ${getResult.StatusCode}`);
    Server.Logger.Log(`GET Response Body: ${getResult.Body}`);

    // POST request
    const postData = { name: 'Test Account', email: 'test@example.com' };
    const postResponse = await Server.Connector.HttpClient.PostAsync(
        'https://api.example.com/accounts',
        JSON.stringify(postData),
        { 'Authorization': 'Bearer token123' },
        'application/json'
    );

    const postResult = JSON.parse(postResponse);
    Server.Logger.Log(`POST Response Status: ${postResult.StatusCode}`);
}

// Example 5: Dataverse Operations
function exampleDataverse() {
    Server.Logger.Log('Performing Dataverse operations...');

    // Create a record
    const newAccount = {
        name: 'Contoso Ltd',
        telephone1: '555-0100',
        emailaddress1: 'contact@contoso.com'
    };
    const createResult = Server.Connector.Dataverse.CreateRecord(
        'account',
        JSON.stringify(newAccount)
    );
    Server.Logger.Log(`Created account: ${createResult}`);

    // Retrieve a record
    const retrieveResult = Server.Connector.Dataverse.RetrieveRecord(
        'account',
        'account-id-here',
        '$select=name,telephone1'
    );
    Server.Logger.Log(`Retrieved account: ${retrieveResult}`);

    // Update a record
    const updateData = { telephone1: '555-0200' };
    const updateResult = Server.Connector.Dataverse.UpdateRecord(
        'account',
        'account-id-here',
        JSON.stringify(updateData)
    );
    Server.Logger.Log(`Updated account: ${updateResult}`);

    // Retrieve multiple records
    const multipleResults = Server.Connector.Dataverse.RetrieveMultiple(
        'account',
        '$filter=statecode eq 0&$select=name,accountid&$top=10'
    );
    Server.Logger.Log(`Retrieved multiple accounts: ${multipleResults}`);

    // Execute custom API
    const apiResult = Server.Connector.Dataverse.ExecuteCustomApi(
        'my_CustomApi',
        JSON.stringify({ param1: 'value1', param2: 'value2' })
    );
    Server.Logger.Log(`Custom API result: ${apiResult}`);
}

// Example 6: Environment Variables
function exampleEnvironment() {
    const apiKey = Server.Environment.GetVariable('ApiKey');
    Server.Logger.Log(`API Key: ${apiKey}`);

    const baseUrl = Server.Environment.GetVariable('ApiBaseUrl');
    Server.Logger.Log(`Base URL: ${baseUrl}`);
}

// Example 7: Complete Workflow
async function completeWorkflow() {
    Server.Logger.Log('=== Starting Complete Workflow ===');

    try {
        // 1. Get user info
        Server.Logger.Log(`Processing request for user: ${Server.User.fullname}`);

        // 2. Parse request
        const requestBody = JSON.parse(Server.Context.Body);
        const accountId = Server.Context.QueryParameters.id;

        Server.Logger.Log(`Request: ${JSON.stringify(requestBody)}`);
        Server.Logger.Log(`Account ID: ${accountId}`);

        // 3. Retrieve data from Dataverse
        const accountData = Server.Connector.Dataverse.RetrieveRecord(
            'account',
            accountId,
            '$select=name,telephone1,emailaddress1'
        );

        const account = JSON.parse(accountData);
        Server.Logger.Log(`Found account: ${account.name}`);

        // 4. Call external API with the data
        const externalApiUrl = Server.Environment.GetVariable('ApiBaseUrl');
        const apiResponse = await Server.Connector.HttpClient.PostAsync(
            `${externalApiUrl}/process`,
            JSON.stringify(account),
            { 'Content-Type': 'application/json' }
        );

        const apiResult = JSON.parse(apiResponse);
        Server.Logger.Log(`API Response: ${apiResult.StatusCode}`);

        // 5. Update Dataverse based on response
        if (apiResult.StatusCode === 200 || apiResult.StatusCode === 201) {
            const updateResult = Server.Connector.Dataverse.UpdateRecord(
                'account',
                accountId,
                JSON.stringify({ description: 'Processed successfully' })
            );
            Server.Logger.Log(`Updated account: ${updateResult}`);
        }

        Server.Logger.Log('=== Workflow Completed Successfully ===');
        return { success: true, message: 'Workflow completed' };

    } catch (error) {
        Server.Logger.Error(`Workflow failed: ${error}`);
        return { success: false, error: error.toString() };
    }
}

// Main execution
// Uncomment the examples you want to test
Server.Logger.Log('\n========================================');
Server.Logger.Log('Power Pages Server Logic - Debug Mode');
Server.Logger.Log('========================================\n');

// Run examples (uncomment to test)
exampleLogging();
exampleContextAccess();
exampleUserInfo();
// exampleHttpClient(); // Async - use await if calling
exampleDataverse();
exampleEnvironment();
// completeWorkflow(); // Async - use await if calling

Server.Logger.Log('\n========================================');
Server.Logger.Log('Server Logic Execution Complete');
Server.Logger.Log('========================================\n');
