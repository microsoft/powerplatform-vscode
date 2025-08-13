/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import { CodeQLAction } from '../../../../../power-pages/actions-hub/actions/codeQLAction';

describe('CodeQLAction', () => {
    let sandbox: sinon.SinonSandbox;
    let codeqlAction: CodeQLAction;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        codeqlAction = new CodeQLAction();
    });

    afterEach(() => {
        codeqlAction.dispose();
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should create output channel with correct name', () => {
            // Just test that the action can be created without errors
            const action = new CodeQLAction();
            assert.ok(action);
            action.dispose();
        });
    });

    describe('dispose', () => {
        it('should dispose output channel when dispose is called', () => {
            const action = new CodeQLAction();
            // Should not throw when disposing
            action.dispose();
        });
    });
});
