const path = require('path');

module.exports = {
  entry: './src/index.tsx',  // Entry point for your application
  output: {
    filename: 'bundle.js',   // Name of the bundled file
    path: path.resolve(__dirname, 'dist'), // Output directory
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'], // Recognize these extensions
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,        // Apply this rule to TypeScript files
        use: 'ts-loader',       // Use ts-loader to transpile TypeScript
        exclude: /node_modules/ // Don't transpile files in node_modules
      },
      {
        test: /\.css$/,         // Apply this rule to CSS files
        use: ['style-loader', 'css-loader'], // Use loaders to inject and load CSS
      },
    ],
  },
  devServer: {
    static: path.join(__dirname, 'dist'), // Serve static files from dist directory
    compress: true,
    port: 9000,                           // Server runs on localhost:9000
  },
};
