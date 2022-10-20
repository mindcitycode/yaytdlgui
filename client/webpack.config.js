import HtmlWebpackPlugin from 'html-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';

const baseConfig = {
    devtool: "source-map",
  //  entry : "./src/client/index.js",
    //   entry: "./src/scripts/app.js", //relative to root of the application
    //  output: {
    //     filename: "./dist/app.bundle.js" //relative to root of the application
    plugins: [
/*
        new CopyPlugin({
            patterns: [
 //               { from: "assets", to: "assets" },
                //     { from: "favicon.ico", to: "favicon.ico" },
            ],
        }),
  */      new HtmlWebpackPlugin({
            hash: true,
            filename: './index.html', //relative to root of the application,
            title: 'yt-dl-ui'
        })
    ],

    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
        //   namedModules: false,
        moduleIds: 'size'
    },

    watchOptions: {
        ignored: /\.#|node_modules|~$/,
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(js|jsx)$/,
                use: {
                    loader: 'babel-loader'
                }
            }
        ],
    },
}

const config = (env, args) => {
    if (args.mode === 'development') {
        delete baseConfig.optimization
    } else if (args.mode === 'production') {
        delete baseConfig.devtool
    }
    return baseConfig
}

export default config