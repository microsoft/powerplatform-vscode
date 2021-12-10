// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
"use strict";
const util = require('util');
const nls = require('vscode-nls-dev');
const exec = util.promisify(require('child_process').exec);
const gulp = require('gulp');
const filter = require('gulp-filter');
const eslint = require('gulp-eslint');
const replace = require('gulp-replace');
const mocha = require('gulp-mocha');
const moment = require('moment');
const gulpWebpack = require('webpack-stream');
const webpack = require('webpack');
const vsce = require('vsce');
const argv = require('yargs').argv;

const fetch = require('node-fetch');
const fs = require('fs-extra');
const log = require('fancy-log');
const path = require('path');
const pslist = require('ps-list');

const webPackConfig = require('./webpack.config');
const distdir = path.resolve('./dist');
const outdir = path.resolve('./out');
const packagedir = path.resolve('./package');
const feedPAT = argv.feedPAT || process.env['AZ_DevOps_Read_PAT'];

async function clean() {
    (await pslist())
        .filter((info) => info.name.startsWith('pacTelemetryUpload'))
        .forEach(info => {
            log.info(`Terminating: ${info.name} - ${info.pid}...`)
            process.kill(info.pid);
        });

    fs.emptyDirSync(outdir);
    return fs.emptyDir(distdir);
}

function compile() {
    return gulp
        .src('src/**/*.ts')
        .pipe(gulpWebpack(webPackConfig, webpack))
        .pipe(replace("src\\\\client\\\\lib\\\\", "src/client/lib/")) // Hacky fix: vscode-nls-dev/lib/webpack-loader uses Windows style paths when built on Windows, breaking localization on Linux & Mac
        .pipe(gulp.dest(distdir));
}

async function nugetInstall(nugetSource, packageName, version, targetDir) {
    // https://docs.microsoft.com/en-us/nuget/api/package-base-address-resource
    const feeds = {
        'nuget.org': {
            authenticated: false,
            baseUrl: 'https://api.nuget.org/v3-flatcontainer/'
        },
        'CAP_ISVExp_Tools_Daily': {
            authenticated: true,
            // https://dev.azure.com/msazure/One/_packaging?_a=feed&feed=CAP_ISVExp_Tools_Daily
            baseUrl: 'https://pkgs.dev.azure.com/msazure/_packaging/d3fb5788-d047-47f9-9aba-76890f5cecf0/nuget/v3/flat2/'
        },
        'CAP_ISVExp_Tools_Stable': {
            authenticated: true,
            // https://dev.azure.com/msazure/One/_packaging?_a=feed&feed=CAP_ISVExp_Tools_Daily
            baseUrl: 'https://pkgs.dev.azure.com/msazure/_packaging/b0441cf8-0bc8-4fad-b126-841a6184e784/nuget/v3/flat2/'
        },
    }

    const selectedFeed = feeds[nugetSource];
    const baseUrl = selectedFeed.baseUrl;

    packageName = packageName.toLowerCase();
    version = version.toLowerCase();
    const packagePath = `${packageName}/${version}/${packageName}.${version}.nupkg`;

    const nupkgUrl = new URL(packagePath, baseUrl);
    const reqInit = {
        headers: {
            'User-Agent': 'gulpfile-DPX-team/0.1',
            'Accept': '*/*'
        },
        redirect: 'manual'
    };
    if (selectedFeed.authenticated) {
        if (!feedPAT) {
            throw new Error(`nuget feed ${nugetSource} requires authN but neither '--feedToken' argument nor env var 'AZ_DevOps_Read_PAT' was defined!`);
        }
        reqInit.headers['Authorization'] = `Basic ${Buffer.from('PAT:' + feedPAT).toString('base64')}`;
    }

    log.info(`Downloading package: ${nupkgUrl}...`);
    let res = await fetch(nupkgUrl, reqInit);
    if (res.status === 303) {
        const location = res.headers.get('location');
        const url = new URL(location);
        log.info(` ... redirecting to: ${url.origin}${url.pathname}}...`);
        // AzDevOps feeds will redirect to Azure storage with location url w/ SAS token: on 2nd request drop authZ header
        delete reqInit.headers['Authorization'];
        res = await fetch(location, reqInit);
    }
    if (!res.ok) {
        const body = res.body.read();
        throw new Error(`Cannot download ${res.url}, status: ${res.statusText} (${res.status}), body: ${body ? body.toString('ascii') : '<empty>'}`);
    }

    const localNupkg = path.join(targetDir, `${packageName}.${version}.nupkg`);
    fs.ensureDirSync(targetDir);
    return new Promise((resolve, reject) => {
        res.body.pipe(fs.createWriteStream(localNupkg))
            .on('close', () => {
                resolve();
            }).on('error', err => {
                reject(err);
            })
    });
}

function lint() {
    return gulp
        .src(['src/**/*.ts', __filename])
        .pipe(eslint({
                formatter: 'verbose',
                configuration: '.eslintrc.js'
            }))
        .pipe(eslint.format())
        .pipe(eslint.results(results => {
            if (results.warningCount > 0){
                throw new Error(`Found ${results.warningCount} eslint errors.`)
            }
        }))
        .pipe(eslint.failAfterError());
}

function test() {
    return gulp
        .src(['src/server/test/unit/**/*.ts','src/client/test/unit/**/*.ts'], { read: false })
        .pipe(mocha({
                require: [ "ts-node/register" ],
                ui: 'bdd'
            }));
}

async function packageVsix() {
    fs.emptyDirSync(packagedir);
    return vsce.createVSIX({
        packagePath: packagedir,
    })
}

async function git(args) {
    args.unshift('git');
    const {stdout, stderr } = await exec(args.join(' '));
    return {stdout: stdout, stderr: stderr};
}

async function setGitAuthN() {
    const repoUrl = 'https://github.com';
    const repoToken = argv.repoToken;
    if (!repoToken) {
        throw new Error(`Must specify parameter --repoToken with read and push rights to ${repoUrl}!`);
    }
    const bearer = `AUTHORIZATION: basic ${Buffer.from(`PAT:${repoToken}`).toString('base64')}`;
    await git(['config', '--local', `http.${repoUrl}/.extraheader`, `"${bearer}"`]);
    await git(['config', '--local', 'user.email', 'capisvaatdev@microsoft.com' ]);
    await git(['config', '--local', 'user.name', '"DPT Tools Dev Team"' ]);
}

async function snapshot() {
    const targetBranch = argv.targetBranch || 'release/daily';
    const sourceSpecParam = argv.sourceSpec;

    const tmpRepo = path.resolve('./out/tmpRepo');
    fs.emptyDirSync(tmpRepo);

    const repoUrl = (await git(['remote', 'get-url', '--all', 'origin'])).stdout.trim();
    log.info(`snapshot: remote repoUrl: ${repoUrl}`);
    const orgDir = process.cwd();
    process.chdir(tmpRepo);
    try
    {
        await git(['init']);
        await git(['remote', 'add', 'origin', repoUrl]);
        await setGitAuthN();
        await git(['fetch', 'origin']);
        const remotes = (await git(['remote', 'show', 'origin'])).stdout;
        const head = remotes
            .split('\n')
            .map(line => {
                const branch = line.match(/HEAD branch:\s*(\S+)/);
                if (branch && branch.length >= 2) {
                    return branch[1];
                }
            })
            .filter(b => !!b);
        if (!head || head.length < 1 || head.length > 1 || !head[0]) {
            throw new Error(`Cannot determine HEAD from remote: ${repoUrl}`);
        }
        const headBranch = head[0];
        if (headBranch == targetBranch) {
            throw new Error(`Cannot snapshot into default HEAD branch: ${headBranch}`);
        }
        const sourceSpec = sourceSpecParam || `origin/${headBranch}`;
        log.info(`  > snap shotting '${sourceSpec}' into branch: ${targetBranch}...`);
        await git(['checkout', headBranch]);
        const snapshotTag = `snapshot-${targetBranch.replace('/', '_').replace(' ', '_')}-${moment.utc().format('YYMMDD[Z]HHmmss')}`;
        // TODO: setting this tag can interfere with the versioning tool, release-it; for now, don't set this tag
        // await git(['tag', snapshotTag, sourceSpec]);
        await git(['checkout', '--force', '-B', targetBranch]);
        const resetMsg = (await git(['reset', '--hard', `"${sourceSpec}"`])).stdout.trim();
        log.info(`  > snapshot (${snapshotTag}): ${resetMsg}`);
        log.info(`  > pushing snapshot branch '${targetBranch} to origin...`);
        const pushMsg = (await git(['push', '--force', '--tags', 'origin', targetBranch])).stderr.trim();
        log.info(`  > ${pushMsg}`)
    }
    finally {
        process.chdir(orgDir);
    }
}
const cliVersion = '1.10.4';

const recompile = gulp.series(
    clean,
    async () => nugetInstall('CAP_ISVExp_Tools_Stable', 'Microsoft.PowerApps.CLI',cliVersion, path.resolve(distdir, 'pac')),
    async () => nugetInstall('CAP_ISVExp_Tools_Stable', 'Microsoft.PowerApps.CLI.Core.osx-x64', cliVersion, path.resolve(distdir, 'pac')),
    async () => nugetInstall('CAP_ISVExp_Tools_Stable', 'Microsoft.PowerApps.CLI.Core.linux-x64', cliVersion, path.resolve(distdir, 'pac')),
    translationsExport,
    translationsImport,
    translationsGenerate,
    compile,
);

const dist = gulp.series(
    recompile,
    packageVsix,
    lint,
    test
);

const translationExtensionName = "vscode-powerplatform";

// Extract all the localizable strings from TS and package.nls.json, and package into
// an XLF for the localization team
async function translationsExport() {
    return gulp
        .src('src/**/*.ts')
        .pipe(nls.createMetaDataFiles())
        .pipe(filter(['**/*.nls.json', '**/*.nls.metadata.json']))
        .pipe(nls.bundleMetaDataFiles('ms-vscode.powerplatform', '.'))
        .pipe(filter(['**/nls.metadata.header.json', '**/nls.metadata.json']))
        .pipe(gulp.src(["package.nls.json"]))
        .pipe(nls.createXlfFiles("translations-export", translationExtensionName))
        .pipe(gulp.dest(path.join("loc")));
}

const languages = [
    //{ id: "bg", folderName: "bul" },
    //{ id: "hu", folderName: "hun" },
    //{ id: "pl", folderName: "plk" },
    { id: "cs", folderName: "csy" },
    { id: "de", folderName: "deu" },
    { id: "es", folderName: "esn" },
    { id: "fr", folderName: "fra" },
    { id: "it", folderName: "ita" },
    { id: "ja", folderName: "jpn" },
    { id: "ko", folderName: "kor" },
    { id: "pt-BR", folderName: "ptb"},
    { id: "ru", folderName: "rus" },
    { id: "tr", folderName: "trk" },
    { id: "zh-CN", folderName: "chs" },
    { id: "zh-TW", folderName: "cht" },
];

async function translationsImport(done) {
    const tasks = languages.map((language) => {
        const importTask = async () => gulp.src(path.join("loc", "translations-import", `vscode-powerplatform.${language.id}.xlf`))
            .pipe(nls.prepareJsonFiles())
            .pipe(replace("\\r\\n", "\\n"))
            .pipe(gulp.dest(path.join("./i18n", language.folderName)));
        importTask.displayName = `Importing localization - ${language.id}`;
        return importTask;
    });

    return gulp.parallel(...tasks, (seriesDone) => {
        seriesDone();
        done();
    })();
}

function translationsGeneratePackage() {
    return gulp.src(['package.nls.json'])
        .pipe(nls.createAdditionalLanguageFiles(languages, "i18n"))
        .pipe(gulp.dest('.'));
}
function translationsGenerate(done) {
    return gulp.series(
        async() => translationsGeneratePackage(),
        async() => translationsGenerateSrcLocBundles(),
        (seriesDone) => {
            seriesDone();
            done();
        }
    )();
}

function translationsGenerateSrcLocBundles() {
    return gulp.src('src/**/*.ts')
        .pipe(nls.createMetaDataFiles())
        .pipe(nls.createAdditionalLanguageFiles(languages, "i18n"))
        .pipe(nls.bundleMetaDataFiles('ms-vscode.powerplatform', path.join('dist', 'src')))
        .pipe(nls.bundleLanguageFiles())
        .pipe(filter(['**/nls.bundle.*.json', '**/nls.metadata.header.json', '**/nls.metadata.json']))
        .pipe(filter(['**/nls.*.json']))
        .pipe(gulp.dest(path.join('dist', 'src')));
}

exports.clean = clean;
exports.compile = compile;
exports.recompile = recompile;
exports.snapshot = snapshot;
exports.lint = lint;
exports.test = test;
exports.package = packageVsix;
exports.ci = dist;
exports.dist = dist;
exports.translationsExport = translationsExport;
exports.translationsImport = translationsImport;
exports.translationsGenerate = translationsGenerate;
exports.setGitAuthN = setGitAuthN;
exports.default = compile;
