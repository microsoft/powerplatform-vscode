/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { inflate } from 'pako';
import { MemFS } from './FileSystemProvider';
import { unzip } from './Unzip';

interface PackageJson {
    dependencies?: Record<string, string>;
    main?: string;
}

interface FileEntry {
    size: number;
    buffer: ArrayBuffer;
    name: string;
    readAsString: () => string;
}

export class BrowserNPM {
    private fileSystem: MemFS;
    private installedPackages: Set<string>;

    constructor(memfs: MemFS) {
        this.fileSystem = memfs;
        this.installedPackages = new Set();
    }

    persistCache(): void {
        this.fileSystem.writeFile(vscode.Uri.parse(`memfs:/ppm-cache.json`), Buffer.from(
            JSON.stringify(Array.from(this.installedPackages))
        ), { create: true, overwrite: true });
    }

    loadCache(): Set<string> {
        if (this.installedPackages?.size > 0) {
            return this.installedPackages;
        }
        try {
            const cacheFile = this.fileSystem.readFile(vscode.Uri.parse(`memfs:/ppm-cache.json`));
            if (!cacheFile) {
                console.warn('Cache file not found, starting fresh.');
                this.installedPackages = new Set();
                return this.installedPackages;
            }
            const text = new TextDecoder().decode(cacheFile);
            this.installedPackages = new Set(JSON.parse(text));
            return this.installedPackages;
        } catch (error) {
            console.warn('Cache file not found, starting fresh.');
            this.installedPackages = new Set();
            return this.installedPackages;
        }
    }

    async fetchPackage(pkgName: string, version = 'latest'): Promise<void> {
        const cacheKey = `${pkgName}@${version}`;

        if (this.installedPackages.has(cacheKey)) {
            console.log(`Using cached version of ${pkgName}@${version}`);
            return;
        }

        const response = await fetch(`https://registry.npmjs.org/${pkgName}`);
        const data = await response.json();
        const resolvedVersion = this.resolveVersion(data, version);
        const tarballUrl = data.versions[resolvedVersion].dist.tarball;
        await this.downloadAndExtract(tarballUrl, pkgName);
        await this.resolveDependencies(pkgName);

        this.installedPackages.add(cacheKey);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolveVersion(data: any, version: string): string {
        if (version === 'latest' || data.versions[version]) {
            return version;
        }
        const availableVersions = Object.keys(data.versions);
        if (version.startsWith('^') || version.startsWith('~') || version === '*') {
            return this.getBestMatchVersion(availableVersions, version);
        }
        throw new Error(`Version ${version} not found for package.`);
    }

    getBestMatchVersion(availableVersions: string[], version: string): string {
        if (version === '*') {
            return availableVersions[availableVersions.length - 1];
        }
        const cleanVersion = version.replace(/^[^0-9]+/, '');
        const matchingVersions = availableVersions.filter((v) => v.startsWith(cleanVersion));
        return matchingVersions.length
            ? matchingVersions[matchingVersions.length - 1]
            : availableVersions[availableVersions.length - 1];
    }

    async downloadAndExtract(url: string, pkgName: string): Promise<void> {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const uncompressedBuffer = inflate(buffer);
        const files = await unzip(uncompressedBuffer.buffer);

        for (const file of files as FileEntry[]) {
            // remove package/ prefix from file name
            const fileName = file.name.replace(/^package\//, '');
            //console.log(`Extracting ${fileName} from ${pkgName}`);
            file.size > 0 && (await this.writeModuleFile(`${pkgName}/${fileName}`, file.buffer));
        }

        console.log(`Package ${pkgName} installed successfully.`);
    }

    async resolveDependencies(pkgName: string): Promise<void> {
        const packageJsonBlob = await this.readModuleFile(`${pkgName}/package.json`);
        if (!packageJsonBlob) {
            return;
        }

        const packageJsonText = await packageJsonBlob.text();
        const packageJson: PackageJson = JSON.parse(packageJsonText);

        if (packageJson.dependencies) {
            for (const [dep, version] of Object.entries(packageJson.dependencies)) {
                if (!(this.readModuleFile(`${dep}/package.json`))) {
                    console.log(`Installing dependency: ${dep}`);
                    await this.fetchPackage(dep, version);
                }
            }
        }
    }

    readModuleFile(path: string): Blob | undefined {
        try {
            const fileUri = path.startsWith('src')
                ? vscode.Uri.parse(`memfs:/${path}`)
                : vscode.Uri.parse(`memfs:/node_modules/${path}`);

            const data = this.fileSystem.readFile(fileUri);
            if (!data) {
                return undefined;
            }

            // Convert Buffer to Blob
            return new Blob([data], { type: 'application/octet-stream' });
        } catch (error) {
            //console.warn(`Failed to read file: ${path}`, error);
            return undefined;
        }
    }

    async writeModuleFile(path: string, arrayBuffer: ArrayBuffer): Promise<void> {
        if (!path.startsWith('src')) {
            // Parse the path and ensure directories exist
            const pathParts = path.split('/');

            // Skip the file name by using length-1
            for (let i = 1; i <= pathParts.length - 1; i++) {
                const dirPathSegments = pathParts.slice(0, i);
                const dirPath = dirPathSegments.join('/');
                const dirUri = vscode.Uri.parse(`memfs:/node_modules/${dirPath}`);
                this.fileSystem.createDirectory(dirUri);
            }
        }

        const fileUri = path.startsWith('src')
            ? vscode.Uri.parse(`memfs:/${path}`)
            : vscode.Uri.parse(`memfs:/node_modules/${path}`);

        // Convert Blob to Buffer
        const buffer = Buffer.from(arrayBuffer);

        this.fileSystem.writeFile(fileUri, buffer, { create: true, overwrite: true });
    }

    async resolveModulePath(specifier: string, importer: string): Promise<string | undefined> {
        // examples
        // react-dom/client => node_modules/react-dom/client/index.js
        // @material-ui/core/Button => node_modules/@material-ui/core/Button/index.js
        // loadash/isEmpty => node_modules/lodash/isEmpty.js
        // @babel/runtime/helpers/esm/interopRequireDefault => node_modules/@babel/runtime/helpers/esm/interopRequireDefault.js
        // ./printValue from yup/utils/isSchema => node_modules/yup/utils/printValue.js
        // domhelper/addClass => node_modules/domhelper/cjs/addClass.js

        // Helper to check if a file exists
        const fileExists = (path: string) => {
            let returnValue = false;
            try {
                if (importer) {
                    returnValue = !!this.readModuleFile(path);
                } else {
                    returnValue = !!this.fileSystem.readFile(vscode.Uri.parse(`memfs:/${path}`));
                }
            } catch (error) {
                //console.error(`Error checking file: ${path}`, error);
                returnValue = false;
            }

            return returnValue;
        };

        // Attempt multiple extensions
        const tryExtensions = async (base: string) => {
            const extensions = [
                '.js',
                '.cjs',
                '.mjs',
                '.ts',
                '.tsx',
                '/index.js',
                '/index.cjs',
                '/index.mjs',
                '/index.ts',
                '/index.tsx',
            ];
            for (const ext of extensions) {
                const candidate = base.replace(/(\.js|\.ts|\.tsx|\.cjs|\.mjs)?$/, '') + ext;
                if (fileExists(candidate)) {
                    return candidate;
                }
            }
            return undefined;
        };

        // Handle relative or absolute paths
        if (specifier.startsWith('.') || specifier.startsWith('/')) {
            // Strip file name from importer to get its directory.
            const baseDir = importer.substring(0, importer.lastIndexOf('/'));
            const resolvedPath = new URL(specifier, 'file:///' + baseDir + '/').pathname.replace(/^\/+/, '');

            // Try direct match or appended extensions
            const found = await tryExtensions(resolvedPath);
            return found;
        }

        // Otherwise, it's a package import
        let pkgName = specifier;
        let subPath = '';
        if (specifier.startsWith('@')) {
            const parts = specifier.split('/');
            pkgName = parts.slice(0, 2).join('/');
            subPath = parts.slice(2).join('/');
        } else {
            const parts = specifier.split('/');
            pkgName = parts[0];
            subPath = parts.slice(1).join('/');
        }

        // If empty subpath, use main or index
        if (!subPath) {
            const mainPath = await this.getMain(pkgName);
            if (mainPath) {
                const found = await tryExtensions(mainPath);
                if (found) {
                    return found;
                }
            }
            // fallback to index
            const found = await tryExtensions(`${pkgName}/index`);
            return found;
        }

        // If subpath exists, try direct subpath first
        const directPath = `${pkgName}/${subPath}`;
        let found = await tryExtensions(directPath);
        if (found) {
            return found;
        }

        // Then try using the package's main path as a base for the subpath
        const mainPath = await this.getMain(pkgName);
        if (mainPath) {
            // For example, if mainPath is "domhelper/cjs/index.js",
            // mainDir becomes "domhelper/cjs"
            const mainDir = mainPath.substring(0, mainPath.lastIndexOf('/'));
            found = await tryExtensions(`${mainDir}/${subPath}`);
            if (found) {
                return found;
            }
        }

        // If not found, return undefined
        return undefined;
    }

    private async getMain(pkgName: string): Promise<string | undefined> {
        const packageJsonBlob = await this.readModuleFile(`${pkgName}/package.json`);
        if (!packageJsonBlob) {
            return undefined;
        }

        const packageJsonText = await packageJsonBlob.text();
        const packageJson = JSON.parse(packageJsonText);

        if (packageJson.main) {
            return `${pkgName}/${packageJson.main.replace(/^\.?\//, '')}`;
        }
        return undefined;
    }

    public async installDependencies() {
        let packageJsonFile: string | undefined;
        try {
            const packageJsonUri = vscode.Uri.parse('memfs:/package.json');
            const packageJsonBuffer = this.fileSystem.readFile(packageJsonUri);
            packageJsonFile = packageJsonBuffer ? new TextDecoder().decode(packageJsonBuffer) : undefined;
        } catch (error) {
            console.warn('package.json not found', error);
            return;
        }
        const deps = JSON.parse(packageJsonFile || '{}').dependencies;

        if (!deps) {
            console.warn('No dependencies found in package.json');
            return;
        }

        for (const [pkgName, version] of Object.entries(deps)) {
            try {
                this.loadCache();
                await this.fetchPackage(pkgName, version as string);
                this.persistCache();
            } catch (error) {
                console.error(`Failed to install ${pkgName}:`, error);
                throw error;
            }
        }

        console.log('All dependencies installed successfully.');
    }
}
