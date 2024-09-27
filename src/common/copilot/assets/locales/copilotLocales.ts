/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const localizations: { [key: string]: Localization } = {
    'en': {
        "Error: Site settings missing for entity.": "Error: Site settings missing for entity.",
        "Error: Site settings missing for entity fields.": "Error: Site settings missing for entity fields.",
        "Error: Table permissions missing for entity.": "Error: Table permissions missing for entity.",
        "Error: Web API is not available...": "Error: Web API is not available...",
        "You may need to add some site settings and table permissions for the above code to work properly.": "You may need to add some site settings and table permissions for the above code to work properly.",
        "There was an issue connecting to the server. Please check your internet connection and try again.": "There was an issue connecting to the server. Please check your internet connection and try again.",
        "Something went wrong. Don’t worry, you can try again.": "Something went wrong. Don’t worry, you can try again.",
        "Try a different prompt that’s related to writing code for Power Pages sites. You can get help with HTML, CSS, and JS languages.": "Try a different prompt that’s related to writing code for Power Pages sites. You can get help with HTML, CSS, and JS languages.",
        "Please try again with a shorter prompt.": "Please try again with a shorter prompt.",
        "Too many requests at once. Try again after some time.": "Too many requests at once. Try again after some time.",
        "Unauthorized access. Please log in with valid credentials and try again.": "Unauthorized access. Please log in with valid credentials and try again.",
        "Active auth profile is not found or has expired. Create an Auth profile to start chatting with Copilot again.": "Active auth profile is not found or has expired. Create an Auth profile to start chatting with Copilot again.",
        "You may add this code to your HTML file.": "You may add this code to your HTML file.",
        "Below is the JS code to fetch Web API.": "Below is the JS code to fetch Web API.",
        "To display the response in an HTML table, you may use the following code snippet.": "To display the response in an HTML table, you may use the following code snippet.",
        "You may use the below code to handle errors.": "You may use the below code to handle errors.",
        "Below code fetches and caches the token needed for Web API requests.": "Below code fetches and caches the token needed for Web API requests."
    }
};

export interface Localization {
    [key: string]: string;
}
