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
        extension:'./src/client/extension.ts',
        yamlServer: './src/server/yamlServer.ts',
        htmlServer: './src/server/htmlServer.ts'
    },
    output: {
        path: path.resolve(__dirname,'dist'),
        filename: '[name].js',
        libraryTarget: "commonjs2",
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
            use: [
            {
                loader: 'ts-loader'
            }
        ]
        }]
    },
}

module.exports = config;
