/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

import { ConfigurationManager } from "../configuration";

/**
 * Class that builds the arguments for the browser instance launched by puppeteer.
 */
export class BrowserArgsBuilder {
    private defaultArgs: string[];

    public static readonly debuggingPortArg = "--remote-debugging-port";
    public static readonly userDataDirArg = "--user-data-dir";

    /**
     * Creates a new instance of BrowserArgsBuilder.
     * @param port The remote debugging port specified in the launch configuration or user configuration.
     * @param userDataDir The user data directory specified in the launch configuration or user configuration.
     */
    constructor(port: number, private readonly userDataDir?: string) {
        this.defaultArgs = [
            "--no-first-run",
            "--no-default-browser-check",
            `${BrowserArgsBuilder.debuggingPortArg}=${port}`,
        ];
    }

    /**
     * Builds the arguments for the browser launch by combining the default args and configuration arguments.
     * @returns The arguments for the browser launch.
     */
    public build(): string[] {
        let userDefinedBrowserArgs: string[] =
            ConfigurationManager.getBrowserArgs();
        let defaultArgs = this.defaultArgs;
        userDefinedBrowserArgs = this.removeRemoteDebuggingPort(
            userDefinedBrowserArgs
        );

        if (this.userDataDir) {
            defaultArgs.unshift(
                `${BrowserArgsBuilder.userDataDirArg}=${this.userDataDir}`
            );
            userDefinedBrowserArgs = this.removeUserDataDir(
                userDefinedBrowserArgs
            );
        }

        if (userDefinedBrowserArgs.length) {
            defaultArgs = [...defaultArgs, ...userDefinedBrowserArgs];
        }

        return defaultArgs;
    }

    /**
     * Removes the remote debugging port from the given browser args.
     * @param args The browser args to remove the remote debugging port from.
     * @returns The browser args without the remote debugging port.
     */
    private removeRemoteDebuggingPort(args: string[]): string[] {
        return args.filter(
            (arg) => !arg.startsWith(BrowserArgsBuilder.debuggingPortArg)
        );
    }

    /**
     * Removes the user data directory from the given browser args.
     * @param args The browser args to remove the user data directory from.
     * @returns The browser args without the user data directory.
     */
    private removeUserDataDir(args: string[]): string[] {
        return args.filter(
            (arg) => !arg.startsWith(BrowserArgsBuilder.userDataDirArg)
        );
    }
}

