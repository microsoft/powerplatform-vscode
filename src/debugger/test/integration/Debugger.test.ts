/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// import { DebugSession } from "vscode";
// import sinon from "sinon";
// import * as vscode from "vscode";
// import { Debugger } from "../../debugAdaptor/Debugger";
// import { expect } from "chai";
// import { BrowserManager } from "../../browser/BrowserManager";
// import { ProtocolMessage } from "../../debugAdaptor/DebugProtocolMessage";
// import {
//     expectThrowsAsync,
//     getMockBrowserManager,
//     getWorkspaceFolder,
//     mockFileSystemWatcher,
//     mockTabbedControlConfiguration,
// } from "../helpers";

// describe("Debugger", () => {
//     let instance: Debugger;
//     let browserManagerInstance: BrowserManager;
//     let attachEdgeDebuggerSpy: sinon.SinonSpy<[retryCount?: number | undefined], Promise<void>>;
//     const activeDebugSessionStub = sinon.stub(
//         vscode.debug,
//         "activeDebugSession"
//     );
//     const startDebuggingStub = sinon.stub(vscode.debug, "startDebugging");
//     const onDidStartDebugSessionStub = sinon.stub(
//         vscode.debug,
//         "onDidStartDebugSession"
//     );

//     const parentSession = {
//         id: "parentSessionId",
//         configuration: mockTabbedControlConfiguration,
//     } as unknown as DebugSession;

//     const workspace = getWorkspaceFolder();
//     const fileSystemWatcherStub = mockFileSystemWatcher();
//     let onDebugSessionStartedCallback: (session: DebugSession) => void = () =>
//         undefined;

//     after(() => {
//         fileSystemWatcherStub.restore();
//         startDebuggingStub.restore();
//         activeDebugSessionStub.restore();
//         onDidStartDebugSessionStub.restore();
//         attachEdgeDebuggerSpy.restore();
//     });

//     /**
//      * Creates a new testing instance of the debugger.
//      * @param invokeOnBrowserClose Calls {@link Debugger.stopDebugging}
//      * @param invokeOnBrowserReady Calls {@link Debugger.attachEdgeDebugger}
//      * @returns
//      */
//     const initializeDebuggerInstance = (
//         invokeOnBrowserClose: boolean,
//         invokeOnBrowserReady: boolean
//     ): Debugger => {
//         browserManagerInstance = getMockBrowserManager(
//             invokeOnBrowserClose,
//             invokeOnBrowserReady
//         );
//         const instance = new Debugger(
//             browserManagerInstance,
//             parentSession,
//             workspace,
//             1,
//             0,
//             0
//         );
//         attachEdgeDebuggerSpy = sinon.spy(instance, "attachEdgeDebugger");
//         return instance;
//     };

//     beforeEach(() => {
//         startDebuggingStub.reset();
//         startDebuggingStub.resetHistory();
//         onDidStartDebugSessionStub.reset();
//         activeDebugSessionStub.reset();
//         onDidStartDebugSessionStub.callsFake((cb) => {
//             onDebugSessionStartedCallback = cb;
//             return { dispose: () => undefined };
//         });
//     });

//     const mockDebugSessionStart = async (startSucceeds = true) => {
//         activeDebugSessionStub.get(() =>
//             startSucceeds ? parentSession : undefined
//         );
//         startDebuggingStub.resolves(startSucceeds);

//         instance = initializeDebuggerInstance(false, false);
//         await instance.attachEdgeDebugger(1);

//         if (startSucceeds) {
//             onDebugSessionStartedCallback(parentSession);
//         }
//         return startDebuggingStub;
//     };

//     const expectDebuggerToBeInState = (instance: Debugger, state: boolean) => {
//         expect(instance.isRunning).to.equal(state);
//         expect(instance.hasAttachedDebuggerSession).to.equal(state);
//     };

//     describe("starts", () => {
//         it("starts the debugger", async () => {
//             const startDebuggingStub = await mockDebugSessionStart();
//             sinon.assert.calledOnce(startDebuggingStub);
//             expectDebuggerToBeInState(instance, true);
//         });

//         it("doesn't restart if already running", async () => {
//             const startDebuggingStub = await mockDebugSessionStart();
//             sinon.assert.calledOnce(startDebuggingStub);
//             expectDebuggerToBeInState(instance, true);
//             startDebuggingStub.resetHistory();
//             await instance.attachEdgeDebugger();
//             sinon.assert.notCalled(startDebuggingStub);
//         });

//         it("onBrowserReady starts debugger", () => {
//             initializeDebuggerInstance(false, true);
//             sinon.assert.calledOnce(startDebuggingStub);
//         });

//         it("retries starting debugger if it fails", async () => {
//             await mockDebugSessionStart(false);
//             sinon.assert.calledTwice(attachEdgeDebuggerSpy);
//             expectDebuggerToBeInState(instance, false);
//         });

//         it("throws if started after being disposed", async () => {
//             instance.dispose();
//             await expectThrowsAsync(() => instance.attachEdgeDebugger());
//         });
//     });

//     describe("stops", () => {
//         const stopDebuggingStub = sinon
//             .stub(vscode.debug, "stopDebugging")
//             .resolves();

//         afterEach(() => {
//             stopDebuggingStub.resetHistory();
//         });

//         after(() => {
//             startDebuggingStub.restore();
//         });

//         it("disposes if onDidTerminateDebugSession is called", async () => {
//             let invokeOnTerminateDebugSession: (e: DebugSession) => void = () =>
//                 undefined;
//             const onDidTerminateDebugSessionStub = sinon
//                 .stub(vscode.debug, "onDidTerminateDebugSession")
//                 .callsFake((cb) => {
//                     invokeOnTerminateDebugSession = cb;
//                     return { dispose: () => undefined };
//                 });
//             await mockDebugSessionStart();

//             // simulate session stop
//             activeDebugSessionStub.get(() => undefined);
//             invokeOnTerminateDebugSession(parentSession);
//             expect(instance.isDisposed).to.be.true;
//             onDidTerminateDebugSessionStub.restore();
//         });

//         it("on disconnect message", async () => {
//             await mockDebugSessionStart();
//             expectDebuggerToBeInState(instance, true);

//             instance.handleMessage({
//                 command: "disconnect",
//             } as ProtocolMessage);
//             sinon.assert.called(stopDebuggingStub);
//             stopDebuggingStub.restore();
//         });
//     });

//     describe("handleMessage", () => {
//         it("calls launch on initialize command", async () => {
//             const launchSpy = browserManagerInstance.launch as sinon.SinonStub<[], Promise<void>>;
//             instance.handleMessage({ command: "initialize" } as ProtocolMessage);
//             sinon.assert.calledOnce(launchSpy);
//             launchSpy.restore();
//         });
//     });
// });
