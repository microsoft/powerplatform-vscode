/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// https://code.visualstudio.com/api/extension-capabilities/common-capabilities#output-channel

import * as vscode from 'vscode';
import { spawnSync } from 'child_process';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import { PORTAL_YEOMAN_GENERATOR_PACKAGE_NAME, PORTAL_YEOMAN_GENERATOR_PACKAGE_TARBALL_NAME } from '../../common/constants';
import { ICliAcquisitionContext } from './CliAcquisitionContext';
import { glob } from 'glob';
import commandExists from 'command-exists';
import { oneDSLoggerWrapper } from '../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper';

declare const __GENERATOR_PACKAGE_VERSION__: string | undefined;

export interface IDisposable {
    dispose(): void;
}

// This class is responsible for ensuring that the yeoman-generator and the yo command is available for the extension to perform CRUD operations on PowerPages records.
export class GeneratorAcquisition implements IDisposable {

    private readonly _context: ICliAcquisitionContext;
    private readonly _ppagesGlobalPath: string;
    private readonly _installedPackageJson: string;
    private readonly _generatorVersion: string;
    private readonly _yoVersion: string = '4.3.1';
    private readonly _tgzFolder: string;

    public get generatorVersion(): string {
        const tgzPackage = glob.sync(`${PORTAL_YEOMAN_GENERATOR_PACKAGE_TARBALL_NAME}*.tgz`, { cwd: this._tgzFolder })
        if (tgzPackage.length > 0) {
            return `file:${path.join(this._tgzFolder, tgzPackage[0])}`;
        } else {
            return this._generatorVersion;
        }
    }

    public get yoVersion(): string {
        return this._yoVersion;
    }

    public get npmCommand(): string {
        const execName = (os.platform() === 'win32') ? 'npm.cmd' : 'npm';
        return execName;
    }

    public get yoCommandPath(): string | null {
        const execName = (os.platform() === 'win32') ? 'yo.cmd' : 'yo';
        const yoBinaryPath = path.join(this._ppagesGlobalPath, 'node_modules', ".bin", execName);
        return fs.pathExistsSync(yoBinaryPath) ? yoBinaryPath : null;
    }

    public constructor(context: ICliAcquisitionContext) {
        this._context = context;
        this._ppagesGlobalPath = path.resolve(context.globalStorageLocalPath, 'powerpages');
        this._installedPackageJson = path.resolve(this._ppagesGlobalPath, 'package.json');
        this._tgzFolder = path.join(this._context.extensionPath, 'dist', 'powerpages');
        this._generatorVersion = __GENERATOR_PACKAGE_VERSION__ || "1.0.0";
    }

    public dispose(): void {
        this._context.showInformationMessage('Bye');
    }

    private npm(args: string[]) {
        return spawnSync(this.npmCommand, args, { cwd: this._ppagesGlobalPath, shell: true });
    }

    public ensureInstalled(): string | null {
        if (!fs.existsSync(this._ppagesGlobalPath)) {
            fs.mkdirSync(this._ppagesGlobalPath);
        }

        if (this.yoCommandPath === null || this.getInstalledVersion() !== this.generatorVersion) {
            if (!commandExists.sync('npm')) {
                this._context.showErrorMessage(vscode.l10n.t({
                    message: 'Cannot install Power Pages generator. Please install npm and try again.',
                    comment: ["Do not translate 'npm'"]
                }));
                return null;
            }
            this._context.showInformationMessage(
                vscode.l10n.t({
                    message: "Installing Power Pages generator(v{0})...",
                    args: [this.generatorVersion],
                    comment: ["{0} represents the version number"]
                }));

            const packageJson = {
                name: "PowerPages VSCODE",
                version: "1.0.0",
                dependencies: {
                    yo: this.yoVersion,
                    [PORTAL_YEOMAN_GENERATOR_PACKAGE_NAME]: this.generatorVersion
                }
            }

            fs.writeFileSync(path.join(this._ppagesGlobalPath, "package.json"), JSON.stringify(packageJson), 'utf-8');

            const child = this.npm(['install']);
            if (child.error) {
                oneDSLoggerWrapper.getLogger().traceError(
                    'PowerPagesGeneratorInstallComplete',
                    String(child.error),
                    { name: 'PowerPagesGeneratorInstallComplete', message: String(child.error) } as Error,
                    { cliVersion: this._generatorVersion }, {}
                );

                this._context.showErrorMessage(vscode.l10n.t({
                    message: "Cannot install Power Pages generator: {0}",
                    args: [String(child.error)],
                    comment: ["{0} represents the error message returned from the exception"]
                }));
            } else {
                oneDSLoggerWrapper.getLogger().traceInfo('PowerPagesGeneratorInstallComplete', { cliVersion: this._generatorVersion });
                this._context.showInformationMessage(vscode.l10n.t('The Power Pages generator is ready for use in your VS Code extension!'));
            }
        }
        return this.yoCommandPath

    }

    getInstalledVersion(): string | undefined {
        if (!fs.existsSync(this._installedPackageJson)) {
            return undefined;
        }
        try {
            const packageJson = JSON.parse(fs.readFileSync(this._installedPackageJson, 'utf-8'));
            return packageJson?.dependencies?.[PORTAL_YEOMAN_GENERATOR_PACKAGE_NAME];
        }
        catch {
            return undefined;
        }
    }
}
