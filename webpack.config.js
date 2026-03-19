const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

const commonConfig = {
  mode: 'production',
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
    entry: './src/renderer/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist-web'),
      filename: 'bundle.js',
      publicPath: './',
    },
    plugins: [
      new HtmlWebpackPlugin({ 
        template: './index.html',
        filename: 'index.html'
      }),
    ],
  }),
];