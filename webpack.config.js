// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
'use strict';
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const webpack = require('webpack');

/**@type {import('webpack').Configuration}*/
const nodeConfig = {
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
                // vscode-nls-dev loader:
                // * rewrite nls-calls
                loader: 'vscode-nls-dev/lib/webpack-loader',
                options: {
                    base: __dirname
                }
            },
            {
                loader: 'ts-loader'
            }
        ]
        }]
    },
};
const webConfig = {
	mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
	target: 'webworker', // extensions run in a webworker context
	entry: {
		'extension': './src/web/client/extension.ts',
        'test/unit/extension': './src/web/client/test/unit/extension.test.ts'
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
		},
		fallback: {
			// Webpack 5 no longer polyfills Node.js core modules automatically.
			// see https://webpack.js.org/configuration/resolve/#resolvefallback
			// for the list of Node.js core module polyfills.
			"path": require.resolve("path-browserify"),
			'assert': require.resolve('assert'),
		}
	},
	module: {
		rules: [{
			test: /\.ts$/,
			exclude: /node_modules/,
			use: [{
                // vscode-nls-dev loader:
                // * rewrite nls-calls
                loader: 'vscode-nls-dev/lib/webpack-loader',
                options: {
                    base: __dirname
                }
            },{
				loader: 'ts-loader'
			}]
		}]
	},
	plugins: [
		new webpack.ProvidePlugin({
			process: 'process/browser', // provide a shim for the global `process` variable
		}),
	],
	externals: {
		'vscode': 'commonjs vscode', // ignored because it doesn't exist
	},
	performance: {
		hints: false
	},
	devtool: 'nosources-source-map', // create a source map that points to the original source file
	infrastructureLogging: {
		level: "log", // enables logging required for problem matchers
	},
};

module.exports = [nodeConfig, webConfig];
