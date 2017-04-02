const path = require('path');
const webpack = require('webpack');

const ExtractTextPlugin = require("extract-text-webpack-plugin");
const WebpackRTLPlugin = require('webpack-rtl-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MergeJsonWebpackPlugin = require("merge-jsons-webpack-plugin");

const _ = require('lodash');

let PATHS = {
    SRC: {
        ROOT: "src/",
        SETTINGS: "src/settings/"
    },
    BUILDROOT: "dist/",
    BUNDLEROOT: "build/bundles/",
    LIBROOT: "lib/",
    TARGET: {
        ROOT: "target/",
        BOOKMARKLET: "target/bookmarklet/",
        CHROME: "target/chrome/",
        EDGE_ROOT: "target/edge/OneNoteWebClipper/edgeextension/",
        EDGE_EXTENSION: "target/edge/OneNoteWebClipper/edgeextension/manifest/extension/",
        FIREFOX: "target/firefox/",
        // Note: The Safari extension folder MUST end in ".safariextension"
        SAFARI: "target/clipper.safariextension/",
        TESTS: "target/tests/"
    },
    NODE_MODULES: "node_modules/",
    INTERNAL: {
        SRC: {
            SCRIPTS: "../WebClipper_Internal/src/scripts/",
            SETTINGS: "../WebClipper_Internal/src/settings/"
        },
        LIBROOT: "../WebClipper_Internal/lib/"
    }
};

let ARIA_LIB_VERSION = "2.7.1";

const extractLess = new ExtractTextPlugin({
    filename: "css/clipper.css",
    disable: process.NODE_ENV === "development"
});

const rtlPlugin = new WebpackRTLPlugin({
    filename: 'css/clipper-rtl.css',
    options: {},
    plugins: [],
    diffOnly: false,
    minify: false,
});

const copyWebpackPlugin = new CopyWebpackPlugin([
    { from: `${PATHS.SRC.ROOT}strings.json`, to: `strings.json`}
]);

function mergeSettings(env) {
    let internal = null;
    let production = null;
    let dogfood = null;

    if (env) {
        internal = env['internal'];
        production = env['production'];
        dogfood = env['dogfood'];
    }

    const mergeOrder = [PATHS.SRC.SETTINGS + "default.json"];

    if (internal) {
        mergeOrder.push(PATHS.INTERNAL.SRC.SETTINGS + "default.json");
    }

    if (production) {
        mergeOrder.push(PATHS.SRC.SETTINGS + "production.json");
        if (internal) {
            mergeOrder.push(PATHS.INTERNAL.SRC.SETTINGS + "production.json");
        }
    } else if (dogfood) {
        mergeOrder.push(PATHS.SRC.SETTINGS + "dogfood.json");
        if (internal) {
            mergeOrder.push(PATHS.INTERNAL.SRC.SETTINGS + "dogfood.json");
        }
    }

    return _.map(mergeOrder, entry => path.join(__dirname, `${entry}`));
}

module.exports = function(env) {
    const settingsFiles = mergeSettings(env);
    console.log(settingsFiles);

    return {
        entry: {
            style: path.join(__dirname, `${PATHS.SRC.ROOT}styles/clipper.less`)
        },
        output: {
            path: path.join(__dirname, PATHS.BUILDROOT),
            filename: 'js/[name].js'
        },
        module: {
            rules: [
                {
                    test: /\.less$/,
                    use: extractLess.extract({
                        use: [
                            {
                                loader: "css-loader",
                                options: {url: false}
                            },
                            {
                                loader: "less-loader",
                                options: {
                                    paths: [
                                        path.resolve(__dirname, "node_modules")
                                    ]
                                }
                            }
                        ],
                        fallback: "style-loader"
                    })
                },
                {
                    test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
                    use: "url-loader?limit=10000&mimetype=application/font-woff"
                },
                {
                    test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
                    use: "url-loader?limit=10000&mimetype=application/font-woff"
                },
                {
                    test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                    use: "url-loader?limit=10000&mimetype=application/octet-stream"
                },
                {
                    test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                    use: "file-loader"
                },
                {
                    test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                    use: "url-loader?limit=10000&mimetype=image/svg+xml"
                }
            ]
        },
        plugins: [
            extractLess,
            rtlPlugin,
            copyWebpackPlugin,
            new MergeJsonWebpackPlugin({
                files: settingsFiles,
                output: {
                    fileName: path.join(__dirname, PATHS.BUILDROOT, "settings.json")
                }
            })
        ]
    }
};
