/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import { EventEmitter } from "events";
import { PassThrough } from "stream";
import { ChildProcessWithoutNullStreams } from "child_process";
import { IPacWrapperContext, PacArguments, PacInterop, PacProcessSpawner } from "../../pac/PacWrapper";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";

class MockContext implements IPacWrapperContext {
    public get globalStorageLocalPath(): string { return ""; }
    public get automationAgent(): string { return "powerplatform-vscode-tests/0.1.0-dev"; }
    public IsTelemetryEnabled(): boolean { return false; }
    public GetCloudSetting(): string { return 'Public'; }
}

/**
 * Stands in for the long-lived `pac --non-interactive` process. Emits the version banner that
 * {@link PacInterop} consumes on startup, and lets a test drive stdout, stderr and termination.
 */
class FakePacProcess extends EventEmitter {
    public readonly stdout = new PassThrough();
    public readonly stderr = new PassThrough();
    public readonly writtenCommands: string[] = [];
    public killed = false;
    public readonly stdin = {
        write: (command: string) => { this.writtenCommands.push(command); return true; }
    };

    public constructor() {
        super();
        // Buffered until readline attaches, so this is safe to emit before the reader exists.
        this.stdout.write("Microsoft PowerPlatform CLI (fake)\n");
    }

    public kill(): boolean {
        this.killed = true;
        return true;
    }

    public writeLine(line: string): void {
        this.stdout.write(`${line}\n`);
    }

    public writeStandardError(text: string): void {
        this.stderr.write(text);
    }

    public terminate(code: number | null, signal: NodeJS.Signals | null = null): void {
        this.emit('exit', code, signal);
    }

    public asChildProcess(): ChildProcessWithoutNullStreams {
        return this as unknown as ChildProcessWithoutNullStreams;
    }
}

describe('PacInterop process lifecycle', () => {
    let spawned: FakePacProcess[];
    let spawner: PacProcessSpawner;

    beforeEach(() => {
        // The telemetry singleton is not instantiated in the test host, so getLogger() would
        // otherwise return undefined and every traceInfo call would throw.
        sinon.stub(oneDSLoggerWrapper, 'getLogger').returns({
            traceInfo: () => undefined,
            traceError: () => undefined,
            traceWarning: () => undefined,
            featureUsage: () => undefined
        } as unknown as ReturnType<typeof oneDSLoggerWrapper.getLogger>);

        spawned = [];
        spawner = () => {
            const fake = new FakePacProcess();
            spawned.push(fake);
            return fake.asChildProcess();
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    const createInterop = () => new PacInterop(new MockContext(), "", spawner);

    it('drains stderr so a full pipe cannot stall the process', async () => {
        const interop = createInterop();
        const pending = interop.executeCommand(new PacArguments("org", "who"));

        // Wait for the banner to be consumed and the command to be written.
        await new Promise(resolve => setTimeout(resolve, 20));
        const proc = spawned[0];

        // Far more than a pipe buffer would hold; nothing may be left unread.
        proc.writeStandardError("e".repeat(200000));
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(proc.stderr.readableLength).to.equal(0);

        proc.writeLine('{"Status":"Success"}');
        expect(await pending).to.equal('{"Status":"Success"}');
    });

    it('fails an in-flight command when the PAC process exits', async () => {
        const interop = createInterop();
        const pending = interop.executeCommand(new PacArguments("org", "who"));

        await new Promise(resolve => setTimeout(resolve, 20));
        spawned[0].writeStandardError("Could not reach the authentication endpoint.");
        await new Promise(resolve => setTimeout(resolve, 20));
        spawned[0].terminate(1);

        let message = "";
        try {
            await pending;
            expect.fail("executeCommand should reject when the process exits");
        } catch (error) {
            message = (error as Error).message;
        }

        expect(message).to.contain("exit code 1");
        expect(message).to.contain("Could not reach the authentication endpoint.");
    });

    it('fails an in-flight command when the PAC process cannot start', async () => {
        const interop = createInterop();
        const pending = interop.executeCommand(new PacArguments("org", "who"));

        await new Promise(resolve => setTimeout(resolve, 20));
        spawned[0].emit('error', new Error("spawn ENOENT"));

        let message = "";
        try {
            await pending;
            expect.fail("executeCommand should reject when the process errors");
        } catch (error) {
            message = (error as Error).message;
        }

        expect(message).to.contain("spawn ENOENT");
    });

    it('starts a fresh process for the next command after a termination', async () => {
        const interop = createInterop();
        const firstCommand = interop.executeCommand(new PacArguments("org", "who"));

        await new Promise(resolve => setTimeout(resolve, 20));
        spawned[0].terminate(1);
        await firstCommand.catch(() => undefined);

        const secondCommand = interop.executeCommand(new PacArguments("auth", "list"));
        await new Promise(resolve => setTimeout(resolve, 20));

        expect(spawned.length).to.equal(2);
        spawned[1].writeLine('{"Status":"Success"}');
        expect(await secondCommand).to.equal('{"Status":"Success"}');
    });

    it('sends the exit command as a complete line so PAC can shut down gracefully', async () => {
        const interop = createInterop();
        const pending = interop.executeCommand(new PacArguments("org", "who"));

        await new Promise(resolve => setTimeout(resolve, 20));
        const proc = spawned[0];
        proc.writeLine('{"Status":"Success"}');
        await pending;

        await interop.exit();

        const exitCommand = proc.writtenCommands[proc.writtenCommands.length - 1];
        expect(exitCommand.endsWith("\n")).to.be.true;
        expect(exitCommand).to.contain("exit");
    });
});
