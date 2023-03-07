import { Configuration, ProvidePlugin } from 'webpack';
import * as path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import 'webpack-dev-server';
import * as buffer from 'buffer';

const config: Configuration = {
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    resolve: {
        extensions: ['.ts', '.js'],
        fallback: {
            // "stream": require.resolve("stream-browserify"),
            // "buffer": require.resolve("buffer"),
        },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html',
        }),
        // new ProvidePlugin({
        //     Buffer: ['buffer', 'Buffer'],
        // }),
        // new ProvidePlugin({
        //     process: 'process/browser',
        // }),
    ],
    devtool: 'inline-source-map',
    devServer: {
        static: './public',
        port: 3000,
    },
};

export default config;