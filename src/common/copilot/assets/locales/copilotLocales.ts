/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const localizations: { [key: string]: Localization } = {
    'en': {
        // Add English localization key-value pairs here
        "hello": "Hello",
        "world": "World"
    },
    'French': {
        // Add French localization key-value pairs here
        "You may add this code to your HTML file.": "Bonjour",
        "world": "Monde"
    }
};


export interface Localization {
    [key: string]: string;
}
