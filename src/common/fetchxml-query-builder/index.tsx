/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { FetchXmlQueryBuilderApp } from './components/FetchXmlQueryBuilder';

export const renderApp = (elementId: string) => {
    const element = document.getElementById(elementId);
    const root = ReactDOMClient.createRoot(element as HTMLElement);
    root.render(<FetchXmlQueryBuilderApp />);
};
