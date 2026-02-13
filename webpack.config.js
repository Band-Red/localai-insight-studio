const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

const commonConfig = {
  mode: 'development',
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
        // معالجة ملفات CSS (بناءً على طلبك للاستيراد المباشر)
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
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
  // إعدادات واجهة المستخدم (Renderer)
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
];