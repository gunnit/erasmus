// Webpack performance optimizations for WSL
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Disable source maps in development for faster builds
      if (process.env.NODE_ENV === 'development') {
        webpackConfig.devtool = false;
      }

      // Optimize for WSL file system
      webpackConfig.watchOptions = {
        poll: false,
        ignored: /node_modules/,
        aggregateTimeout: 300,
      };

      // Reduce memory usage
      webpackConfig.performance = {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
      };

      // Skip type checking for faster builds
      webpackConfig.plugins = webpackConfig.plugins.filter(
        plugin => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin'
      );

      return webpackConfig;
    },
  },
  devServer: {
    // Faster hot reload
    hot: true,
    liveReload: false,
    watchFiles: {
      paths: ['src/**/*'],
      options: {
        usePolling: false,
        poll: false,
      },
    },
    // Reduce console output
    client: {
      logging: 'error',
      overlay: {
        errors: true,
        warnings: false,
      },
    },
  },
};