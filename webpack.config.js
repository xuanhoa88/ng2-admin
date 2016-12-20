const path = require('path');
const autoprefixer = require('autoprefixer');
const webpack = require('webpack');
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
const ContextReplacementPlugin = require('webpack/lib/ContextReplacementPlugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');
const ProgressPlugin = require('webpack/lib/ProgressPlugin');
const UglifyJsPlugin = require('webpack/lib/optimize/UglifyJsPlugin');
const NormalModuleReplacementPlugin = require('webpack/lib/NormalModuleReplacementPlugin');
const WebpackMd5Hash = require('webpack-md5-hash');
const {
    CheckerPlugin
} = require('awesome-typescript-loader');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

//=========================================================
//  VARS
//---------------------------------------------------------
const NODE_ENV = process.env.NODE_ENV;
const ENV_DEVELOPMENT = NODE_ENV === 'development';
const ENV_PRODUCTION = NODE_ENV === 'production';
const ENV_TEST = NODE_ENV === 'test';
const HOST = process.env.HOST_ENV || 'localhost';
const PORT = process.env.PORT_ENV || 3000;
const ROOT = path.resolve(__dirname);

//=========================================================
//  CONFIG
//---------------------------------------------------------
const config = {};

config.resolve = {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    mainFields: ['module', 'browser', 'main'],
    modules: ['src', 'node_modules']
};

//=========================================================
//  LOADERS
//---------------------------------------------------------
config.module = {
    rules: [{
            test: /\.ts$/,
            loader: 'string-replace-loader',
            query: {
                search: /(System|SystemJS)(.*[\n\r]\s*\.|\.)import\((.+)\)/g,
                replace: '$1.import($3).then(mod => (mod.__esModule && mod.default) ? mod.default : mod)'
            },
            include: [root('src')],
            enforce: 'pre'
        },
        /*
         * Typescript loader support for .ts and Angular 2 async routes via .async.ts
         * Replace templateUrl and stylesUrl with require()
         *
         * See: https://github.com/s-panferov/awesome-typescript-loader
         * See: https://github.com/TheLarkInn/angular2-template-loader
         */
        {
            test: /\.ts$/,
            use: [
                'awesome-typescript-loader',
                'angular2-template-loader',
                'angular2-router-loader'
            ],
            exclude: [/\.(spec|e2e)\.ts$/]
        },
        /*
         * Json loader support for *.json files.
         *
         * See: https://github.com/webpack/json-loader
         */
        {
            test: /\.json$/,
            use: 'json-loader'
        },
        /*
         * to string and css loader support for *.css files
         * Returns file content as string
         *
         */
        {
            test: /\.css$/,
            use: ['raw-loader', 'style-loader', 'postcss-loader']
        }, {
            test: /\.(scss|sass)$/,
            use: ['raw-loader', 'postcss-loader', 'sass-loader']
        }, {
            test: /\.less$/,
            use: ['raw-loader', 'postcss-loader', 'less-loader']
        }, {
            test: /\.woff(2)?(\?v=.+)?$/,
            use: 'url-loader?limit=10000&mimetype=application/font-woff'
        }, {
            test: /\.(ttf|eot|svg)(\?v=.+)?$/,
            use: 'file-loader'
        }, {
            test: /bootstrap\/dist\/js\/umd\//,
            use: 'imports-loader?jQuery=jquery'
        },
        /* Raw loader support for *.html
         * Returns file content as string
         *
         * See: https://github.com/webpack/raw-loader
         */
        {
            test: /\.html$/,
            use: 'raw-loader',
            exclude: [root('src/index.html')]
        },
        /* File loader for supporting images, for example, in CSS files.
         */
        {
            test: /\.(jpg|png|gif|jpeg)$/,
            use: 'file-loader'
        }
    ]
};

// Recommended disable hints in development mode however enable in production mode
config.performance = {
    hints: false
};

/*
 * Include polyfills or mocks for various node stuff
 * Description: Node configuration
 *
 * See: https://webpack.github.io/docs/configuration.html#node
 */
config.node = {
    global: true,
    crypto: 'empty',
    process: !ENV_PRODUCTION,
    module: false,
    clearImmediate: false,
    setImmediate: false
};

config.plugins = [
    /*
     * Plugin: CheckerPlugin
     * Description: Do type checking in a separate process, so webpack don't need to wait.
     *
     * See: https://github.com/s-panferov/awesome-typescript-loader#forkchecker-boolean-defaultfalse
     */
    new CheckerPlugin(),
    /**
     * Plugin: DefinePlugin
     * Description: Define free variables.
     * Useful for having development builds with debug logging or adding global constants.
     *
     * Environment helpers
     *
     * See: https://webpack.github.io/docs/list-of-plugins.html#defineplugin
     */
    // NOTE: when adding more properties make sure you include them in custom-typings.d.ts
    new DefinePlugin({
        'process.env': JSON.stringify({
            NODE_ENV: NODE_ENV
        })
    }),
    /**
     * Plugin LoaderOptionsPlugin (experimental)
     *
     * See: https://gist.github.com/sokra/27b24881210b56bbaff7
     */
    new LoaderOptionsPlugin({
        debug: !ENV_PRODUCTION,
        minimize: ENV_PRODUCTION,
        options: {
            context: root('src'),
            output: {
                path: root('dist')
            },

            /**
             * Static analysis linter for TypeScript advanced options configuration
             * Description: An extensible linter for the TypeScript language.
             *
             * See: https://github.com/wbuchwalter/tslint-loader
             */
            tslint: {
                emitErrors: ENV_PRODUCTION,
                failOnHint: ENV_PRODUCTION,
                resourcePath: 'src'
            },
            postcss: [
                autoprefixer({
                    browsers: ['last 3 versions']
                })
            ],
            sassLoader: {
                outputStyle: 'compressed',
                precision: 10,
                sourceComments: false
            },
            /**
             * Html loader advanced options
             *
             * See: https://github.com/webpack/html-loader#advanced-options
             */
            // TODO: Need to workaround Angular 2's html syntax => #id [bind] (event) *ngFor
            htmlLoader: ENV_PRODUCTION ? {
                minimize: true,
                removeAttributeQuotes: false,
                caseSensitive: true,
                customAttrSurround: [
                    [/#/, /(?:)/],
                    [/\*/, /(?:)/],
                    [/\[?\(?/, /(?:)/]
                ],
                customAttrAssign: [/\)?\]?=/]
            } : {}
        }
    }),
    new ContextReplacementPlugin(
        /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
        path.resolve('src')
    ),
    /**
     * Automatically loaded modules. 
     * Module (value) is loaded when the identifier (key) is used as free variable in a module
     *
     * See: https://github.com/webpack/html-loader#provideplugin
     */
    new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery',
        'window.$': 'jquery',
        'window.bowser': 'bowser',
        'bowser': 'bowser'
    }),
    // Fix Angular 2
    new NormalModuleReplacementPlugin(
        /facade(\\|\/)async/,
        root('node_modules/@angular/core/src/facade/async.js')
    ),
    new NormalModuleReplacementPlugin(
        /facade(\\|\/)collection/,
        root('node_modules/@angular/core/src/facade/collection.js')
    ),
    new NormalModuleReplacementPlugin(
        /facade(\\|\/)errors/,
        root('node_modules/@angular/core/src/facade/errors.js')
    ),
    new NormalModuleReplacementPlugin(
        /facade(\\|\/)lang/,
        root('node_modules/@angular/core/src/facade/lang.js')
    ),
    new NormalModuleReplacementPlugin(
        /facade(\\|\/)math/,
        root('node_modules/@angular/core/src/facade/math.js')
    )
];

//=====================================
//  DEVELOPMENT or PRODUCTION
//-------------------------------------
if (ENV_DEVELOPMENT || ENV_PRODUCTION) {
    config.entry = {
        polyfills: './src/polyfills.ts',
        vendor: './src/vendor.ts',
        main: './src/main.ts'
    };

    config.output = {
        path: path.join(__dirname, 'dist'),
        filename: '[name].[hash].bundle.js',
        publicPath: '/',
        sourceMapFilename: '[name].[hash].js.map',
        chunkFilename: '[id].[hash].chunk.js'
    };

    config.plugins.push(
        /*
         * Plugin: CommonsChunkPlugin
         * Description: Shares common code between the pages.
         * It identifies common modules and put them into a commons chunk.
         *
         * See: https://webpack.github.io/docs/list-of-plugins.html#commonschunkplugin
         * See: https://github.com/webpack/docs/wiki/optimization#multi-page-app
         */
        new CommonsChunkPlugin({
            name: ['vendor', 'polyfills'],
            minChunks: Infinity
        }),
        /*
         * Plugin: CopyWebpackPlugin
         * Description: Copy files and directories in webpack.
         *
         * Copies project static assets.
         *
         * See: https://www.npmjs.com/package/copy-webpack-plugin
         */
        new CopyWebpackPlugin([{
            from: './src/shared/assets',
            to: 'assets'
        }]),
        /*
         * Plugin: HtmlWebpackPlugin
         * Description: Simplifies creation of HTML files to serve your webpack bundles.
         * This is especially useful for webpack bundles that include a hash in the filename
         * which changes every compilation.
         *
         * See: https://github.com/ampedandwired/html-webpack-plugin
         */
        new HtmlWebpackPlugin({
            chunkSortMode: 'dependency',
            filename: 'index.html',
            inject: 'body',
            template: './src/index.html'
        })
    );
}

//=====================================
//  DEVELOPMENT
//-------------------------------------
if (ENV_DEVELOPMENT) {
    config.devtool = 'cheap-module-source-map';

    /**
     * Plugin: ProgressPlugin
     * Description: Hook into the compiler to extract progress information.
     *
     * See: https://webpack.github.io/docs/list-of-plugins.html#progressplugin
     */
    config.plugins.push(new ProgressPlugin());

    config.devServer = {
        contentBase: './src',
        historyApiFallback: true,
        host: HOST,
        port: PORT,
        stats: {
            cached: true,
            cachedAssets: true,
            chunks: true,
            chunkModules: false,
            colors: true,
            hash: false,
            reasons: true,
            timings: true,
            version: false
        },
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000
        }
    };
}

//=====================================
//  PRODUCTION
//-------------------------------------
if (ENV_PRODUCTION) {
    config.devtool = 'source-map';

    config.plugins.push(
        /**
         * Plugin: WebpackMd5Hash
         * Description: Plugin to replace a standard webpack chunkhash with md5.
         *
         * See: https://www.npmjs.com/package/webpack-md5-hash
         */
        new WebpackMd5Hash(),
        new ExtractTextPlugin({
            filename: 'css/[name].css',
            allChunks: true
        }),
        /**
         * Plugin: UglifyJsPlugin
         * Description: Minimize all JavaScript output of chunks.
         * Loaders are switched into minimizing mode.
         *
         * See: https://webpack.github.io/docs/list-of-plugins.html#uglifyjsplugin
         */
        // NOTE: To debug prod builds uncomment //debug lines and comment //prod lines
        new UglifyJsPlugin({
            beautify: false, //prod
            output: {
                comments: false
            },
            mangle: {
                screw_ie8: true
            }, //prod
            compress: {
                screw_ie8: true,
                warnings: false,
                conditionals: true,
                unused: true,
                comparisons: true,
                sequences: true,
                dead_code: true,
                evaluate: true,
                if_return: true,
                join_vars: true,
                negate_iife: false // we need this for lazy v8
            },
            comments: false //prod
        })
        /**
         * Plugin: NormalModuleReplacementPlugin
         * Description: Replace resources that matches resourceRegExp with newResource
         *
         * See: http://webpack.github.io/docs/list-of-plugins.html#normalmodulereplacementplugin
         */
        /*
        new NormalModuleReplacementPlugin(
            /zone\.js(\\|\/)dist(\\|\/)long-stack-trace-zone/,
            root('config/empty.js')
        )
        */
    );
}

//=====================================
//  TEST
//-------------------------------------
if (ENV_TEST) {
    config.devtool = 'inline-source-map';
}

//=====================================
//  HELPERS
//-------------------------------------
function root() {
    const args = Array.prototype.slice.call(arguments, 0);
    return path.join.apply(path, [ROOT].concat(args));
}

module.exports = config;