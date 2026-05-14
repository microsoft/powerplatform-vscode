/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import { ActiveOrgOutput, OrgListOutput } from "../../pac/PacTypes";
import { getActiveOrgFromOutput, isActiveEnvironment } from "../../lib/EnvironmentSelection";

const createEnvironment = (overrides: Partial<OrgListOutput> = {}): OrgListOutput => ({
    FriendlyName: 'Demo',
    OrganizationId: 'org-id',
    EnvironmentIdentifier: {
        Id: '20b4ab98-bcb3-e524-ac1d-b92d04556409'
    },
    EnvironmentUrl: 'https://demo.crm.dynamics.com',
    UniqueName: 'demo',
    ...overrides
});

const createActiveOrg = (overrides: Partial<ActiveOrgOutput> = {}): ActiveOrgOutput => ({
    OrgId: 'org-id',
    UniqueName: 'demo',
    FriendlyName: 'Demo',
    OrgUrl: 'https://demo.crm.dynamics.com/',
    UserEmail: 'user@contoso.com',
    UserId: 'user-id',
    EnvironmentId: '20b4ab98-bcb3-e524-ac1d-b92d04556409',
    ...overrides
});

describe('EnvironmentSelection', () => {
    it('matches active environment by environment id', () => {
        const environment = createEnvironment({
            EnvironmentUrl: 'https://different.crm.dynamics.com'
        });

        expect(isActiveEnvironment(environment, createActiveOrg())).to.be.true;
    });

    it('normalizes environment id casing and braces', () => {
        const environment = createEnvironment({
            EnvironmentIdentifier: {
                Id: '{20B4AB98-BCB3-E524-AC1D-B92D04556409}'
            }
        });

        expect(isActiveEnvironment(environment, createActiveOrg())).to.be.true;
    });

    it('matches active environment by normalized url when environment id is missing', () => {
        const environment = createEnvironment({
            EnvironmentIdentifier: {
                Id: ''
            },
            EnvironmentUrl: 'https://DEMO.crm.dynamics.com/'
        });

        expect(isActiveEnvironment(environment, createActiveOrg())).to.be.true;
    });

    it('does not match empty urls when environment id does not match', () => {
        const environment = createEnvironment({
            EnvironmentIdentifier: {
                Id: 'different-env-id'
            },
            EnvironmentUrl: ''
        });
        const activeOrg = createActiveOrg({
            EnvironmentId: 'another-env-id',
            OrgUrl: ''
        });

        expect(isActiveEnvironment(environment, activeOrg)).to.be.false;
    });

    it('does not match by url when environment ids are present and different', () => {
        const environment = createEnvironment({
            EnvironmentIdentifier: {
                Id: 'different-env-id'
            },
            EnvironmentUrl: 'https://demo.crm.dynamics.com/'
        });
        const activeOrg = createActiveOrg({
            EnvironmentId: 'another-env-id'
        });

        expect(isActiveEnvironment(environment, activeOrg)).to.be.false;
    });

    it('uses IsActive when provided by the environment list', () => {
        const environment = createEnvironment({
            IsActive: true
        });

        expect(isActiveEnvironment(environment)).to.be.true;
    });

    it('returns active org only from successful org who output', () => {
        const activeOrg = createActiveOrg();

        expect(getActiveOrgFromOutput({
            Status: 'Success',
            Errors: [],
            Information: [],
            Results: activeOrg
        })).to.equal(activeOrg);
        expect(getActiveOrgFromOutput({
            Status: 'Failure',
            Errors: [],
            Information: [],
            Results: activeOrg
        })).to.be.undefined;
    });
});
