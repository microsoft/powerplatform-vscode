/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// We can't pull in the entire telemetry package because it has a dependency on 'fs' which is not available in the browser.
import { AppInsightsResource } from "../pp-tooling-telemetry-node/AppInsightsResource";
import { AppInsightsResourceProvider } from "../pp-tooling-telemetry-node/AppInsightsResourceProvider";

export const vscodeExtAppInsightsResourceProvider = new AppInsightsResourceProvider(
    /* appi-dpxt-prod-us-vscode */ new AppInsightsResource("InstrumentationKey=469863ae-9b12-4717-b712-107ae38a1d96;IngestionEndpoint=https://westus2-2.in.applicationinsights.azure.com/;LiveEndpoint=https://westus2.livediagnostics.monitor.azure.com/"),
    /* appi-dpxt-prod-eu-vscode */ new AppInsightsResource("InstrumentationKey=a62d5664-abfb-45d0-913d-b2833ed55fd7;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/;LiveEndpoint=https://westeurope.livediagnostics.monitor.azure.com/", "EU")
    );
