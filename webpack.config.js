const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const path = require('path')

module.exports = (env, argv) => {
    return {
        watch: true,
        entry: "./index.js",
        output: {
            filename: "bundle.js",
            path: path.resolve(__dirname, 'build'),
            publicPath: `${process.env.BASE_URL ? process.env.BASE_URL: ""}/`,
            assetModuleFilename: "assets/[name][ext]",
        },
        devServer: {
            port: 8080,
            historyApiFallback: true,
            hot: true,
            client: {
                overlay: {
                    errors: true,
                },
            },
        },
        experiments: {
            topLevelAwait: true
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: 'index.html',
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {from: "assets", to: "assets"}
                ],
            }),
            new webpack.DefinePlugin({
                'BASE_URL': JSON.stringify(process.env.BASE_URL ? process.env.BASE_URL: "")
            }),
            {
                apply: (compiler) => {
                    compiler.hooks.done.tap('DonePlugin', (stats) => {
                        if (argv.env.WEBPACK_SERVE) return;
                        setTimeout(() => {
                            process.exit(0)
                        })
                    });
                }
            }
        ],
    };
}