/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { MultiStepInput } from "../../../common/utilities/MultiStepInput";

describe("MultiStepInput", () => {
    let sandbox: sinon.SinonSandbox;
    let mockQuickPick: {
        title: string;
        step: number | undefined;
        totalSteps: number | undefined;
        placeholder: string;
        items: vscode.QuickPickItem[];
        activeItems: vscode.QuickPickItem[];
        buttons: vscode.QuickInputButton[];
        busy: boolean;
        enabled: boolean;
        show: sinon.SinonStub;
        dispose: sinon.SinonStub;
        onDidTriggerButton: sinon.SinonStub;
        onDidChangeSelection: sinon.SinonStub;
        onDidHide: sinon.SinonStub;
    };
    let mockInputBox: {
        title: string;
        step: number | undefined;
        totalSteps: number | undefined;
        value: string;
        prompt: string | undefined;
        placeholder: string;
        buttons: vscode.QuickInputButton[];
        busy: boolean;
        enabled: boolean;
        validationMessage: string | undefined;
        show: sinon.SinonStub;
        dispose: sinon.SinonStub;
        onDidTriggerButton: sinon.SinonStub;
        onDidAccept: sinon.SinonStub;
        onDidChangeValue: sinon.SinonStub;
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let createQuickPickStub: sinon.SinonStub;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let createInputBoxStub: sinon.SinonStub;
    let buttonCallbacks: ((button: vscode.QuickInputButton) => void)[];
    let selectionCallbacks: ((items: vscode.QuickPickItem[]) => void)[];
    let hideCallbacks: (() => void)[];
    let acceptCallbacks: (() => void)[];
    let valueChangeCallbacks: ((value: string) => void)[];

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        buttonCallbacks = [];
        selectionCallbacks = [];
        hideCallbacks = [];
        acceptCallbacks = [];
        valueChangeCallbacks = [];

        mockQuickPick = {
            title: "",
            step: undefined,
            totalSteps: undefined,
            placeholder: "",
            items: [],
            activeItems: [],
            buttons: [],
            busy: false,
            enabled: true,
            show: sandbox.stub(),
            dispose: sandbox.stub(),
            onDidTriggerButton: sandbox.stub().callsFake((callback) => {
                buttonCallbacks.push(callback);
                return { dispose: () => { } };
            }),
            onDidChangeSelection: sandbox.stub().callsFake((callback) => {
                selectionCallbacks.push(callback);
                return { dispose: () => { } };
            }),
            onDidHide: sandbox.stub().callsFake((callback) => {
                hideCallbacks.push(callback);
                return { dispose: () => { } };
            })
        };

        mockInputBox = {
            title: "",
            step: undefined,
            totalSteps: undefined,
            value: "",
            prompt: undefined,
            placeholder: "",
            buttons: [],
            busy: false,
            enabled: true,
            validationMessage: undefined,
            show: sandbox.stub(),
            dispose: sandbox.stub(),
            onDidTriggerButton: sandbox.stub().callsFake((callback) => {
                buttonCallbacks.push(callback);
                return { dispose: () => { } };
            }),
            onDidAccept: sandbox.stub().callsFake((callback) => {
                acceptCallbacks.push(callback);
                return { dispose: () => { } };
            }),
            onDidChangeValue: sandbox.stub().callsFake((callback) => {
                valueChangeCallbacks.push(callback);
                return { dispose: () => { } };
            })
        };

        createQuickPickStub = sandbox.stub(vscode.window, "createQuickPick").returns(mockQuickPick as unknown as vscode.QuickPick<vscode.QuickPickItem>);
        createInputBoxStub = sandbox.stub(vscode.window, "createInputBox").returns(mockInputBox as unknown as vscode.InputBox);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("run", () => {
        it("should create a new MultiStepInput instance and run the start step", async () => {
            const startStep = sandbox.stub().callsFake(async () => {
                // Simulate selection to complete the step
                setTimeout(() => {
                    selectionCallbacks[0]?.([{ label: "Test Item" }]);
                }, 0);
            });

            await MultiStepInput.run(startStep);

            expect(startStep.calledOnce).to.be.true;
        });

        it("should dispose the current input when done", async () => {
            const startStep = sandbox.stub().callsFake(async (input: MultiStepInput) => {
                await input.showQuickPick({
                    title: "Test",
                    step: 1,
                    totalSteps: 1,
                    items: [{ label: "Item 1" }],
                    placeholder: "Select"
                });
            });

            // Simulate selection
            setTimeout(() => {
                selectionCallbacks[0]?.([{ label: "Item 1" }]);
            }, 0);

            await MultiStepInput.run(startStep);

            expect(mockQuickPick.dispose.called).to.be.true;
        });
    });

    describe("showQuickPick", () => {
        it("should configure quick pick with correct properties", async () => {
            const items = [{ label: "Item 1" }, { label: "Item 2" }];

            const startStep = sandbox.stub().callsFake(async (input: MultiStepInput) => {
                const pickPromise = input.showQuickPick({
                    title: "Test Title",
                    step: 1,
                    totalSteps: 3,
                    items,
                    placeholder: "Select an item"
                });

                // Simulate selection
                setTimeout(() => {
                    selectionCallbacks[0]?.([items[0]]);
                }, 0);

                await pickPromise;
            });

            await MultiStepInput.run(startStep);

            expect(mockQuickPick.title).to.equal("Test Title");
            expect(mockQuickPick.step).to.equal(1);
            expect(mockQuickPick.totalSteps).to.equal(3);
            expect(mockQuickPick.placeholder).to.equal("Select an item");
            expect(mockQuickPick.items).to.deep.equal(items);
            expect(mockQuickPick.show.calledOnce).to.be.true;
        });

        it("should resolve with selected item", async () => {
            const items = [{ label: "Item 1" }, { label: "Item 2" }];
            let selectedItem: vscode.QuickPickItem | undefined;

            const startStep = sandbox.stub().callsFake(async (input: MultiStepInput) => {
                selectedItem = await input.showQuickPick({
                    title: "Test",
                    step: 1,
                    totalSteps: 1,
                    items,
                    placeholder: "Select"
                });
            });

            // Simulate selection
            setTimeout(() => {
                selectionCallbacks[0]?.([items[1]]);
            }, 0);

            await MultiStepInput.run(startStep);

            expect(selectedItem).to.deep.equal(items[1]);
        });

        it("should set active item when provided", async () => {
            const items = [{ label: "Item 1" }, { label: "Item 2" }];

            const startStep = sandbox.stub().callsFake(async (input: MultiStepInput) => {
                const pickPromise = input.showQuickPick({
                    title: "Test",
                    step: 1,
                    totalSteps: 1,
                    items,
                    activeItem: items[1],
                    placeholder: "Select"
                });

                setTimeout(() => {
                    selectionCallbacks[0]?.([items[0]]);
                }, 0);

                await pickPromise;
            });

            await MultiStepInput.run(startStep);

            expect(mockQuickPick.activeItems).to.deep.equal([items[1]]);
        });

        it("should not show back button on first step", async () => {
            const startStep = sandbox.stub().callsFake(async (input: MultiStepInput) => {
                const pickPromise = input.showQuickPick({
                    title: "Test",
                    step: 1,
                    totalSteps: 2,
                    items: [{ label: "Item" }],
                    placeholder: "Select"
                });

                setTimeout(() => {
                    selectionCallbacks[0]?.([{ label: "Item" }]);
                }, 0);

                await pickPromise;
            });

            await MultiStepInput.run(startStep);

            // First step should not have back button
            expect(mockQuickPick.buttons).to.deep.equal([]);
        });

        it("should show back button on subsequent steps", async () => {
            let secondStepButtons: vscode.QuickInputButton[] = [];

            const step2 = async (input: MultiStepInput): Promise<void> => {
                const pickPromise = input.showQuickPick({
                    title: "Step 2",
                    step: 2,
                    totalSteps: 2,
                    items: [{ label: "Item 2" }],
                    placeholder: "Select"
                });

                secondStepButtons = [...mockQuickPick.buttons];

                setTimeout(() => {
                    selectionCallbacks[selectionCallbacks.length - 1]?.([{ label: "Item 2" }]);
                }, 0);

                await pickPromise;
            };

            const step1 = async (input: MultiStepInput): Promise<typeof step2 | void> => {
                const pickPromise = input.showQuickPick({
                    title: "Step 1",
                    step: 1,
                    totalSteps: 2,
                    items: [{ label: "Item 1" }],
                    placeholder: "Select"
                });

                setTimeout(() => {
                    selectionCallbacks[selectionCallbacks.length - 1]?.([{ label: "Item 1" }]);
                }, 0);

                await pickPromise;
                return step2;
            };

            await MultiStepInput.run(step1);

            expect(secondStepButtons.length).to.equal(1);
            expect(secondStepButtons[0]).to.equal(vscode.QuickInputButtons.Back);
        });

        it("should include custom buttons when provided", async () => {
            const customButton: vscode.QuickInputButton = {
                iconPath: new vscode.ThemeIcon("refresh"),
                tooltip: "Refresh"
            };

            const startStep = sandbox.stub().callsFake(async (input: MultiStepInput) => {
                const pickPromise = input.showQuickPick({
                    title: "Test",
                    step: 1,
                    totalSteps: 1,
                    items: [{ label: "Item" }],
                    placeholder: "Select",
                    buttons: [customButton]
                });

                setTimeout(() => {
                    selectionCallbacks[0]?.([{ label: "Item" }]);
                }, 0);

                await pickPromise;
            });

            await MultiStepInput.run(startStep);

            expect(mockQuickPick.buttons).to.deep.equal([customButton]);
        });
    });

    describe("showQuickPickAsync", () => {
        it("should show loading state initially", async () => {
            let wasInitiallyBusy = false;
            let wasInitiallyDisabled = false;

            const startStep = sandbox.stub().callsFake(async (input: MultiStepInput) => {
                const itemsPromise = new Promise<vscode.QuickPickItem[]>((resolve) => {
                    setTimeout(() => {
                        resolve([{ label: "Item 1" }]);
                    }, 10);
                });

                const pickPromise = input.showQuickPickAsync({
                    title: "Test",
                    step: 1,
                    totalSteps: 1,
                    itemsPromise,
                    placeholder: "Select",
                    loadingPlaceholder: "Loading..."
                });

                // Capture initial state
                wasInitiallyBusy = mockQuickPick.busy;
                wasInitiallyDisabled = !mockQuickPick.enabled;

                setTimeout(() => {
                    selectionCallbacks[0]?.([{ label: "Item 1" }]);
                }, 20);

                await pickPromise;
            });

            await MultiStepInput.run(startStep);

            expect(wasInitiallyBusy).to.be.true;
            expect(wasInitiallyDisabled).to.be.true;
        });

        it("should show loading placeholder initially", async () => {
            let initialPlaceholder = "";

            const startStep = sandbox.stub().callsFake(async (input: MultiStepInput) => {
                const itemsPromise = new Promise<vscode.QuickPickItem[]>((resolve) => {
                    setTimeout(() => {
                        resolve([{ label: "Item 1" }]);
                    }, 10);
                });

                const pickPromise = input.showQuickPickAsync({
                    title: "Test",
                    step: 1,
                    totalSteps: 1,
                    itemsPromise,
                    placeholder: "Select an item",
                    loadingPlaceholder: "Loading items..."
                });

                initialPlaceholder = mockQuickPick.placeholder;

                setTimeout(() => {
                    selectionCallbacks[0]?.([{ label: "Item 1" }]);
                }, 20);

                await pickPromise;
            });

            await MultiStepInput.run(startStep);

            expect(initialPlaceholder).to.equal("Loading items...");
        });

        it("should update items and enable input when promise resolves", async () => {
            const items = [{ label: "Item 1" }, { label: "Item 2" }];
            let finalBusy = true;
            let finalEnabled = false;

            const startStep = sandbox.stub().callsFake(async (input: MultiStepInput) => {
                const itemsPromise = Promise.resolve(items);

                const pickPromise = input.showQuickPickAsync({
                    title: "Test",
                    step: 1,
                    totalSteps: 1,
                    itemsPromise,
                    placeholder: "Select"
                });

                // Wait for the promise to resolve and update the UI
                await new Promise(resolve => setTimeout(resolve, 0));

                finalBusy = mockQuickPick.busy;
                finalEnabled = mockQuickPick.enabled;

                setTimeout(() => {
                    selectionCallbacks[0]?.([items[0]]);
                }, 0);

                await pickPromise;
            });

            await MultiStepInput.run(startStep);

            expect(mockQuickPick.items).to.deep.equal(items);
            expect(finalBusy).to.be.false;
            expect(finalEnabled).to.be.true;
        });

        it("should reject when items promise rejects", async () => {
            const error = new Error("Failed to load items");
            let caughtError: Error | undefined;

            const startStep = sandbox.stub().callsFake(async (input: MultiStepInput) => {
                const itemsPromise = Promise.reject(error);

                try {
                    await input.showQuickPickAsync({
                        title: "Test",
                        step: 1,
                        totalSteps: 1,
                        itemsPromise,
                        placeholder: "Select"
                    });
                } catch (err) {
                    caughtError = err as Error;
                    throw err;
                }
            });

            try {
                await MultiStepInput.run(startStep);
            } catch {
                // Expected
            }

            expect(caughtError).to.equal(error);
        });

        it("should cancel when user hides the quick pick", async () => {
            let wasCompleted = false;

            const startStep = sandbox.stub().callsFake(async (input: MultiStepInput) => {
                const itemsPromise = new Promise<vscode.QuickPickItem[]>((resolve) => {
                    setTimeout(() => resolve([{ label: "Item" }]), 100);
                });

                try {
                    await input.showQuickPickAsync({
                        title: "Test",
                        step: 1,
                        totalSteps: 1,
                        itemsPromise,
                        placeholder: "Select"
                    });
                    wasCompleted = true;
                } catch {
                    // User cancelled
                }
            });

            // Simulate user hiding (cancelling) the quick pick
            setTimeout(() => {
                hideCallbacks[0]?.();
            }, 10);

            await MultiStepInput.run(startStep);

            expect(wasCompleted).to.be.false;
        });
    });

    describe("showInputBox", () => {
        it("should configure input box with correct properties", async () => {
            const startStep = sandbox.stub().callsFake(async (input: MultiStepInput) => {
                const inputPromise = input.showInputBox({
                    title: "Enter Name",
                    step: 1,
                    totalSteps: 2,
                    value: "initial",
                    prompt: "Enter your name",
                    placeholder: "Name here",
                    validate: async () => undefined
                });

                // Simulate accept
                setTimeout(() => {
                    mockInputBox.value = "test value";
                    acceptCallbacks[0]?.();
                }, 0);

                await inputPromise;
            });

            await MultiStepInput.run(startStep);

            expect(mockInputBox.title).to.equal("Enter Name");
            expect(mockInputBox.step).to.equal(1);
            expect(mockInputBox.totalSteps).to.equal(2);
            expect(mockInputBox.value).to.equal("test value");
            expect(mockInputBox.prompt).to.equal("Enter your name");
            expect(mockInputBox.placeholder).to.equal("Name here");
            expect(mockInputBox.show.calledOnce).to.be.true;
        });

        it("should resolve with input value on accept", async () => {
            let inputValue: string | undefined;

            const startStep = sandbox.stub().callsFake(async (input: MultiStepInput) => {
                const inputPromise = input.showInputBox({
                    title: "Enter Name",
                    step: 1,
                    totalSteps: 1,
                    value: "",
                    placeholder: "Name",
                    validate: async () => undefined
                });

                // Simulate user typing and accepting
                setTimeout(() => {
                    mockInputBox.value = "John Doe";
                    acceptCallbacks[0]?.();
                }, 0);

                inputValue = await inputPromise as string;
            });

            await MultiStepInput.run(startStep);

            expect(inputValue).to.equal("John Doe");
        });

        it("should show busy state during validation", async () => {
            let wasBusyDuringValidation = false;
            let wasDisabledDuringValidation = false;

            const startStep = sandbox.stub().callsFake(async (input: MultiStepInput) => {
                const inputPromise = input.showInputBox({
                    title: "Enter Name",
                    step: 1,
                    totalSteps: 1,
                    value: "",
                    placeholder: "Name",
                    validate: async () => {
                        wasBusyDuringValidation = mockInputBox.busy;
                        wasDisabledDuringValidation = !mockInputBox.enabled;
                        return undefined;
                    }
                });

                setTimeout(() => {
                    mockInputBox.value = "test";
                    acceptCallbacks[0]?.();
                }, 0);

                await inputPromise;
            });

            await MultiStepInput.run(startStep);

            expect(wasBusyDuringValidation).to.be.true;
            expect(wasDisabledDuringValidation).to.be.true;
        });

        it("should include custom buttons", async () => {
            const customButton: vscode.QuickInputButton = {
                iconPath: new vscode.ThemeIcon("info"),
                tooltip: "Info"
            };

            const startStep = sandbox.stub().callsFake(async (input: MultiStepInput) => {
                const inputPromise = input.showInputBox({
                    title: "Test",
                    step: 1,
                    totalSteps: 1,
                    value: "",
                    placeholder: "Enter",
                    validate: async () => undefined,
                    buttons: [customButton]
                });

                setTimeout(() => {
                    mockInputBox.value = "value";
                    acceptCallbacks[0]?.();
                }, 0);

                await inputPromise;
            });

            await MultiStepInput.run(startStep);

            expect(mockInputBox.buttons).to.deep.equal([customButton]);
        });
    });

    describe("back button navigation", () => {
        it("should go back to previous step when back button is pressed", async () => {
            let step1CallCount = 0;
            let step2CallCount = 0;

            const step2 = async (input: MultiStepInput): Promise<void> => {
                step2CallCount++;

                const pickPromise = input.showQuickPick({
                    title: "Step 2",
                    step: 2,
                    totalSteps: 2,
                    items: [{ label: "Item 2" }],
                    placeholder: "Select"
                });

                // On first call, press back. On second call, complete.
                setTimeout(() => {
                    if (step2CallCount === 1) {
                        // Press back button
                        buttonCallbacks[buttonCallbacks.length - 1]?.(vscode.QuickInputButtons.Back);
                    } else {
                        // Complete
                        selectionCallbacks[selectionCallbacks.length - 1]?.([{ label: "Item 2" }]);
                    }
                }, 0);

                await pickPromise;
            };

            const step1 = async (input: MultiStepInput): Promise<typeof step2 | void> => {
                step1CallCount++;

                const pickPromise = input.showQuickPick({
                    title: "Step 1",
                    step: 1,
                    totalSteps: 2,
                    items: [{ label: "Item 1" }],
                    placeholder: "Select"
                });

                setTimeout(() => {
                    selectionCallbacks[selectionCallbacks.length - 1]?.([{ label: "Item 1" }]);
                }, 0);

                await pickPromise;
                return step2;
            };

            await MultiStepInput.run(step1);

            // Step 1 should be called twice (initial + after back)
            expect(step1CallCount).to.equal(2);
            // Step 2 should be called twice (initial + after re-entering from step 1)
            expect(step2CallCount).to.equal(2);
        });
    });

    describe("input disposal", () => {
        it("should dispose previous input when moving to next step", async () => {
            let disposeCallCountAfterStep2QuickPick = 0;

            const step2 = async (input: MultiStepInput): Promise<void> => {
                const pickPromise = input.showQuickPick({
                    title: "Step 2",
                    step: 2,
                    totalSteps: 2,
                    items: [{ label: "Item 2" }],
                    placeholder: "Select"
                });

                // Check dispose count AFTER showQuickPick is called (which triggers dispose of previous input)
                disposeCallCountAfterStep2QuickPick = mockQuickPick.dispose.callCount;

                setTimeout(() => {
                    selectionCallbacks[selectionCallbacks.length - 1]?.([{ label: "Item 2" }]);
                }, 0);

                await pickPromise;
            };

            const step1 = async (input: MultiStepInput): Promise<typeof step2 | void> => {
                const pickPromise = input.showQuickPick({
                    title: "Step 1",
                    step: 1,
                    totalSteps: 2,
                    items: [{ label: "Item 1" }],
                    placeholder: "Select"
                });

                setTimeout(() => {
                    selectionCallbacks[0]?.([{ label: "Item 1" }]);
                }, 0);

                await pickPromise;
                return step2;
            };

            await MultiStepInput.run(step1);

            // After step2 calls showQuickPick, the previous input should have been disposed
            // The dispose is called when creating a new QuickPick while this.current exists
            expect(disposeCallCountAfterStep2QuickPick).to.be.greaterThan(0);
        });
    });
});
