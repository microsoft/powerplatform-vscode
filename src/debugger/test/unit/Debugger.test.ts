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
    getWorkspaceFolder,
    mockFileSystemWatcher,
    mockTabbedControlConfiguration,
} from "../helpers";

suite("Debugger", () => {
    let instance: Debugger;
    const activeDebugSessionSpy = sinon.stub(
        vscode.debug,
        "activeDebugSession"
    );
    const startDebuggingSpy = sinon.stub(vscode.debug, "startDebugging");
    let onDebugSessionStartedCallback: (session: DebugSession) => void = () =>
        undefined;
    const onDidStartDebugSessionSpy = sinon.stub(
        vscode.debug,
        "onDidStartDebugSession"
    );

    const parentSession = {
        id: "parentSessionId",
        configuration: mockTabbedControlConfiguration,
    } as unknown as DebugSession;

    const workspace = getWorkspaceFolder();
    const fileSystemWatcherStub = mockFileSystemWatcher();

    mocha.after(() => {
        fileSystemWatcherStub.restore();
    });

    mocha.beforeEach(() => {
        startDebuggingSpy.reset();
        onDidStartDebugSessionSpy.reset();
        activeDebugSessionSpy.reset();
        onDidStartDebugSessionSpy.callsFake((cb) => {
            onDebugSessionStartedCallback = cb;
            return { dispose: () => undefined };
        });

        instance = new Debugger(
            parentSession,
            workspace,
            NoopTelemetryInstance,
            1,
            0
        );
    });

    const mockDebugSessionStart = async (startSucceeds = true) => {
        activeDebugSessionSpy.get(() =>
            startSucceeds ? parentSession : undefined
        );
        startDebuggingSpy.resolves(startSucceeds);
        await instance.attachEdgeDebugger(1);

        if (startSucceeds) {
            onDebugSessionStartedCallback(parentSession);
        }
        return startDebuggingSpy;
    };

    const expectDebuggerToBeInState = (instance: Debugger, state: boolean) => {
        expect(instance.isRunning).to.equal(state);
        expect(instance.hasAttachedDebuggerSession).to.equal(state);
    };

    test("starts the debugger", async () => {
        const startDebuggingSpy = await mockDebugSessionStart();
        sinon.assert.calledOnce(startDebuggingSpy);
        expectDebuggerToBeInState(instance, true);
    });

    test("retries starting debugger if it fails", async () => {
        const startDebuggingSpy = await mockDebugSessionStart(false);
        sinon.assert.calledTwice(startDebuggingSpy);
        expectDebuggerToBeInState(instance, false);
    });

    mocha.describe("handleMessage", () => {
        test("stops debugging on disconnect", async () => {
            const stopDebuggingSpy = sinon
                .stub(vscode.debug, "stopDebugging")
                .resolves();
            await mockDebugSessionStart();
            expectDebuggerToBeInState(instance, true);

            instance.handleMessage({
                command: "disconnect",
            } as ProtocolMessage);
            sinon.assert.called(stopDebuggingSpy);
        });

        test("calls launch on initialize command", async () => {
            const launchSpy = sinon.spy(BrowserManager.prototype, "launch");
            instance.handleMessage({
                command: "initialize",
            } as ProtocolMessage);
            sinon.assert.calledOnce(launchSpy);
        });
    });
});
