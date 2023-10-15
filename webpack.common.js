const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const TerserPlugin = require("terser-webpack-plugin")


module.exports = {
  entry: './src/_assets/index.ts',
  output: {
    path: path.resolve(__dirname, '_site/assets'),
    filename: 'bundle.js',
    libraryTarget: 'var',
    library: 'mathCanvas'
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            preamble: `/*! Licensing information can be found in COPYING and THIRD_PARTY_NOTICE files */`,
            comments: false,
          }
        },
        // Extract licensing comments with terser plugin produces an incomplete licensing file.
        // Disable it in favour of a THIRD_PARTY_NOTICE file that is manually maintained.
        extractComments: false
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        // Handle .sass, .scss and .css files
        test: /\.(sa|sc|c)ss$/,

        // The first loader will be applied after others
        use: [
          MiniCssExtractPlugin.loader,
          {
            // Resolves url() and @imports inside CSS
            loader: 'css-loader',
            options: { importLoaders: 2 }
          },
          // Autoprefixer and minifying
          'postcss-loader',
          // SASS to CSS
          'sass-loader'
        ]
      },
      {
        // Load images
        test: /\.(png|jpe?g|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: 'images'
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: 'src/_assets/images', to: 'images' }]
    }),
    new MiniCssExtractPlugin()
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  }
}
