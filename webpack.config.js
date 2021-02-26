// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
'use strict';
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');

/**@type {import('webpack').Configuration}*/
const config = {
    target: 'node',
    mode: 'development',

    entry: {
        extension:'./client/src/extension.ts',
        server: './server/src/server.ts'
    },
    output: {
        path: path.resolve(__dirname,'dist'),
        filename: '[name].js',
        libraryTarget: "commonjs2",
        devtoolModuleFilenameTemplate: "../[resource-path]",
    },
    devtool: 'source-map',
    externals: {
        vscode: "commonjs vscode"
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [{
            test: /\.ts$/,
            exclude: /node_modules/,
            use: [{
                loader: 'ts-loader',
                options: {
                    compilerOptions: {
                        "module": "es2019"
                    }
                }
            }]
        }]
    },
}

module.exports = config;
