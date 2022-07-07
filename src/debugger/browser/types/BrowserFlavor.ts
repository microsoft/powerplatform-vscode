/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * The PCF debugger will try to open the Microsoft Edge flavors in the following order: Stable, Beta, Dev and Canary.
 */
export type BrowserFlavor = "Default" | "Stable" | "Beta" | "Dev" | "Canary";
