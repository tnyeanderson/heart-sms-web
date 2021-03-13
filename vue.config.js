const webpack = require('webpack');
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');

module.exports = {
    devServer: {
        port: 8081,
        disableHostCheck: true,
        hot: false,
        liveReload: false
    },
    runtimeCompiler: false,
    lintOnSave: true,
    configureWebpack: {
        plugins: [
            new SWPrecacheWebpackPlugin({
                cacheId: 'heart-sms',
                filename: 'service-worker.js',
                staticFileGlobs: ['dist/**/*.{js,css}', '/'],
                minify: true,
                stripPrefix: 'dist/',
                dontCacheBustUrlsMatching: /\.\w{6}\./
            })
        ]
    }
    // chainWebpack: config => {}
};
