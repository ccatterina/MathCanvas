const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: './src/_assets/index.ts',
  output: {
    path: path.resolve(__dirname, '_site/assets'),
    filename: 'bundle.js',
    libraryTarget: 'var',
    library: 'mathCanvas'
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
