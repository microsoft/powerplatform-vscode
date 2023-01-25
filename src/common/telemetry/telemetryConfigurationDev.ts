/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// We can't pull in the entire telemetry package because it has a dependency on 'fs' which is not available in the browser.
import { AppInsightsResource } from "../pp-tooling-telemetry-node/AppInsightsResource";
import { AppInsightsResourceProvider } from "../pp-tooling-telemetry-node/AppInsightsResourceProvider";

export const vscodeExtAppInsightsResourceProvider = new AppInsightsResourceProvider(
    /* appi-dpxt-dev-us-vscode */ new AppInsightsResource("InstrumentationKey=e3c234e7-4bfb-4f31-9540-30fa08a62a77;IngestionEndpoint=https://westus2-2.in.applicationinsights.azure.com/;LiveEndpoint=https://westus2.livediagnostics.monitor.azure.com/"),
    /* appi-dpxt-dev-eu-vscode */ new AppInsightsResource("InstrumentationKey=bb2f90c5-5c39-42e1-80bb-ab91d8326509;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/;LiveEndpoint=https://westeurope.livediagnostics.monitor.azure.com/", "EU")
    );
