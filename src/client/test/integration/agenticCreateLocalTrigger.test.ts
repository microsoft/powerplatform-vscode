/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as vscode from "vscode";
import {
    AgenticCreateLocalTriggerDependencies,
    AgenticCreateLocalTriggerStore,
    registerAgenticCreateLocalTrigger,
    runAgenticCreateLocalTrigger
} from "../../uriHandler/commands/agenticCreateLocalTrigger";
import { URI_CONSTANTS } from "../../uriHandler/constants/uriConstants";

describe("agenticCreateLocalTrigger", () => {
    const validLink =
        'vscode://microsoft-IsvExpTools.powerplatform-vscode/agenticCreate' +
        '?envid=11111111-1111-1111-1111-111111111111' +
        '&orgurl=https://contoso.crm.dynamics.com' +
        '&websiteid=22222222-2222-2222-2222-222222222222' +
        '&region=unitedstates&source=powerPagesHome&agenthost=auto&v=1';

    interface Harness {
        dependencies: AgenticCreateLocalTriggerDependencies;
        store: AgenticCreateLocalTriggerStore;
        stored: Map<string, unknown>;
        inputOptions: () => vscode.InputBoxOptions | undefined;
        warnings: string[];
        handled: vscode.Uri[];
        handleUri: (uri: vscode.Uri) => Promise<void>;
    }

    const createHarness = (
        entered: string | undefined,
        overrides: Partial<AgenticCreateLocalTriggerDependencies> = {}
    ): Harness => {
        const stored = new Map<string, unknown>();
        const warnings: string[] = [];
        const handled: vscode.Uri[] = [];
        let capturedOptions: vscode.InputBoxOptions | undefined;

        return {
            stored,
            warnings,
            handled,
            inputOptions: () => capturedOptions,
            store: {
                get: <T>(key: string) => stored.get(key) as T | undefined,
                update: (key, value) => {
                    stored.set(key, value);
                }
            },
            handleUri: async (uri) => {
                handled.push(uri);
            },
            dependencies: {
                isEnabled: () => true,
                showInputBox: (options) => {
                    capturedOptions = options;
                    return Promise.resolve(entered);
                },
                showWarningMessage: (message) => {
                    warnings.push(message);
                    return Promise.resolve(undefined);
                },
                uriScheme: 'vscode',
                ...overrides
            }
        };
    };

    it("dispatches the entered link through the production handler", async () => {
        const harness = createHarness(validLink);

        await runAgenticCreateLocalTrigger(harness.handleUri, harness.store, harness.dependencies);

        expect(harness.handled).to.have.lengthOf(1);
        expect(harness.handled[0].path).to.equal(URI_CONSTANTS.PATHS.AGENTIC_CREATE);
        expect(harness.handled[0].query).to.contain('envid=11111111-1111-1111-1111-111111111111');
    });

    it("remembers the last link so it can be replayed", async () => {
        const harness = createHarness(validLink);

        await runAgenticCreateLocalTrigger(harness.handleUri, harness.store, harness.dependencies);

        expect(harness.stored.get(URI_CONSTANTS.LOCAL_TRIGGER.LAST_LINK_KEY)).to.equal(validLink);
    });

    it("prefills the remembered link instead of the sample", async () => {
        const harness = createHarness(validLink);
        harness.stored.set(URI_CONSTANTS.LOCAL_TRIGGER.LAST_LINK_KEY, validLink);

        await runAgenticCreateLocalTrigger(harness.handleUri, harness.store, harness.dependencies);

        expect(harness.inputOptions()?.value).to.equal(validLink);
    });

    it("prefills an editable sample when nothing was run before", async () => {
        const harness = createHarness(validLink);

        await runAgenticCreateLocalTrigger(harness.handleUri, harness.store, harness.dependencies);

        expect(harness.inputOptions()?.value).to.contain(URI_CONSTANTS.PATHS.AGENTIC_CREATE);
        expect(harness.inputOptions()?.value).to.contain(URI_CONSTANTS.LOCAL_TRIGGER.SAMPLE.ENVIRONMENT_ID);
    });

    it("keeps the input box open when focus is lost", async () => {
        const harness = createHarness(validLink);

        await runAgenticCreateLocalTrigger(harness.handleUri, harness.store, harness.dependencies);

        expect(harness.inputOptions()?.ignoreFocusOut).to.be.true;
    });

    it("rejects invalid input through the input box validator", async () => {
        const harness = createHarness(validLink);

        await runAgenticCreateLocalTrigger(harness.handleUri, harness.store, harness.dependencies);
        const validate = harness.inputOptions()?.validateInput;

        expect(validate?.(validLink.replace('/agenticCreate', '/pacCreate'))).to.be.a('string');
        expect(validate?.(validLink)).to.be.undefined;
    });

    it("does nothing when the developer cancels", async () => {
        const harness = createHarness(undefined);

        await runAgenticCreateLocalTrigger(harness.handleUri, harness.store, harness.dependencies);

        expect(harness.handled).to.be.empty;
        expect(harness.stored.size).to.equal(0);
    });

    it("does not dispatch a link that fails validation", async () => {
        const harness = createHarness('not a link');

        await runAgenticCreateLocalTrigger(harness.handleUri, harness.store, harness.dependencies);

        expect(harness.handled).to.be.empty;
    });

    it("warns and stops when the flow is disabled", async () => {
        const harness = createHarness(validLink, { isEnabled: () => false });

        await runAgenticCreateLocalTrigger(harness.handleUri, harness.store, harness.dependencies);

        expect(harness.handled).to.be.empty;
        expect(harness.warnings).to.have.lengthOf(1);
        expect(harness.warnings[0]).to.contain(
            `${URI_CONSTANTS.LOCAL_OVERRIDE_SETTING.NAMESPACE}.${URI_CONSTANTS.LOCAL_OVERRIDE_SETTING.AGENTIC_CREATE_ENABLED}`
        );
    });

    it("works without a store", async () => {
        const harness = createHarness(validLink);

        await runAgenticCreateLocalTrigger(harness.handleUri, undefined, harness.dependencies);

        expect(harness.handled).to.have.lengthOf(1);
    });

    it("declares the command and its palette gate in the manifest", () => {
        const packageJson = vscode.extensions.getExtension(URI_CONSTANTS.EXTENSION_ID)?.packageJSON;
        const contributed = packageJson.contributes.commands.find(
            (command: { command: string }) => command.command === URI_CONSTANTS.LOCAL_TRIGGER.COMMAND_ID
        );
        const paletteGate = packageJson.contributes.menus.commandPalette.find(
            (entry: { command: string }) => entry.command === URI_CONSTANTS.LOCAL_TRIGGER.COMMAND_ID
        );

        expect(contributed, 'command is contributed').to.not.be.undefined;
        // The palette entry must stay gated on the same setting that enables the flow, so the
        // developer-only command never shows up for shipped users.
        expect(paletteGate?.when).to.contain(
            `config.${URI_CONSTANTS.LOCAL_OVERRIDE_SETTING.NAMESPACE}.${URI_CONSTANTS.LOCAL_OVERRIDE_SETTING.AGENTIC_CREATE_ENABLED}`
        );
    });

    it("registers a disposable command bound to the handler", async () => {
        // The activated extension may already own the command; only register when it is free.
        if ((await vscode.commands.getCommands(true)).includes(URI_CONSTANTS.LOCAL_TRIGGER.COMMAND_ID)) {
            return;
        }

        const disposable = registerAgenticCreateLocalTrigger(async () => undefined);

        try {
            expect(await vscode.commands.getCommands(true)).to.contain(
                URI_CONSTANTS.LOCAL_TRIGGER.COMMAND_ID
            );
        } finally {
            disposable.dispose();
        }

        expect(await vscode.commands.getCommands(true)).to.not.contain(
            URI_CONSTANTS.LOCAL_TRIGGER.COMMAND_ID
        );
    });
});
