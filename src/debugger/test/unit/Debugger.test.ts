import { DebugSession } from "vscode";
import { NoopTelemetryInstance } from "../../../client/telemetry/NoopTelemetry";
import sinon from "sinon";
import * as vscode from "vscode";
import * as mocha from "mocha";
import { Debugger } from "../../debugAdaptor/Debugger";
import { expect } from "chai";
import { BrowserManager } from "../../browser/BrowserManager";
import { ProtocolMessage } from "../../debugAdaptor/DebugProtocolMessage";
import {
    expectThrowsAsync,
    getMockBrowserManager,
    getWorkspaceFolder,
    mockFileSystemWatcher,
    mockTabbedControlConfiguration,
} from "../helpers";

suite("Debugger", () => {
    let instance: Debugger;
    let browserManagerInstance: BrowserManager;
    let attachEdgeDebuggerSpy: sinon.SinonSpy<any, Promise<void>>;
    const activeDebugSessionStub = sinon.stub(
        vscode.debug,
        "activeDebugSession"
    );
    const startDebuggingStub = sinon.stub(vscode.debug, "startDebugging");
    const onDidStartDebugSessionStub = sinon.stub(
        vscode.debug,
        "onDidStartDebugSession"
    );

    const parentSession = {
        id: "parentSessionId",
        configuration: mockTabbedControlConfiguration,
    } as unknown as DebugSession;

    const workspace = getWorkspaceFolder();
    const fileSystemWatcherStub = mockFileSystemWatcher();
    let onDebugSessionStartedCallback: (session: DebugSession) => void = () =>
        undefined;

    mocha.after(() => {
        fileSystemWatcherStub.restore();
        startDebuggingStub.restore();
        activeDebugSessionStub.restore();
        onDidStartDebugSessionStub.restore();
        attachEdgeDebuggerSpy.restore();
    });

    /**
     * Creates a new testing instance of the debugger.
     * @param invokeOnBrowserClose Calls {@link Debugger.stopDebugging}
     * @param invokeOnBrowserReady Calls {@link Debugger.attachEdgeDebugger}
     * @returns
     */
    const initializeDebuggerInstance = (
        invokeOnBrowserClose: boolean,
        invokeOnBrowserReady: boolean
    ): Debugger => {
        browserManagerInstance = getMockBrowserManager(
            invokeOnBrowserClose,
            invokeOnBrowserReady
        );
        const instance = new Debugger(
            browserManagerInstance,
            parentSession,
            workspace,
            NoopTelemetryInstance,
            1,
            0,
            0
        );
        attachEdgeDebuggerSpy = sinon.spy(instance, "attachEdgeDebugger");
        return instance;
    };

    mocha.beforeEach(() => {
        startDebuggingStub.reset();
        startDebuggingStub.resetHistory();
        onDidStartDebugSessionStub.reset();
        activeDebugSessionStub.reset();
        onDidStartDebugSessionStub.callsFake((cb) => {
            onDebugSessionStartedCallback = cb;
            return { dispose: () => undefined };
        });
    });

    const mockDebugSessionStart = async (startSucceeds = true) => {
        activeDebugSessionStub.get(() =>
            startSucceeds ? parentSession : undefined
        );
        startDebuggingStub.resolves(startSucceeds);

        instance = initializeDebuggerInstance(false, false);
        await instance.attachEdgeDebugger(1);

        if (startSucceeds) {
            onDebugSessionStartedCallback(parentSession);
        }
        return startDebuggingStub;
    };

    const expectDebuggerToBeInState = (instance: Debugger, state: boolean) => {
        expect(instance.isRunning).to.equal(state);
        expect(instance.hasAttachedDebuggerSession).to.equal(state);
    };

    mocha.describe("starts", () => {
        test("starts the debugger", async () => {
            const startDebuggingStub = await mockDebugSessionStart();
            sinon.assert.calledOnce(startDebuggingStub);
            expectDebuggerToBeInState(instance, true);
        });

        test("doesn't restart if already running", async () => {
            const startDebuggingStub = await mockDebugSessionStart();
            sinon.assert.calledOnce(startDebuggingStub);
            expectDebuggerToBeInState(instance, true);
            startDebuggingStub.resetHistory();
            await instance.attachEdgeDebugger();
            sinon.assert.notCalled(startDebuggingStub);
        });

        test("onBrowserReady starts debugger", () => {
            initializeDebuggerInstance(false, true);
            sinon.assert.calledOnce(startDebuggingStub);
        });

        test("retries starting debugger if it fails", async () => {
            await mockDebugSessionStart(false);
            sinon.assert.calledTwice(attachEdgeDebuggerSpy);
            expectDebuggerToBeInState(instance, false);
        });

        test("throws if started after being disposed", async () => {
            instance.dispose();
            await expectThrowsAsync(() => instance.attachEdgeDebugger());
        });
    });

    mocha.describe("stops", () => {
        const stopDebuggingStub = sinon
            .stub(vscode.debug, "stopDebugging")
            .resolves();

        mocha.afterEach(() => {
            stopDebuggingStub.resetHistory();
        });

        mocha.after(() => {
            startDebuggingStub.restore();
        });

        test("disposes if onDidTerminateDebugSession is called", async () => {
            let invokeOnTerminateDebugSession: (e: DebugSession) => void = () =>
                undefined;
            const onDidTerminateDebugSessionStub = sinon
                .stub(vscode.debug, "onDidTerminateDebugSession")
                .callsFake((cb) => {
                    invokeOnTerminateDebugSession = cb;
                    return { dispose: () => undefined };
                });
            await mockDebugSessionStart();

            // simulate session stop
            activeDebugSessionStub.get(() => undefined);
            invokeOnTerminateDebugSession(parentSession);
            expect(instance.isDisposed).to.be.true;
            onDidTerminateDebugSessionStub.restore();
        });

        test("on disconnect message", async () => {
            await mockDebugSessionStart();
            expectDebuggerToBeInState(instance, true);

            instance.handleMessage({
                command: "disconnect",
            } as ProtocolMessage);
            sinon.assert.called(stopDebuggingStub);
            stopDebuggingStub.restore();
        });
    });

    mocha.describe("handleMessage", () => {
        test("calls launch on initialize command", async () => {
            const launchSpy = browserManagerInstance.launch as sinon.SinonStub<
                [],
                Promise<void>
            >;
            instance.handleMessage({
                command: "initialize",
            } as ProtocolMessage);
            sinon.assert.calledOnce(launchSpy);
            launchSpy.restore();
        });
    });
});
