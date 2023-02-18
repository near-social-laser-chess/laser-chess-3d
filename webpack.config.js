const path = require('path')
module.exports = {
    watch: true,
    entry: "./index.js",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, 'build'),
        publicPath: "/"
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
};