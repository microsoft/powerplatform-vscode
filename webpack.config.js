/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

'use strict';
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const webpack = require('webpack');
const { dependencies } = require('./package.json');


/**@type {import('webpack').Configuration}*/
const nodeConfig = {
    target: 'node',
    mode: 'development',

    entry: {
        extension: './src/client/extension.ts',
        yamlServer: './src/server/YamlServer.ts',
        htmlServer: './src/server/HtmlServer.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        libraryTarget: "commonjs2",
    },
    devtool: 'source-map',
    externals: {
        vscode: "commonjs vscode",

        // These dependencies are ignored because we don't use them, and App Insights has try-catch protecting their loading if they don't exist
        // See: https://github.com/microsoft/vscode-extension-telemetry/issues/41#issuecomment-598852991
        'applicationinsights-native-metrics': 'commonjs applicationinsights-native-metrics',
        '@opentelemetry/tracing': "commonjs @opentelemetry/tracing"
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [{
            test: /\.ts$/,
            exclude: /node_modules/,
            use: [{
                loader: 'ts-loader'
            }
            ]
        }]
    },
    plugins: [
        new webpack.DefinePlugin({
            __GENERATOR_PACKAGE_VERSION__: JSON.stringify(dependencies["@microsoft/generator-powerpages"] || "1.0.0"), // get the currently used version of powerpages generator with fallback to ^1.0.0
        }),
        new webpack.DefinePlugin({
            IS_DESKTOP: true,
        }),
    ],
    ignoreWarnings: [
        {
            message: /dependency is an expression|require function is used in a way in which dependencies cannot be statically extracted/
        }
    ]
};
const webConfig = {
    mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
    target: 'webworker', // extensions run in a webworker context
    entry: {
        'extension': './src/web/client/extension.ts',
        'test/unit/extension': './src/web/client/test/unit/extension.test.ts',
        'client/test/integration/index': './src/client/test/integration/index.ts',
        'test/integration/index': './src/web/client/test/integration/index.ts',
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, './dist/web'),
        libraryTarget: 'commonjs',
        devtoolModuleFilenameTemplate: '../../[resource-path]'
    },
    resolve: {
        mainFields: ['browser', 'module', 'main'], // look for `browser` entry point in imported node modules
        extensions: ['.ts', '.js'], // support ts-files and js-files
        alias: {
            // provides alternate implementation for node module and source files
            // Handle node: prefixed modules
            "node:events": "events",
            "node:fs": false,
            "node:path": "path-browserify",
            "node:util": "util",
        },
        fallback: {
            // Webpack 5 no longer polyfills Node.js core modules automatically.
            // see https://webpack.js.org/configuration/resolve/#resolvefallback
            // for the list of Node.js core module polyfills.
            "constants": require.resolve("constants-browserify"),
            'assert': require.resolve('assert'),
            "os": require.resolve("os-browserify"),
            "path": require.resolve("path-browserify"),
            'stream': require.resolve("stream-browserify"),
            'util': require.resolve('util/'),
            buffer: require.resolve('buffer'),
            'events': require.resolve('events/'),
            // Handle node: prefixed modules
            "node:events": require.resolve('events/'),
            "node:fs": false,
            "node:path": require.resolve("path-browserify"),
            "node:util": require.resolve('util/'),
        }
    },
    module: {
        rules: [{
            test: /\.ts$/,
            exclude: /node_modules/,
            use: [{
                loader: 'ts-loader'
            }]
        }]
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.DefinePlugin({
            IS_DESKTOP: false,
        }),
    ],
    externals: {
        'vscode': 'commonjs vscode', // ignored because it doesn't exist
        'fs': 'fs',
        // Handle node: scheme modules by marking them as externals
        'node:events': 'commonjs events',
        'node:fs': 'commonjs fs',
        'node:path': 'commonjs path',
        'node:util': 'commonjs util',
    },
    performance: {
        hints: false
    },
    devtool: 'nosources-source-map', // create a source map that points to the original source file
    infrastructureLogging: {
        level: "log", // enables logging required for problem matchers
    },
    ignoreWarnings: [
        {
            message: /dependency is an expression|require function is used in a way in which dependencies cannot be statically extracted/
        }
    ]
};

/** @type fluent container scripts web worker config */
const webWorkerConfig = {
    mode: "none",
    target: "webworker", // web extensions run in a webworker context
    entry: {
        main: "./src/web/client/common/worker/webworker.js",
    },
    output: {
        filename: "[name].js",
        path: path.join(__dirname, "./dist/web"),
        libraryTarget: "self",
    },
    resolve: {
        extensions: [".ts", ".js"], // support ts-files and js-files
        alias: {
            // Handle node: prefixed modules
            "node:events": "events",
            "node:fs": false,
            "node:path": "path-browserify",
            "node:util": "util",
        },
        fallback: {
            path: require.resolve("path-browserify"),
            tty: require.resolve("tty-browserify"),
            os: require.resolve("os-browserify/browser"),
            stream: require.resolve("stream-browserify"),
            http: require.resolve("stream-http"),
            zlib: require.resolve("browserify-zlib"),
            https: require.resolve("https-browserify"),
            events: require.resolve('events/'),
            util: require.resolve('util/'),
            // Handle node: prefixed modules
            "node:events": require.resolve('events/'),
            "node:fs": false,
            "node:path": require.resolve("path-browserify"),
            "node:util": require.resolve('util/'),
        },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader",
                    },
                ],
            },
            {
                test: /webworker\.js$/,
                use: {
                    loader: "worker-loader",
                    options: { inline: "fallback" },
                },
            },
        ],
    },
    externals: {
        vscode: "commonjs vscode", // ignored because it doesn't exist
        // Handle node: scheme modules by marking them as externals
        'node:events': 'commonjs events',
        'node:fs': 'commonjs fs',
        'node:path': 'commonjs path',
        'node:util': 'commonjs util',
    },
    performance: {
        hints: false,
    },
    devtool: "source-map",
    ignoreWarnings: [
        {
            message: /dependency is an expression|require function is used in a way in which dependencies cannot be statically extracted/
        }
    ]
};

module.exports = [nodeConfig, webConfig, webWorkerConfig];
