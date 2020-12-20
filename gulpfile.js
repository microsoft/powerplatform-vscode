// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
"use strict";
const gulp = require('gulp');
const eslint = require('gulp-eslint');
const mocha = require('gulp-mocha');
const gulpWebpack = require('webpack-stream');
const webpack = require('webpack');
const vsce = require('vsce');

const fetch = require('node-fetch');
const fs = require('fs-extra');
const log = require('fancy-log');
const path = require('path');
const pslist = require('ps-list');

const webPackConfig = require('./webpack.config');
const distdir = path.resolve('./dist');
const packagedir = path.resolve('./package');
const readPAT = process.env['AZ_DevOps_Read_PAT'];

async function clean() {
    (await pslist())
        .filter((info) => info.name.startsWith('pacTelemetryUpload'))
        .forEach(info => {
            log.info(`Terminating: ${info.name} - ${info.pid}...`)
            process.kill(info.pid);
        });
    return fs.emptyDir(distdir);
}

function compile() {
    return gulp
        .src('src/**/*.ts')
        .pipe(gulpWebpack(webPackConfig, webpack))
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
        if (!readPAT) {
            throw new Error(`nuget feed ${nugetSource} requires authN but env var 'AZ_DevOps_Read_PAT' was not defined!`);
        }
        reqInit.headers['Authorization'] = `Basic ${Buffer.from('PAT:' + readPAT).toString('base64')}`;
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
        .pipe(eslint.format());
}

function test() {
    return gulp
        .src('src/test/**/*.ts', { read: false })
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

const recompile = gulp.series(
    clean,
    async () => nugetInstall('nuget.org', 'Microsoft.PowerApps.CLI', '1.4.4', path.resolve(distdir, 'pac')),
    compile
);

const dist = gulp.series(
    recompile,
    packageVsix,
);

exports.clean = clean;
exports.compile = compile;
exports.recompile = recompile;
exports.lint = lint;
exports.test = test;
exports.ci = gulp.series(
    recompile,
    lint,
    test
);
exports.package = packageVsix;
exports.dist = dist;
exports.default = compile;
