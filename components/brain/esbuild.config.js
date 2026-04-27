/**
 * This file configures esbuild for serverless-esbuild
 */
const { NodeResolvePlugin } = require('@esbuild-plugins/node-resolve');

module.exports = {
  plugins: [
    NodeResolvePlugin({
      extensions: ['.ts', '.js', '.json'],
      resolveOptions: {
        // This ensures GitHub dependencies are resolved correctly
        alias: {
          'brain-sdk': require.resolve('brain-sdk')
        }
      }
    })
  ]
};