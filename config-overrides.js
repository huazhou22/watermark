const { override } = require('customize-cra');

module.exports = override(config => {
  // 设置固定的输出文件名
  config.output.filename = 'static/js/main.js';
  config.output.chunkFilename = 'static/js/[name].chunk.js';
  config.output.assetModuleFilename = 'static/media/[name][ext]';

  // 禁用模块和分块的哈希
  config.optimization.moduleIds = 'named';
  config.optimization.chunkIds = 'named';

  // 确保 CSS 文件名固定
  config.plugins.forEach(plugin => {
    if (plugin.constructor.name === 'MiniCssExtractPlugin') {
      plugin.options.filename = 'static/css/main.css';
      plugin.options.chunkFilename = 'static/css/[name].chunk.css';
    }
  });

  return config;
});