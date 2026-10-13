const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

// Bug #5 Fix: determine build mode dynamically from NODE_ENV
const isProduction = process.env.NODE_ENV === 'production';
const buildMode = isProduction ? 'production' : 'development';

const commonConfig = {
  mode: buildMode,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [{
          loader: 'ts-loader',
          options: { transpileOnly: true }
        }],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        oneOf: [
          {
            test: /\.module\.css$/,
            use: [
              'style-loader',
              {
                loader: 'css-loader',
                options: {
                  modules: {
                    localIdentName: '[name]__[local]--[hash:base64:5]',
                    exportLocalsConvention: 'camelCase',
                  },
                },
              },
            ],
          },
          {
            use: ['style-loader', 'css-loader'],
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.css'],
    alias: { '@': path.resolve(__dirname, 'src') },
  },
};

module.exports = [
  // إعدادات العملية الرئيسية (Main)
  Object.assign({}, commonConfig, {
    target: 'electron-main',
    externals: [nodeExternals()],
    entry: {
      main: './src/main/main.ts',
      preload: './src/main/preload.ts',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
    },
  }),
  // إعدادات واجهة المستخدم للإلكترون (Electron Renderer)
  Object.assign({}, commonConfig, {
    target: 'electron-renderer',
    entry: './src/renderer/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'renderer.js',
    },
    plugins: [
      new HtmlWebpackPlugin({ template: './index.html' }),
    ],
  }),
  // إعدادات الويب للعرض على GitHub Pages (Web Preview)
  Object.assign({}, commonConfig, {
    target: 'web',
    mode: 'production', // Web preview always production for smaller bundle
    entry: './src/renderer/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist-web'),
      filename: '[name].[contenthash:8].js',
      clean: true,
      publicPath: './',
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 10,
        minSize: 20000,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
              const name = packageName ? packageName[1].replace('@', '') : 'vendor';
              return `vendor-${name}`;
            },
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    },
    performance: {
      maxAssetSize: 1024000,
      maxEntrypointSize: 1024000,
      hints: false,
    },
    plugins: [
      new HtmlWebpackPlugin({ 
        template: './index.html',
        filename: 'index.html'
      }),
    ],
  }),
];