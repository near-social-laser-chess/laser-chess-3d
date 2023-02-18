const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path')

module.exports = {
    watch: true,
    entry: "./index.js",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, 'build'),
        publicPath: "/",
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
            template: 'index.html'
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: "assets", to: "assets" }
            ],
        })
    ],
};