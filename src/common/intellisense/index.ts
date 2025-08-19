/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// Export the main completion provider
export { ServerApiCompletionProvider, ServerApiDefinitions } from './ServerApiCompletionProvider';

// Export the registration utilities
export {
    ServerApiAutocompleteRegistrar,
    activateServerApiAutocomplete
} from './ServerApiAutocompleteRegistrar';
